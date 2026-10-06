# Multi-stage build for Go-based language servers and search tools:
# cs (codespelunker), agent-lsp, and sqls have no npm/pip packages - they are Go
# binaries. Build them from source in a throwaway stage using the Go toolchain.
# agent-lsp requires Go >= 1.26.1.
FROM golang:1.26-bookworm AS cs-builder
RUN go install github.com/boyter/cs/v3@latest
RUN go install github.com/blackwell-systems/agent-lsp/cmd/agent-lsp@latest
RUN go install github.com/sqls-server/sqls@latest

# Start from the base mcphub image.
# It already ships Node.js/pnpm, Python, uv/uvx and Git, so basic-memory (uvx)
# and npm-based tools work without additional system packages.
FROM samanhappy/mcphub:latest

# Install codebase-memory-mcp globally (ships a prebuilt native binary via npm)
RUN npm install -g codebase-memory-mcp

# Install underlying LSP servers orchestrated by agent-lsp for TypeScript,
# HTML, and (via Go-built sqls above) SQL.
RUN npm install -g typescript typescript-language-server vscode-langservers-extracted

# Install cocoindex-code (ccc) - AST-aware semantic code search / MCP server.
# The [full] extra bundles sentence-transformers so local embeddings work
# without an external API key.
RUN uv tool install --upgrade 'cocoindex-code[full]'
ENV PATH="/root/.local/bin:${PATH}"

# Pre-create global settings (~/.cocoindex_code/global_settings.yml) and cache
# the default embedding model at build time, so containers do not need a manual
# `ccc init` after every restart.
# Run against a throwaway directory - per-project settings and index for your
# actual repository live in /workspace/.cocoindex_code (or in a mapped volume).
RUN mkdir -p /tmp/ccc-init-scratch \
    && cd /tmp/ccc-init-scratch \
    && COCOINDEX_DISABLE_USAGE_TRACKING=1 ccc init \
    && cd / && rm -rf /tmp/ccc-init-scratch

# Copy the Go binaries built in builder stage
COPY --from=cs-builder /go/bin/cs /usr/local/bin/cs
COPY --from=cs-builder /go/bin/agent-lsp /usr/local/bin/agent-lsp
COPY --from=cs-builder /go/bin/sqls /usr/local/bin/sqls

# Set working directory
WORKDIR /app
