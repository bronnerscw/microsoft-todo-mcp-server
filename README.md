# Microsoft To Do MCP

[![CI](https://github.com/jordanburke/microsoft-todo-mcp-server/actions/workflows/ci.yml/badge.svg)](https://github.com/jordanburke/microsoft-todo-mcp-server/actions/workflows/ci.yml)
[![npm version](https://badge.fury.io/js/microsoft-todo-mcp-server.svg)](https://www.npmjs.com/package/microsoft-todo-mcp-server)

A Model Context Protocol (MCP) server that enables AI assistants like Claude and Cursor to interact with Microsoft To Do via the Microsoft Graph API. This service provides comprehensive task management capabilities through a secure OAuth 2.0 authentication flow.

## Features

- **16 MCP Tools**: Complete task management functionality including lists, tasks, checklist items, organization features, and archival
- **Seamless Authentication**: Automatic token refresh with zero manual intervention
- **OAuth 2.0 Authentication**: Secure authentication with automatic token refresh
- **Microsoft Graph API Integration**: Direct integration with Microsoft's official API
- **Multi-tenant Support**: Works with personal, work, and school Microsoft accounts
- **TypeScript**: Fully typed for reliability and developer experience
- **ESM Modules**: Modern JavaScript module system

## Prerequisites

- Node.js 16 or higher (tested with Node.js 18.x, 20.x, and 22.x)
- pnpm package manager
- A Microsoft account (personal, work, or school)
- Azure App Registration (see setup below)

## Installation

### Option 1: Global Installation (Recommended)

```bash
# Install globally using npm
npm install -g microsoft-todo-mcp-server

# Or using pnpm
pnpm install -g microsoft-todo-mcp-server

# Or run directly with npx (no installation)
npx microsoft-todo-mcp-server
```

The package provides three command aliases:

- `microsoft-todo-mcp-server` - Full package name
- `mstodo` - Short alias for the MCP server
- `mstodo-config` - Configuration helper tool

### Option 2: Clone and Run Locally

```bash
git clone https://github.com/jordanburke/microsoft-todo-mcp-server.git
cd microsoft-todo-mcp-server
pnpm install
pnpm run build
```

### Option 3: Desktop Extension (.mcpb) for Claude Desktop

Newer Claude Desktop versions manage local MCP servers through the [`.mcpb` extension format](https://github.com/modelcontextprotocol/mcpb) (Settings → Extensions) rather than the legacy `claude_desktop_config.json` `mcpServers` block. If your Claude Desktop ignores `mcpServers` entries you add to that file, you'll need to package this server as a `.mcpb` extension. See [Building a Desktop Extension (.mcpb)](#building-a-desktop-extension-mcpb) below for the full packaging and install flow.

## Azure App Registration

1. Go to the [Azure Portal](https://portal.azure.com)
2. Navigate to "App registrations" and create a new registration
3. Name your application (e.g., "To Do MCP")
4. For "Supported account types", select one of the following based on your needs:
   - **Accounts in this organizational directory only (Single tenant)** - For use within a single organization
   - **Accounts in any organizational directory (Any Azure AD directory - Multitenant)** - For use across multiple organizations
   - **Accounts in any organizational directory and personal Microsoft accounts** - For both work accounts and personal accounts
5. Set the Redirect URI to `http://localhost:3000/callback`
6. After creating the app, go to "Certificates & secrets" and create a new client secret
7. Go to "API permissions" and add the following permissions:
   - Microsoft Graph > Delegated permissions:
     - Tasks.Read
     - Tasks.ReadWrite
     - User.Read
8. Click "Grant admin consent" for these permissions

## Configuration

### Environment Setup

Create a `.env` file in the project root (required for authentication):

```env
CLIENT_ID=your_client_id
CLIENT_SECRET=your_client_secret
TENANT_ID=your_tenant_setting
REDIRECT_URI=http://localhost:3000/callback
```

### TENANT_ID Options

- `organizations` - For multi-tenant organizational accounts (default if not specified)
- `consumers` - For personal Microsoft accounts only
- `common` - For both organizational and personal accounts
- `your-specific-tenant-id` - For single-tenant configurations

**Examples:**

```env
# For multi-tenant organizational accounts (default)
TENANT_ID=organizations

# For personal Microsoft accounts
TENANT_ID=consumers

# For both organizational and personal accounts
TENANT_ID=common

# For a specific organization tenant
TENANT_ID=00000000-0000-0000-0000-000000000000
```

### Token Storage

The server stores authentication tokens with automatic refresh 5 minutes before expiration. The default location is platform-aware:

- **Windows**: `%APPDATA%\microsoft-todo-mcp\tokens.json`
- **macOS/Linux**: `~/.config/microsoft-todo-mcp/tokens.json`

You can override the location or provide tokens directly via environment variables:

```bash
# Override the token file location (used by the CLI as a fallback source)
export MSTODO_TOKEN_FILE=/path/to/custom/tokens.json

# Provide tokens directly (used as the initial source on startup)
export MS_TODO_ACCESS_TOKEN=your_access_token
export MS_TODO_REFRESH_TOKEN=your_refresh_token
```

### Auth Server Port

The OAuth callback server (`pnpm run auth`) listens on port 3000 by default. Override with `AUTH_PORT` if 3000 is taken:

```bash
AUTH_PORT=3001 pnpm run auth
```

If you change the port, update the **Redirect URI** in your Azure App Registration to match (e.g. `http://localhost:3001/callback`).

## Usage

### Complete Setup Workflow

#### Step 1: Authenticate with Microsoft

```bash
# If installed globally
git clone https://github.com/jordanburke/microsoft-todo-mcp-server.git
cd microsoft-todo-mcp-server
pnpm install
pnpm run auth

# Or if running locally
pnpm run auth
```

This opens a browser window for Microsoft authentication and creates a `tokens.json` file.

#### Step 2: Create MCP Configuration

```bash
# Generate MCP configuration file
pnpm run create-config

# Or use the global helper (if installed globally)
mstodo-config
```

This creates an `mcp.json` file with your authentication tokens.

#### Step 3: Configure Your AI Assistant

**For Claude Desktop:**

Add to your configuration file:

- **macOS**: `~/Library/Application Support/Claude/claude_desktop_config.json`
- **Windows**: `%APPDATA%\Claude\claude_desktop_config.json`
- **Linux**: `~/.config/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "microsoftTodo": {
      "command": "npx",
      "args": ["--yes", "microsoft-todo-mcp-server"],
      "env": {
        "MS_TODO_ACCESS_TOKEN": "your_access_token",
        "MS_TODO_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

**For Cursor:**

```bash
# Copy to Cursor's global configuration
cp mcp.json ~/.cursor/mcp-servers.json
```

### Available Scripts

```bash
# Development & Building
pnpm run build        # Build TypeScript to JavaScript
pnpm run dev          # Build and run CLI in one command

# Running the Server
pnpm start            # Run MCP server directly
pnpm run cli          # Run MCP server via CLI wrapper
npx microsoft-todo-mcp-server  # Run globally installed version

# Authentication & Configuration
pnpm run auth            # Start OAuth authentication server
pnpm run create-config   # Generate mcp.json from tokens.json
pnpm run create-manifest # Generate manifest.json for .mcpb packaging

# Code Quality
pnpm run format       # Format code with Prettier
pnpm run format:check # Check code formatting
pnpm run lint         # Run linting checks
pnpm run typecheck    # TypeScript type checking
```

## Building a Desktop Extension (.mcpb)

Modern Claude Desktop versions install local MCP servers as **Desktop Extensions** (`.mcpb` files) via Settings → Extensions, rather than honoring `mcpServers` entries in `claude_desktop_config.json`. If your Claude Desktop falls in that bucket, package this server as a `.mcpb` extension using the official [Anthropic MCPB tooling](https://github.com/modelcontextprotocol/mcpb).

### Prerequisites

Install the packaging CLI globally (one time):

```bash
npm install -g @anthropic-ai/mcpb
```

### Step 1: Generate the manifest

`manifest.json` describes the extension and the values Claude Desktop should prompt for at install time. Generate one from `package.json`:

```bash
pnpm run build           # Refresh dist/
pnpm run create-manifest # Writes manifest.json to project root
```

The generated manifest declares five `user_config` fields the user fills in via the install dialog:

| Field | Description | Sensitive |
|---|---|---|
| `client_id` | Azure App Registration Application (client) ID | No |
| `client_secret` | Azure App Registration secret value | Yes |
| `tenant_id` | Tenant GUID, or `organizations` / `common` / `consumers` | No |
| `access_token` | Initial access token from `tokens.json` | Yes |
| `refresh_token` | Initial refresh token from `tokens.json` | Yes |

Sensitive fields are masked in the install dialog and stored encrypted by Claude Desktop. If you place an `icon.png` (recommended: 128×128 PNG) at the project root before running `create-manifest`, it will be referenced automatically.

### Step 2: Stage a production-only bundle

Because `tsup` does not bundle dependencies into `dist/cli.js`, the `.mcpb` archive must include `node_modules`. To avoid shipping ~200 MB of devDependencies, stage a clean directory with production deps only.

**Windows (cmd):**

```bash
mkdir bundle
xcopy /E /I dist bundle\dist
copy package.json bundle\
copy manifest.json bundle\
cd bundle && npm install --omit=dev --no-package-lock && cd ..
```

**macOS/Linux:**

```bash
mkdir -p bundle
cp -r dist bundle/dist
cp package.json manifest.json bundle/
(cd bundle && npm install --omit=dev --no-package-lock)
```

### Step 3: Pack

```bash
mcpb pack bundle microsoft-todo-1.1.3.mcpb
```

This produces `microsoft-todo-1.1.3.mcpb` (a zip archive with `manifest.json`, `dist/`, `node_modules/`, and `package.json`) at the project root.

### Step 4: Install in Claude Desktop

1. Double-click the `.mcpb` file. Claude Desktop opens an install dialog with the extension name, description, and a form for the five `user_config` fields.
2. Fill in your Azure App Registration credentials and the access/refresh tokens from your `tokens.json` (run `pnpm run auth` first if you don't have one).
3. Click **Install**. The extension appears under **Settings → Extensions** and the MCP server starts automatically.

### Token refresh and reauthentication

The server reads the initial tokens from environment variables (set by Claude Desktop from your `user_config` values), then writes refreshed tokens to the platform-specific location described under [Token Storage](#token-storage). If the access token expires and the refresh token can no longer renew it (typically after extended inactivity, password change, or MFA event), the server logs a `REAUTHENTICATION REQUIRED` message. To recover:

1. Run `pnpm run auth` in a clone of this repo to generate a fresh `tokens.json`.
2. Open Claude Desktop → **Settings → Extensions → Microsoft To Do → Configure**.
3. Update the **Initial Access Token** and **Initial Refresh Token** fields with the new values.

### Build artifacts

The bundling flow produces files that should not be committed. The project `.gitignore` already excludes them:

```gitignore
bundle/
*.mcpb
mcp.json
tokens.json
```

## MCP Tools

The server provides 16 tools for comprehensive Microsoft To Do management:

### Authentication

- **`auth-status`** - Check authentication status, token expiration, and account type

### Task Lists (Top-level Containers)

- **`get-task-lists`** - Retrieve all task lists with metadata (default, shared, etc.)
- **`get-task-lists-organized`** - Render task lists as a grouped tree view. `groupBy: "category"` (default) buckets lists using **hardcoded regex patterns on display names** (emoji prefixes like `🛒`/`🏡`/`👪`, plus literal matches like `Work`, `SBIR`, `Rangeley`) — these patterns reflect the upstream author's naming conventions and will mostly fall through to "Other Lists" for unrelated accounts. `groupBy: "shared"` splits shared vs. personal lists (account-agnostic). Optional `includeIds` appends an ID reference table.
- **`create-task-list`** - Create a new task list
- **`update-task-list`** - Rename an existing task list
- **`delete-task-list`** - Delete a task list and all its contents

### Tasks (Main Todo Items)

- **`get-tasks`** - Get tasks from a list with filtering, sorting, and pagination
  - Supports OData query parameters: `$filter`, `$select`, `$orderby`, `$top`, `$skip`, `$count`
- **`create-task`** - Create a new task with full property support
  - Title, description, due date, start date, importance, reminders, status, categories
- **`update-task`** - Update any task properties
- **`delete-task`** - Delete a task and all its checklist items
- **`archive-completed-tasks`** - Move completed tasks older than `olderThanDays` (default 90) from `sourceListId` to `targetListId` by recreating them in the target list and deleting the originals. The target archive list must already exist. Supports `dryRun` to preview which tasks would be moved without making changes.

### Checklist Items (Subtasks)

- **`get-checklist-items`** - Get subtasks for a specific task
- **`create-checklist-item`** - Add a new subtask to a task
- **`update-checklist-item`** - Update subtask text or completion status
- **`delete-checklist-item`** - Remove a specific subtask

### Developer Tools

- **`test-graph-api-exploration`** - Diagnostic tool for probing the Microsoft Graph `/me/todo` API surface. Runs `$select=*`, tries various `$expand` values, dumps response headers, queries the extensions endpoint, and probes for undocumented endpoints (`/folders`, `/groups`, `/listGroups`, etc.). Intended for development/debugging only — not useful for normal task management.

## Architecture

### Project Structure

- **MCP Server** (`src/todo-index.ts`) - Core server implementing the MCP protocol
- **CLI Wrapper** (`src/cli.ts`) - Executable entry point with token management
- **Auth Server** (`src/auth-server.ts`) - Express server for OAuth 2.0 flow
- **Config Generator** (`src/create-mcp-config.ts`) - Helper to create MCP configurations

### Technical Details

- **Microsoft Graph API**: Uses v1.0 endpoints
- **Authentication**: MSAL (Microsoft Authentication Library) with PKCE flow
- **Token Management**: Automatic refresh 5 minutes before expiration
- **Build System**: tsup for fast TypeScript compilation
- **Module System**: ESM (ECMAScript modules)

## Limitations & Known Issues

### Personal Microsoft Accounts

- **MailboxNotEnabledForRESTAPI Error**: Personal Microsoft accounts (outlook.com, hotmail.com, live.com) have limited access to the To Do API through Microsoft Graph
- This is a Microsoft service limitation, not an issue with this application
- Work/school accounts have full API access

### API Limitations

- Rate limits apply according to Microsoft's policies
- Some features may be unavailable for personal accounts
- Shared lists have limited functionality

## Troubleshooting

### Authentication Issues

**Token acquisition failures**

- Verify `CLIENT_ID`, `CLIENT_SECRET`, and `TENANT_ID` in your `.env` file
- Ensure redirect URI matches exactly: `http://localhost:3000/callback` (or `http://localhost:<AUTH_PORT>/callback` if you customized the port)
- Check Azure App permissions are granted with admin consent
- If port 3000 is in use, set `AUTH_PORT=<other port>` and update the Redirect URI in Azure to match

**Permission issues**

- Ensure all required Graph API permissions are added and consented
- For organizational accounts, admin consent may be required

### Account Type Configuration

**Work/School Accounts**

```env
TENANT_ID=organizations  # Multi-tenant
# Or use your specific tenant ID
```

**Personal Accounts**

```env
TENANT_ID=consumers  # Personal only
# Or TENANT_ID=common for both types
```

### Debugging

**Check authentication status:**

```bash
# Using the MCP tool
# In your AI assistant: "Check auth status"

# Or examine tokens directly
cat tokens.json | jq '.expiresAt'

# Convert timestamp to readable date
date -d @$(($(cat tokens.json | jq -r '.expiresAt') / 1000))
```

**Enable verbose logging:**

```bash
# The server logs to stderr for debugging
mstodo 2> debug.log
```

## Contributing

Contributions are welcome! Please:

1. Fork the repository
2. Create a feature branch
3. Run `pnpm run lint` and `pnpm run typecheck` before submitting
4. Submit a pull request

## License

MIT License - See [LICENSE](LICENSE) file for details

## Acknowledgments

- Fork of [@jhirono/todomcp](https://github.com/jhirono/todomcp)
- Built on the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [Microsoft Graph API](https://developer.microsoft.com/en-us/graph)

## Support

- [GitHub Issues](https://github.com/jordanburke/microsoft-todo-mcp-server/issues)
- [npm Package](https://www.npmjs.com/package/microsoft-todo-mcp-server)
