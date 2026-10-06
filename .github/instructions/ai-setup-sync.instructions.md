---
name: AI Multi-Harness Sync
description: Guidance on keeping AI configuration synchronized across OpenCode, GitHub Copilot, Antigravity, and Claude Code.
applyTo: ".github/**,.antigravity/**,.vscode/**,.opencode/**,AGENTS.md,CLAUDE.md,GEMINI.md,skills-lock.json"
---

# AI Multi-Harness Synchronization Guide

This repository supports four AI engineering harnesses operating simultaneously:
1. **OpenCode** (CLI & agent runtime via `.opencode/`)
2. **VS Code & GitHub Copilot** (IDE assistant via `.github/` and `.vscode/`)
3. **Antigravity CLI (`agy`) & IDE** (CLI and IDE agent via `.antigravity/` and `GEMINI.md`)
4. **Claude Code** (Terminal assistant via `CLAUDE.md`)

Whenever modifying instructions, prompts, specialist agents, skills, or tool configurations, all relevant harness configurations must remain synchronized.

---

## Configuration Mapping Across Harnesses

| Capability / Concept | Canonical Anchor | GitHub Copilot / VS Code | OpenCode | Antigravity CLI / IDE | Claude Code |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **Project Context & Rules** | `AGENTS.md` | `.github/instructions/project-context.instructions.md` | `AGENTS.md` | `GEMINI.md` → `AGENTS.md` | `CLAUDE.md` → `AGENTS.md` |
| **Anti-Fabrication Rule** | `AGENTS.md` | `.github/instructions/anti-fabrication.instructions.md` | `AGENTS.md` | `GEMINI.md` → `AGENTS.md` | `CLAUDE.md` → `AGENTS.md` |
| **OpenSpec Governance** | `openspec/GOVERNANCE.md` | `.github/instructions/openspec-governance.instructions.md` | `.opencode/skills/openspec-*` | `GEMINI.md` + `openspec/` | `CLAUDE.md` + `openspec/` |
| **Slash Commands / Prompts** | OpenSpec CLI | `.github/prompts/*.prompt.md` | `.opencode/commands/*.md` | `.gemini/commands/opsx/*.toml` | `.claude/commands/opsx/*.md` |
| **Specialist Agents** | Workspace roles | `.github/agents/*.agent.md` | `.opencode/agent/*.md` | Configured roles | Command-driven |
| **MCP Tool Servers** | `.mcp-hub/` | `.vscode/mcp.json` | Local MCP / STDIO | `.antigravity/mcp.json` | `claude mcp` config |
| **Engineering Skills** | `skills-lock.json` | `.github/skills/` | `.opencode/skills/` | `.gemini/skills/` | `.claude/skills/` |

---

## Synchronization Rules

### 1. Canonical Instructions Anchor
- **`AGENTS.md` is the primary source of truth** for all project context, architecture layouts, testing philosophies, and operational conventions.
- When changing core guidelines (e.g. testing standards, commit gates, search hierarchies), update `AGENTS.md` first.
- Ensure `.github/instructions/project-context.instructions.md`, `CLAUDE.md`, and `GEMINI.md` reflect any updates to `AGENTS.md`.

### 2. MCP Server Configuration Parity
- The primary codebase intelligence tools run via the Dockerized MCP Hub at `http://localhost:3000/mcp`.
- When adding, updating, or removing an MCP server:
  1. Update `.mcp-hub/mcp_settings.json.example` if it runs within the hub container.
  2. Update `.vscode/mcp.json` for VS Code / Copilot users.
  3. Update `.antigravity/mcp.json` for Antigravity CLI / IDE users.
- Ensure connection parameters (port, environment variables, tool arguments) match across all configs.

### 3. OpenSpec Workflow Parity
- When modifying OpenSpec schema definitions or templates in `openspec/schemas/intent-driven/`:
  1. Validate the schema using `openspec schema validate intent-driven`.
  2. Verify that prompts (`.github/prompts/opsx-*.prompt.md`), commands (`.opencode/commands/opsx-*.md`), and skill definitions (`.opencode/skills/openspec-*`) remain aligned with the artifact sequence.
  3. Keep `openspec/domains.yaml`, `openspec/GOVERNANCE.md`, and `openspec/SCHEMAS.md` updated as architecture evolves.

### 4. Skills Suite Synchronization
- Vendor-managed skills reside under `.agents/skills/` and are tracked in `skills-lock.json`.
- When adding or upgrading skills:
  - Use `@skills/cli` to install and sync skills across agent directories:
    ```bash
    npx skills check
    npx skills update
    ```
  - Ensure skill targets include `@opencode-ai/plugin` and GitHub Copilot directories.

### 5. Zero Product Leakage Audit
- Whenever updating instructions, prompts, agents, or templates, run a verification check to ensure no company-specific, legacy product, or proprietary domain terminology is introduced.
- All scaffolding files must remain 100% generic for any modern software monorepo.
