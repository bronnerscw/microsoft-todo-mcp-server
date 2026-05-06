#!/usr/bin/env node

import fs from "fs"
import path from "path"
import { fileURLToPath } from "url"

// Get the directory path for the current module
const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Default paths
const projectRoot = process.cwd()
const packageJsonPath = path.join(projectRoot, "package.json")
const outputPath = process.argv[2] || path.join(projectRoot, "manifest.json")

console.log(`Reading metadata from: ${packageJsonPath}`)
console.log(`Writing manifest to: ${outputPath}`)

try {
  // Read package.json for name/version/description/etc.
  const pkg = JSON.parse(fs.readFileSync(packageJsonPath, "utf8"))

  const manifest: Record<string, unknown> = {
    manifest_version: "0.3",
    name: pkg.name || "microsoft-todo",
    display_name: "Microsoft To Do",
    version: pkg.version,
    description: pkg.description || "Microsoft To Do via the Microsoft Graph API",
    long_description:
      "Manage Microsoft To Do task lists, tasks, and checklist items via the Microsoft Graph API. " +
      "Optimized for Microsoft 365 work/school accounts. Personal Microsoft accounts have limited API access (MailboxNotEnabledForRESTAPI).",
    author:
      typeof pkg.author === "string"
        ? { name: pkg.author }
        : pkg.author || { name: "Unknown" },
    server: {
      type: "node",
      entry_point: "dist/cli.js",
      mcp_config: {
        command: "node",
        args: ["${__dirname}/dist/cli.js"],
        env: {
          CLIENT_ID: "${user_config.client_id}",
          CLIENT_SECRET: "${user_config.client_secret}",
          TENANT_ID: "${user_config.tenant_id}",
          MS_TODO_ACCESS_TOKEN: "${user_config.access_token}",
          MS_TODO_REFRESH_TOKEN: "${user_config.refresh_token}",
        },
      },
    },
    user_config: {
      client_id: {
        type: "string",
        title: "Azure App Client ID",
        description: "Application (client) ID from your Azure App Registration",
        required: true,
      },
      client_secret: {
        type: "string",
        title: "Azure App Client Secret",
        description: "Secret value from Azure > Certificates & secrets",
        required: true,
        sensitive: true,
      },
      tenant_id: {
        type: "string",
        title: "Azure Tenant ID",
        description: "Tenant GUID, or 'organizations' / 'common' / 'consumers'",
        required: true,
        default: "organizations",
      },
      access_token: {
        type: "string",
        title: "Initial Access Token",
        description:
          "From tokens.json after running 'pnpm run auth'. Will be refreshed automatically once running.",
        required: true,
        sensitive: true,
      },
      refresh_token: {
        type: "string",
        title: "Initial Refresh Token",
        description:
          "From tokens.json after 'pnpm run auth'. Used by the server to renew the access token.",
        required: true,
        sensitive: true,
      },
    },
    keywords: pkg.keywords || ["microsoft", "todo", "tasks", "graph", "productivity"],
    license: pkg.license || "MIT",
    compatibility: {
      platforms: ["win32", "darwin", "linux"],
      runtimes: {
        node: ">=18.0.0",
      },
    },
  }

  // Optional fields pulled from package.json if present
  if (pkg.repository) manifest.repository = pkg.repository
  if (pkg.homepage) manifest.homepage = pkg.homepage
  if (pkg.bugs?.url) manifest.support = pkg.bugs.url

  // Include icon reference only if icon.png exists at project root
  const iconPath = path.join(projectRoot, "icon.png")
  if (fs.existsSync(iconPath)) {
    manifest.icon = "icon.png"
  }

  fs.writeFileSync(outputPath, JSON.stringify(manifest, null, 2) + "\n", "utf8")

  console.log("\nmanifest.json created successfully!\n")
  console.log("Next steps to bundle the .mcpb extension:")
  console.log("  1. npm install -g @anthropic-ai/mcpb       (one time)")
  console.log("  2. pnpm run build                           (refresh dist/)")
  console.log("  3. Stage a prod-only bundle directory:")
  console.log("       mkdir bundle && xcopy /E /I dist bundle\\dist")
  console.log("       copy package.json bundle\\")
  console.log("       copy manifest.json bundle\\")
  console.log("       cd bundle && npm install --omit=dev --no-package-lock && cd ..")
  console.log(`  4. mcpb pack bundle microsoft-todo-${pkg.version}.mcpb`)
  console.log("  5. Double-click the .mcpb to install in Claude Desktop")
} catch (error) {
  const errorMessage = error instanceof Error ? error.message : String(error)
  console.error("Error creating manifest:", errorMessage)
  process.exit(1)
}
