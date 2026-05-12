// src/token-manager.ts
import { readFileSync, writeFileSync, existsSync, mkdirSync } from "fs"
import { join } from "path"
import { homedir } from "os"

interface TokenData {
  accessToken: string
  refreshToken: string
  expiresAt: number
}

interface StoredTokenData extends TokenData {
  clientId?: string
  clientSecret?: string
  tenantId?: string
}

export class TokenManager {
  private tokenFilePath: string
  private currentTokens: StoredTokenData | null = null

  constructor() {
    // Store tokens in a consistent location across platforms
    const configDir =
      process.platform === "win32"
        ? join(process.env.APPDATA || join(homedir(), "AppData", "Roaming"), "microsoft-todo-mcp")
        : join(homedir(), ".config", "microsoft-todo-mcp")

    // Create directory if it doesn't exist
    if (!existsSync(configDir)) {
      mkdirSync(configDir, { recursive: true })
    }

    this.tokenFilePath = join(configDir, "tokens.json")
    console.error(`Token file path: ${this.tokenFilePath}`)
  }

  // Try to get tokens from multiple sources
  async getTokens(): Promise<TokenData | null> {
    // 1. Prefer the stored token file — it has the real expiresAt plus
    //    clientId/clientSecret/tenantId needed to refresh.
    if (existsSync(this.tokenFilePath)) {
      try {
        const data = readFileSync(this.tokenFilePath, "utf8")
        this.currentTokens = JSON.parse(data)

        if (this.currentTokens) {
          if (Date.now() > this.currentTokens.expiresAt) {
            const refreshed = await this.refreshToken(this.currentTokens.refreshToken)
            if (refreshed) {
              return refreshed
            }
          }
          return this.currentTokens
        }
      } catch (error) {
        console.error("Error reading token file:", error)
      }
    }

    // 2. Legacy token file in cwd — migrate to canonical location.
    const legacyPath = join(process.cwd(), "tokens.json")
    if (existsSync(legacyPath)) {
      try {
        const data = readFileSync(legacyPath, "utf8")
        const tokens = JSON.parse(data)
        this.saveTokens(tokens)
        return tokens
      } catch (error) {
        console.error("Error reading legacy token file:", error)
      }
    }

    // 3. Last-resort fallback: env-injected tokens. No real expiry is known
    //    here, so mark them stale and try to refresh immediately. Refresh
    //    requires CLIENT_ID/CLIENT_SECRET in env — if those aren't set,
    //    return the raw env token and rely on the 401-retry path.
    if (process.env.MS_TODO_ACCESS_TOKEN && process.env.MS_TODO_REFRESH_TOKEN) {
      if (process.env.CLIENT_ID && process.env.CLIENT_SECRET) {
        const refreshed = await this.refreshToken(process.env.MS_TODO_REFRESH_TOKEN)
        if (refreshed) {
          return refreshed
        }
      }
      return {
        accessToken: process.env.MS_TODO_ACCESS_TOKEN,
        refreshToken: process.env.MS_TODO_REFRESH_TOKEN,
        expiresAt: 0,
      }
    }

    return null
  }

  // Force a refresh using whatever refresh token we currently have on hand.
  // Called from the 401-retry path when Graph rejects a token the manager
  // still believes is valid.
  async forceRefresh(): Promise<TokenData | null> {
    const refreshToken =
      this.currentTokens?.refreshToken || process.env.MS_TODO_REFRESH_TOKEN
    if (!refreshToken) {
      return null
    }
    return this.refreshToken(refreshToken)
  }

  async refreshToken(refreshToken: string): Promise<TokenData | null> {
    try {
      // Get client credentials from stored tokens or environment
      const clientId = this.currentTokens?.clientId || process.env.CLIENT_ID
      const clientSecret = this.currentTokens?.clientSecret || process.env.CLIENT_SECRET
      const tenantId = this.currentTokens?.tenantId || process.env.TENANT_ID || "organizations"

      if (!clientId || !clientSecret) {
        console.error("Missing client credentials for token refresh")
        return null
      }

      const tokenEndpoint = `https://login.microsoftonline.com/${tenantId}/oauth2/v2.0/token`

      const formData = new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        refresh_token: refreshToken,
        grant_type: "refresh_token",
        scope: "offline_access Tasks.Read Tasks.ReadWrite Tasks.Read.Shared Tasks.ReadWrite.Shared User.Read",
      })

      const response = await fetch(tokenEndpoint, {
        method: "POST",
        headers: {
          "Content-Type": "application/x-www-form-urlencoded",
        },
        body: formData,
      })

      if (!response.ok) {
        const errorText = await response.text()
        console.error(`Token refresh failed: ${errorText}`)

        // If refresh fails, prompt for re-authentication
        this.promptForReauth()
        return null
      }

      const data = await response.json()

      const newTokens: StoredTokenData = {
        accessToken: data.access_token,
        refreshToken: data.refresh_token || refreshToken,
        expiresAt: Date.now() + data.expires_in * 1000 - 5 * 60 * 1000, // 5 min buffer
        clientId,
        clientSecret,
        tenantId,
      }

      // Save the refreshed tokens
      this.saveTokens(newTokens)

      return newTokens
    } catch (error) {
      console.error("Error refreshing token:", error)
      this.promptForReauth()
      return null
    }
  }

  saveTokens(tokens: StoredTokenData): void {
    this.currentTokens = tokens
    writeFileSync(this.tokenFilePath, JSON.stringify(tokens, null, 2), "utf8")
  }

  promptForReauth(): void {
    console.error(`
=================================================================
TOKEN REFRESH FAILED - REAUTHENTICATION REQUIRED

Your Microsoft To Do tokens have expired and could not be refreshed.

To fix this:
1. Open a new terminal
2. Navigate to the microsoft-todo-mcp-server directory
3. Run: pnpm run auth
4. Complete the authentication in your browser
5. Restart Claude Desktop to use the new tokens

Your tokens are stored in: ${this.tokenFilePath}
=================================================================
    `)
  }

  // Store client credentials with tokens for future refreshes
  async storeCredentials(clientId: string, clientSecret: string, tenantId: string): Promise<void> {
    if (this.currentTokens) {
      this.currentTokens.clientId = clientId
      this.currentTokens.clientSecret = clientSecret
      this.currentTokens.tenantId = tenantId
      this.saveTokens(this.currentTokens)
    }
  }
}

export const tokenManager = new TokenManager()
