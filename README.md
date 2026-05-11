# Microsoft To Do MCP

A Model Context Protocol (MCP) server that enables AI assistants like Claude and Cursor to interact with Microsoft To Do via the Microsoft Graph API. This service provides comprehensive task management capabilities through a secure OAuth 2.0 authentication flow.

This is the [bronnerscw](https://github.com/bronnerscw/microsoft-todo-mcp-server) fork of [jordanburke/microsoft-todo-mcp-server](https://github.com/jordanburke/microsoft-todo-mcp-server). It is not published to npm — install by cloning this repo. Anything you generate (such as `mcp.json`) points at this fork's local build, not the upstream npm package.

## Features

- **15 MCP Tools**: Complete task management functionality including lists, tasks, checklist items, and organization features
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

Clone this fork and build it locally:

```bash
git clone https://github.com/bronnerscw/microsoft-todo-mcp-server.git
cd microsoft-todo-mcp-server
pnpm install
pnpm run build
```

The build produces three executables under `dist/`:

- `dist/cli.js` — MCP server (run with `node dist/cli.js` or `pnpm run cli`)
- `dist/auth-server.js` — OAuth flow (run with `pnpm run auth`)
- `dist/create-mcp-config.js` — `mcp.json` generator (run with `pnpm run create-config`)

> Installing globally via `npm install -g microsoft-todo-mcp-server` would fetch the upstream npm package, not this fork. Don't do that.

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

The server stores authentication tokens in `tokens.json` with automatic refresh 5 minutes before expiration. You can override the token file location:

```bash
# Using environment variable
export MSTODO_TOKEN_FILE=/path/to/custom/tokens.json

# Or pass tokens directly
export MS_TODO_ACCESS_TOKEN=your_access_token
export MS_TODO_REFRESH_TOKEN=your_refresh_token
```

## Usage

### Complete Setup Workflow

#### Step 1: Authenticate with Microsoft

```bash
pnpm run auth
```

This opens a browser window for Microsoft authentication and creates a `tokens.json` file in the project root.

#### Step 2: Create MCP Configuration

```bash
# Generate MCP configuration file
pnpm run create-config
```

This creates an `mcp.json` in the project root with your authentication tokens. The generated config invokes the MCP server as `node <absolute path to this clone's dist/cli.js>`, so your AI assistant runs this fork's build directly. The path is derived from the location of `create-mcp-config.js` itself, so moving or rebuilding the clone in place keeps the path correct; if you relocate the clone after generating, regenerate `mcp.json`.

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
      "command": "node",
      "args": ["/absolute/path/to/microsoft-todo-mcp-server/dist/cli.js"],
      "env": {
        "MS_TODO_ACCESS_TOKEN": "your_access_token",
        "MS_TODO_REFRESH_TOKEN": "your_refresh_token"
      }
    }
  }
}
```

Replace `/absolute/path/to/microsoft-todo-mcp-server` with the absolute path to your clone of this fork. Running `pnpm run create-config` produces an `mcp.json` with this exact path already filled in.

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

# Authentication & Configuration
pnpm run auth         # Start OAuth authentication server
pnpm run create-config # Generate mcp.json from tokens.json

# Code Quality
pnpm run format       # Format code with Prettier
pnpm run format:check # Check code formatting
pnpm run lint         # Run linting checks
pnpm run typecheck    # TypeScript type checking
```

## MCP Tools

The server provides 13 tools for comprehensive Microsoft To Do management:

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
- **Config Generator** (`src/create-mcp-config.ts`) - Helper to create `mcp.json` for the `mcpServers` config block

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
- Ensure redirect URI matches exactly: `http://localhost:3000/callback`
- Check Azure App permissions are granted with admin consent

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
node dist/cli.js 2> debug.log
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

- Fork of [jordanburke/microsoft-todo-mcp-server](https://github.com/jordanburke/microsoft-todo-mcp-server), itself a fork of [@jhirono/todomcp](https://github.com/jhirono/todomcp)
- Built on the [Model Context Protocol SDK](https://github.com/modelcontextprotocol/sdk)
- Uses [Microsoft Graph API](https://developer.microsoft.com/en-us/graph)

## Support

- [GitHub Issues](https://github.com/bronnerscw/microsoft-todo-mcp-server/issues)
