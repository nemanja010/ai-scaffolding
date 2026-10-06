# Dockerized MCP Hub

## Overview

This directory defines a self-contained [MCPHub](https://github.com/samanhappy/mcphub) instance: a single Docker container hosting multiple MCP (Model Context Protocol) servers and exposing them to any MCP-compatible AI client (Claude Code, VS Code / GitHub Copilot, Cursor, OpenCode, Antigravity) over a unified HTTP/SSE endpoint.

Containerizing code-intelligence tools provides powerful capabilities—semantic search, knowledge graphs, lexical search, and language servers—without requiring developers to install multiple language runtimes (Go, Python ML packages, Node.js tools) directly on host workstations.

---

## Security: Never Commit `mcp_settings.json`

`mcp_settings.json` is bind-mounted read-write into the container. As MCPHub runs, it persists live secrets into this file: the admin password hash, bearer keys, and issued OAuth client `accessToken`/`refreshToken` pairs.

For security, `mcp_settings.json` is gitignored. Only `mcp_settings.json.example` (the template containing server definitions and non-secret OAuth settings) is committed.

To initialize your local settings:

```bash
cd .mcp-hub
cp mcp_settings.json.example mcp_settings.json
```

*(On Windows PowerShell: `Copy-Item mcp_settings.json.example mcp_settings.json`)*

---

## Directory Structure

| File                        | Purpose                                                                                                                                                 |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `Dockerfile`                | Multi-stage image build: compiles Go binaries (`cs`, `agent-lsp`, `sqls`), installs npm servers, and provisions `cocoindex-code` with cached embeddings. |
| `docker-compose.yml`        | Defines the `mcphub` service, ports, environment, networks, and volumes (workspace bind mount and persistent index volume).                             |
| `mcp_settings.json.example` | Committed template containing MCP server definitions and OAuth server configuration.                                                                    |
| `mcp_settings.json`         | **Not committed** (gitignored). MCPHub runtime configuration with live credentials and tokens.                                                          |
| `data/`                     | **Not committed** (gitignored). Additional persisted runtime state across container restarts.                                                           |

---

## Configured MCP Servers

| Server            | Command                                                                                                     | Purpose & Capabilities                                                                                                                                       | Dockerfile Provisioning                                                                                                         |
| ----------------- | ----------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------- |
| `codebase-memory` | `codebase-memory-mcp`                                                                                       | Knowledge-graph code search: call graphs, module dependencies, dead-code detection, and structural queries. Restricted to `/workspace` via `CBM_ALLOWED_ROOT`. | Pre-installed via global npm package (`codebase-memory-mcp`).                                                                    |
| `codespelunker`   | `cs --mcp --dir /workspace`                                                                                 | High-speed, relevance-ranked (BM25 + structural) code search. Instant execution without requiring pre-indexing.                                              | Built from source in `cs-builder` stage using `golang:1.26-bookworm` and copied to `/usr/local/bin/cs`.                          |
| `cocoindex_code`  | `sh -c "cd /workspace && exec ccc mcp"`                                                                     | AST-aware semantic code search over a persistent vector index using local CPU embeddings (no third-party API key required).                                  | Installed via `uv tool install 'cocoindex-code[full]'` with build-time cache pre-warming via throwaway `ccc init`.               |
| `lsp`             | `agent-lsp typescript:typescript-language-server,--stdio html:vscode-html-language-server,--stdio sql:sqls` | Compiler-grade type definitions, symbol references, and language server diagnostics for TypeScript, HTML, and SQL.                                          | `agent-lsp` and `sqls` built in Go stage; `typescript`, `typescript-language-server`, and `vscode-langservers-extracted` via npm. |
| `basic-memory`    | `uvx basic-memory mcp`                                                                                      | Persistent Markdown-based notes and memory graph for agent context and session continuity.                                                                   | Executed on demand via `uvx` bundled in base image.                                                                             |
| `filesystem`      | `npx -y @modelcontextprotocol/server-filesystem /workspace`                                                 | Direct file system read, write, and list operations scoped strictly to `/workspace`.                                                                         | Executed on demand via `npx` bundled in base image.                                                                             |

---

## High-Performance Indexing: `cocoindex_code` & Volumes

`cocoindex-code` stores index data as SQLite/LMDB databases. On Windows and macOS hosts, writing thousands of small database transactions through the Docker Desktop host bind-mount translation layer introduces severe I/O bottlenecks.

To maintain near-native indexing performance:
1. `docker-compose.yml` mounts a **native Docker volume** (`cocoindex-data`) inside the container at `/db-files`.
2. `mcp_settings.json` configures the path mapping environment variable:
   ```json
   "env": {
     "COCOINDEX_DISABLE_USAGE_TRACKING": "1",
     "COCOINDEX_CODE_DB_PATH_MAPPING": "/workspace=/db-files"
   }
   ```
3. Source files and configuration stay on the host bind mount (`/workspace`), while heavy database index writes occur entirely within the native Linux Docker volume.

> **Concurrency Warning**: Never execute `ccc` commands natively on the host workstation while the containerized `cocoindex_code` MCP server is actively indexing the same repository. Concurrent access across host and container boundaries can cause lock contention or index corruption.

---

## Quick Start

### 1. Prerequisites

- Docker Desktop installed and running.
- Ensure Docker has file-sharing permissions for your repository drive.

### 2. Configure Environment

By default, `docker-compose.yml` resolves `${WORKSPACE_ROOT:-..}`, mounting the parent directory of `.mcp-hub` as `/workspace`.

To point to an explicit path or run from outside the repository root, create a `.env` file in `.mcp-hub/`:

```dotenv
WORKSPACE_ROOT=/path/to/your/monorepo
```

*(On Windows hosts, use forward slashes or standard drive paths: `WORKSPACE_ROOT=D:/code/my-project`)*

### 3. Bootstrap Configuration

```bash
cd .mcp-hub
cp mcp_settings.json.example mcp_settings.json
```

### 4. Build and Start

```bash
docker compose up -d --build
```

*Note: The initial image build compiles Go binaries and downloads sentence-transformer models for local embeddings. Subsequent startups are instantaneous.*

### 5. Access Endpoints

- **Web Dashboard**: `http://localhost:3000`
  - Manage server configurations and inspect tool registrations.
  - If `ADMIN_PASSWORD` was not set in `docker-compose.yml`, inspect container logs for the generated password:
    ```bash
    docker compose logs mcphub | grep -i password
    ```
- **Unified MCP Endpoint**: `http://localhost:3000/mcp`
  - Connect your IDE or agent harness to this endpoint to access all configured tools.
- **Individual Server Endpoint**: `http://localhost:3000/mcp/{server_name}` (e.g. `http://localhost:3000/mcp/cocoindex_code`)

### 6. Stop Container

```bash
docker compose down
```

*(This preserves the `cocoindex-data` volume and `./data`. Use `docker compose down -v` only if you explicitly want to purge the search indices.)*

---

## Adding Custom MCP Servers

To introduce additional tools, add an entry under `mcpServers` in `mcp_settings.json`:

```json
"my-custom-tool": {
  "command": "npx",
  "args": ["-y", "@modelcontextprotocol/server-example"],
  "env": {
    "DEBUG": "true"
  }
}
```

- **npm packages**: Run on demand via `npx` or pre-install globally in `Dockerfile` (`RUN npm install -g <pkg>`) to speed up startup.
- **Python packages**: Run on demand via `uvx` or pre-install with `RUN uv tool install <pkg>`.
- **Compiled binaries**: Add build instructions to the `cs-builder` stage in `Dockerfile` and copy the resulting binary into `/usr/local/bin/`.

Changes to `mcp_settings.json` take effect immediately or can be reloaded via the dashboard. Modifications to `Dockerfile` require rebuilding:

```bash
docker compose up -d --build
```

---

## Troubleshooting

- **Subprocess fails with "command not found"**:
  Confirm the tool binary is present in the container:
  ```bash
  docker exec mcphub which <binary-name>
  ```
- **`cocoindex_code` indexing status**:
  Check indexing progress directly inside the container:
  ```bash
  docker exec mcphub sh -c "ccc daemon status"
  ```
- **Review container logs**:
  ```bash
  docker compose logs -f mcphub
  ```
