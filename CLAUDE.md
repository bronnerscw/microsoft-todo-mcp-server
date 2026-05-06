# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Common Development Commands

### Build and Development

```bash
pnpm install         # Install dependencies
pnpm run build       # Build with tsup to dist/ directory
pnpm run dev         # Build and run CLI in one command
pnpm run typecheck   # Run TypeScript type checks
```

### Authentication and Setup

```bash
pnpm run auth            # Start OAuth authentication server (port 3000, override with AUTH_PORT)
pnpm run create-config   # Generate mcp.json from tokens.json
pnpm run create-manifest # Generate manifest.json for .mcpb desktop extension packaging
```

### Running the Server

```bash
pnpm run cli         # Run MCP server via CLI wrapper
pnpm start           # Run MCP server directly
```

## Architecture Overview

This is a Model Context Protocol (MCP) server that enables AI assistants to interact with Microsoft To Do via the Microsoft Graph API. The codebase follows a modular architecture with four main components:

1. **MCP Server** (`src/todo-index.ts`): Core server implementing the MCP protocol with 16 tools for Microsoft To Do operations
2. **CLI Wrapper** (`src/cli.ts`): Executable entry point that handles token loading from environment or file
3. **Auth Server** (`src/auth-server.ts`): Express server implementing OAuth 2.0 flow with MSAL (port 3000, configurable via `AUTH_PORT`)
4. **Token Manager** (`src/token-manager.ts`): Cross-platform token storage and refresh (`%APPDATA%\microsoft-todo-mcp\tokens.json` on Windows, `~/.config/microsoft-todo-mcp/tokens.json` on macOS/Linux)
5. **MCP Config Generator** (`src/create-mcp-config.ts`): Generates `mcp.json` for Claude/Cursor from `tokens.json`
6. **Manifest Generator** (`src/create-manifest.ts`): Generates `manifest.json` for `.mcpb` desktop extension packaging

### Key Architectural Patterns

- **Token Management**: Tokens are stored in `tokens.json` with automatic refresh 5 minutes before expiration
- **Multi-tenant Support**: Configurable for different Microsoft account types via TENANT_ID
- **Error Handling**: Special handling for personal Microsoft accounts (MailboxNotEnabledForRESTAPI)
- **Type Safety**: Strict TypeScript with Zod schemas for parameter validation

### Microsoft Graph API Integration

The server communicates with Microsoft Graph API v1.0:

- Base URL: `https://graph.microsoft.com/v1.0`
- Three-level hierarchy: Lists → Tasks → Checklist Items
- Supports OData query parameters for filtering and sorting

### Environment Configuration

- `MSTODO_TOKEN_FILE`: Custom path for tokens.json fallback source (the token manager's primary location is platform-specific — see Token Manager component above)
- `MS_TODO_ACCESS_TOKEN` / `MS_TODO_REFRESH_TOKEN`: Direct token injection (used by the `.mcpb` `user_config` flow)
- `AUTH_PORT`: Override the OAuth callback port (defaults to 3000). If changed, update the Redirect URI in Azure to match.
- `.env` file required for authentication with CLIENT_ID, CLIENT_SECRET, TENANT_ID, REDIRECT_URI

## Important Notes

- Always run `pnpm run build` after modifying TypeScript files (uses tsup, outputs to `dist/`)
- The auth server runs on port 3000 by default (override with `AUTH_PORT`)
- Tokens are automatically refreshed using the refresh token when needed; refreshed tokens persist to the platform-specific Token Manager location
- Personal Microsoft accounts have limited API access compared to work/school accounts (MailboxNotEnabledForRESTAPI)
- For modern Claude Desktop versions, package as a `.mcpb` desktop extension instead of relying on `claude_desktop_config.json` `mcpServers`. See README "Building a Desktop Extension (.mcpb)" for the full flow.
