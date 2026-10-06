# AI Scaffolding Repository Design

## Overview
A reusable boilerplate repository (`ai-scaffolding`) designed to bootstrap AI-assisted software engineering across multi-agent harnesses for any monorepo project.

Supports:
- **OpenCode** (`.opencode/`)
- **VS Code & GitHub Copilot** (`.github/`, `.vscode/`)
- **Antigravity CLI (`agy`) & IDE** (`.antigravity/`, `GEMINI.md`, `AGENTS.md`)
- **Claude Code** (`CLAUDE.md`, `AGENTS.md`)

## Key Principles
1. **Zero Product Leakage**: Completely clean monorepo architecture with no legacy domain assumptions or product ties. Uses clean monorepo placeholders (`apps/`, `libs/`).
2. **OpenSpec-First Intent-Driven Workflow**: Includes custom `intent-driven` schema (proposal -> specs -> design -> adr -> tasks), Gherkin-style behavior scenarios, and living specification management under `openspec/specs/<domain>/<capability>/spec.md`.
3. **Dynamic Domain Governance**: Governed by `openspec/domains.yaml` and `openspec/GOVERNANCE.md`. AI agents are instructed on how to discover active domains dynamically and follow high-friction gates before introducing new domains.
4. **General & Battle-Tested Skills Suite**: Contains vendored skills for process discipline (brainstorming, writing-plans, TDD, systematic debugging, code review, branch finishing, worktrees, ADRs, C4 diagrams, context engineering) and frontend stack guidance (Angular). Excludes domain-specific and proprietary UI library skills.
5. **Universal Instructions Hierarchy**: `AGENTS.md` is the canonical instructions file, directly referenced by `GEMINI.md` and `CLAUDE.md`, and paired with `.github/instructions/`.
6. **Dockerized MCP Hub**: `.mcp-hub/` provides containerized semantic search (`cocoindex_code`), knowledge graph (`codebase-memory`), BM25 instant search (`codespelunker`), and language servers (`agent-lsp`), accessible via `http://localhost:3000/mcp`.

## Repository Structure
```
ai-scaffolding/
├── .agents/
│   └── skills/                       # Curated engineering & Angular skills
├── .agent-workspace/                 # Scratch space for agent state & resume tokens (.keep)
├── .antigravity/
│   └── mcp.json                      # Antigravity CLI & IDE MCP configuration
├── .github/
│   ├── agents/                       # Generic advisory agents (Architect, UX, DevOps, Docs)
│   ├── instructions/                 # Always-on instructions (Anti-Fabrication, Project Context, Governance)
│   └── prompts/                      # Slash-command prompts (Code Review, Update Note, Spec Audit)
├── .mcp-hub/
│   ├── Dockerfile                    # Container definition for MCP Hub
│   ├── docker-compose.yml            # Compose configuration for MCP Hub
│   ├── mcp_settings.json.example     # MCP servers configuration template
│   └── README.md                     # MCP Hub setup and operations guide
├── .opencode/
│   ├── agent/                        # Adversarial authoring subagents (author + reviewer)
│   ├── commands/                     # OpenSpec slash commands (/opsx-propose, /opsx-apply, etc.)
│   ├── skills/                       # OpenSpec workflow execution skills
│   └── package.json                  # OpenCode plugin dependencies
├── .vscode/
│   ├── mcp.json                      # VS Code MCP server configuration
│   └── settings.json                 # Workspace settings template
├── openspec/
│   ├── config.yaml                   # OpenSpec configuration & skill bindings
│   ├── domains.yaml                  # Starter domain & capability catalog
│   ├── GOVERNANCE.md                 # Domain lifecycle rules for developers & agents
│   └── schemas/intent-driven/        # Intent-driven schema, workflow, and templates
├── AGENTS.md                         # Universal project context & agent conventions
├── CLAUDE.md                         # Claude Code instructions entry point
├── GEMINI.md                         # Antigravity / Gemini CLI instructions entry point
├── skills-lock.json                  # Sanitized skills lockfile
├── .gitignore                        # Standard monorepo ignore rules + AI scratch rules
└── README.md                         # Comprehensive adoption & customization guide
```

## Maintenance & Upgrades
- **Skills**: Managed via `npx skills check` and `npx skills update`. New skills added with `npx skills add <source> --skill <name> --agent github-copilot opencode -y`.
- **OpenSpec**: Upgraded via standard npm packages (`@openspec/cli`). Custom `intent-driven` schema and `domains.yaml` remain safe in userland under `openspec/`. Validated via `openspec schema validate intent-driven`.
