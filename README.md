# AI Scaffolding

A standardized, multi-harness AI scaffolding template for modern monorepos.

This repository provides an enterprise-grade foundation for AI-assisted software engineering across multiple agent environments—including **OpenCode**, **VS Code / GitHub Copilot**, **Antigravity CLI (`agy`) & IDE**, and **Claude Code**—enforcing spec-first development, dynamic domain governance, anti-fabrication standards, and containerized codebase intelligence.

---

## Table of Contents

- [Core Philosophy](#core-philosophy)
- [Repository Layout](#repository-layout)
- [Supported AI Harnesses](#supported-ai-harnesses)
  - [OpenCode](#opencode)
  - [VS Code / GitHub Copilot](#vs-code--github-copilot)
  - [Antigravity CLI (`agy`) & IDE](#antigravity-cli-agy--ide)
  - [Claude Code](#claude-code)
- [OpenSpec System](#openspec-system)
  - [Intent-Driven Workflow](#intent-driven-workflow)
  - [Domain Governance](#domain-governance)
  - [Schema Customization & Validation](#schema-customization--validation)
- [Codebase Intelligence (MCP Hub)](#codebase-intelligence-mcp-hub)
- [Skills Management](#skills-management)
- [Quickstart: Bootstrapping a New Monorepo](#quickstart-bootstrapping-a-new-monorepo)
- [Customization Checklist](#customization-checklist)

---

## Core Philosophy

1. **Spec-First & Intent-Driven**: No non-trivial implementation code is written in isolation. Every behavioral change, bug fix, or feature begins with an intent-driven proposal, verified against living specifications, and broken down into verifiable tasks.
2. **Anti-Fabrication**: Strict policy against hallucinated benchmarks, metrics, performance claims, or invented APIs. Evidence and empirical test outputs are required before asserting success.
3. **Multi-Harness Compatibility**: A single canonical set of instructions (`AGENTS.md`) is surfaced to OpenCode, GitHub Copilot, Antigravity, and Claude Code without divergent rule drift.
4. **Dynamic Domain Governance**: System capabilities are organized into explicit architectural domains declared in `openspec/domains.yaml`. High-friction gates prevent arbitrary architecture sprawl.
5. **Tool-First Exploration Hierarchy**: Agents prioritize semantic code search and knowledge graphs over naive text scanning, preserving token budget and context quality.

---

## Repository Layout

```
ai-scaffolding/
├── .agents/
│   └── skills/                       # Vendored engineering discipline & framework skills
├── .agent-workspace/                 # Agent scratch spaces and resume tokens (.keep)
├── .antigravity/
│   └── mcp.json                      # Antigravity CLI & IDE MCP configuration
├── .github/
│   ├── agents/                       # Advisory persona agents (Architect, UX, DevOps, Docs)
│   ├── instructions/                 # Always-on copilot instructions (Anti-fabrication, context, governance)
│   └── prompts/                      # Slash prompts (code-review, architecture-note)
├── .mcp-hub/
│   ├── Dockerfile                    # Container image for MCP Hub
│   ├── docker-compose.yml            # Docker Compose configuration for MCP Hub
│   ├── mcp_settings.json.example     # MCP servers configuration template
│   └── README.md                     # MCP Hub setup and operations guide
├── .opencode/
│   ├── agent/                        # Adversarial authoring subagents (author, reviewer)
│   ├── commands/                     # Slash commands (/opsx-propose, /opsx-apply, etc.)
│   ├── skills/                       # OpenSpec execution skills
│   └── package.json                  # OpenCode plugin configuration
├── .vscode/
│   ├── mcp.json                      # VS Code MCP server configuration
│   └── settings.json                 # Recommended workspace settings
├── openspec/
│   ├── config.yaml                   # OpenSpec tool configuration & skill bindings
│   ├── domains.yaml                  # System domain & capability catalog
│   ├── GOVERNANCE.md                 # Domain lifecycle rules for developers and agents
│   ├── SCHEMAS.md                    # Guide to schemas, customization, and validation
│   ├── schemas/intent-driven/        # Custom intent-driven schema & Markdown templates
│   └── specs/                        # Living specifications organized by domain/capability
├── AGENTS.md                         # Universal project context & agent conventions
├── CLAUDE.md                         # Claude Code instructions entry point
├── GEMINI.md                         # Antigravity / Gemini instructions entry point
├── skills-lock.json                  # Managed skills lockfile
├── .gitignore                        # Monorepo and agent scratch ignore patterns
└── README.md                         # This file
```

---

## Supported AI Harnesses

This repository unifies AI behavior across four leading harness environments:

### OpenCode

- **Configuration Root**: `.opencode/`
- **Slash Commands**:
  - `/opsx-new` — Initialize a new change step-by-step.
  - `/opsx-propose` — Propose an end-to-end change with full artifacts generated in one pass.
  - `/opsx-explore` — Think through requirements and explore problem spaces before committing.
  - `/opsx-continue` — Progress a change to its next artifact stage.
  - `/opsx-apply` — Implement approved tasks with subagent coordination.
  - `/opsx-verify` — Verify implementation against delta specifications.
  - `/opsx-archive` — Sync delta specs to living specs and archive the change.
  - `/opsx-sync` — Synchronize specs to the living specs without archiving.
  - `/opsx-bulk-apply` — Concurrently apply multiple changes in isolated git worktrees.
- **Adversarial Subagents**:
  - `adversarial-author`: Drafts plans, designs, and specifications.
  - `adversarial-reviewer`: Critiques proposals independently before implementation starts.

### VS Code / GitHub Copilot

- **Instructions**: `.github/instructions/` contains modular instructions automatically loaded by GitHub Copilot Chat:
  - `anti-fabrication.instructions.md`: Evidence requirements for metrics and benchmark data.
  - `project-context.instructions.md`: High-level codebase layout and conventions.
  - `openspec-governance.instructions.md`: Rules for respecting `openspec/domains.yaml`.
  - `ai-setup-sync.instructions.md`: Guidelines for keeping multi-harness files in sync.
- **Prompts**: Pre-configured prompts in `.github/prompts/` (e.g., `code-review.prompt.md`).
- **Advisory Agents**: Specialized role agents in `.github/agents/` (`architect`, `ux-expert`, `devops-expert`, `docs-keeper`).
- **Tooling**: `.vscode/mcp.json` links directly to the local MCP Hub.

### Antigravity CLI (`agy`) & IDE

- **Context Entry Point**: `GEMINI.md` imports `AGENTS.md` and provides CLI-specific shortcuts.
- **Tool Configuration**: `.antigravity/mcp.json` configures MCP servers for the Antigravity agent.
- **Workflow**: Antigravity agents adhere to the same OpenSpec workflow and anti-fabrication gates as OpenCode and Copilot.

### Claude Code

- **Context Entry Point**: `CLAUDE.md` references `AGENTS.md` to ensure identical architectural guidelines and command habits.
- **Memory & Conventions**: Claude Code automatically loads `CLAUDE.md` and respects repository-level gates.

---

## OpenSpec System

OpenSpec provides a structured, living specification system that connects intent, design, and code implementation.

### Intent-Driven Workflow

The custom `intent-driven` schema in `openspec/schemas/intent-driven/` structures changes into five stages:

1. **Proposal (`proposal.md`)**: The "why" and "what", defining business context, capabilities impacted, and measurable outcomes.
2. **Delta Specifications (`spec.md`)**: Gherkin-style behavioral scenarios (`Given` / `When` / `Then`) showing what is added, modified, or removed.
3. **Architecture Design (`design.md`)**: Technical decisions, sequence flows, component interactions, and data contracts.
4. **Architecture Decision Records (`adr.md`)**: Trade-offs, rationale, alternatives considered, and downstream consequences.
5. **Tasks Breakdown (`tasks.md`)**: Atomic, checklist-driven implementation steps with explicit verification criteria.

Living specifications persist permanently in:
```
openspec/specs/<domain>/<capability>/spec.md
```

### Domain Governance

All specifications are strictly mapped to domains and capabilities declared in `openspec/domains.yaml`.
- **Domain Gate**: Changes must map to an existing domain. Adding a new domain requires team-level architectural agreement as outlined in `openspec/GOVERNANCE.md`.
- **Capability Extensions**: Features extend existing capabilities or introduce new capabilities under an established domain.

### Schema Customization & Validation

- Full details on customizing stages, dependencies, and artifact templates are documented in [`openspec/SCHEMAS.md`](openspec/SCHEMAS.md).
- Learn how to download community schemas from the [OpenSpec Community Schemas Catalog](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md#community-schemas).
- Learn how to fork, modify, and maintain your own schemas via [Editing Your Schema Fork](https://openspec.dev/docs/customize-schemas#editing-your-fork).
- Validate your active schema at any time:
  ```bash
  openspec schema validate intent-driven
  ```

---

## Codebase Intelligence (MCP Hub)

The `.mcp-hub/` directory packages a Dockerized Model Context Protocol (MCP) server that provides rich codebase intelligence to any MCP-compliant harness (VS Code, OpenCode, Antigravity, Claude Code).

### Provided Tools

- **`cocoindex_code`**: Semantic code search using vector embeddings over repository files.
- **`codebase-memory`**: Persistent architectural knowledge graph tracking dependencies, call chains, and module relationships.
- **`codespelunker`**: Fast BM25 lexical and symbol search.
- **`agent-lsp`**: Language Server Protocol integration providing compiler-grade diagnostics, go-to-definition, and type references.

### Running MCP Hub

1. Copy the environment configuration:
   ```bash
   cd .mcp-hub
   cp mcp_settings.json.example mcp_settings.json
   ```
2. Start the service with Docker Compose:
   ```bash
   docker compose up -d
   ```
3. Verify the service is running:
   ```bash
   curl http://localhost:3000/health
   ```

Clients connect over SSE/HTTP at `http://localhost:3000/mcp`.

---

## Skills Management

Agent skills are modular execution workflows vendored into `.agents/skills/` and managed with `@skills/cli`.

### Included Disciplines

- **Process & Planning**: `brainstorming`, `writing-plans`, `planning-and-task-breakdown`, `incremental-implementation`
- **Execution & Quality**: `test-driven-development`, `systematic-debugging`, `doubt-driven-development`, `verification-before-completion`
- **Review & Collaboration**: `code-review-and-quality`, `receiving-code-review`, `requesting-code-review`, `grill-with-docs`, `grilling`, `domain-modeling`
- **Architecture & Versioning**: `architectural-decision-records`, `c4-diagrams`, `git-workflow-and-versioning`, `using-git-worktrees`, `finishing-a-development-branch`
- **Context & Optimization**: `context-engineering`, `performance-optimization`, `observability-and-instrumentation`
- **Frontend Architecture**: `angular-developer`

### Skills CLI Commands

- **Check Skill Status**:
  ```bash
  npx skills check
  ```
- **Update Installed Skills**:
  ```bash
  npx skills update
  ```
- **Install New Skills**:
  Install a skill across GitHub Copilot and OpenCode simultaneously:
  ```bash
  npx skills add <source> --skill <skill-name> --agent github-copilot opencode -y
  ```

All skill installations are tracked in `skills-lock.json`.

---

## Quickstart: Bootstrapping a New Monorepo

To use this scaffolding for a new monorepo:

### 1. Copy Template Files

Copy the entire scaffolding structure into your new repository root:
```bash
cp -r /path/to/ai-scaffolding/* /path/to/my-new-monorepo/
cp -r /path/to/ai-scaffolding/.* /path/to/my-new-monorepo/ 2>/dev/null || true
cd /path/to/my-new-monorepo
```

### 2. Initialize Git

```bash
git init
git branch -M main
```

### 3. Install Package Dependencies

```bash
npm install -D @openspec/cli @skills/cli
```

### 4. Start MCP Hub

```bash
cd .mcp-hub
cp mcp_settings.json.example mcp_settings.json
docker compose up -d
cd ..
```

---

## Customization Checklist

Follow this checklist to tailor the scaffolding to your project:

- [ ] **Define Architectural Domains**:
  - Open `openspec/domains.yaml`.
  - Replace the starter domains (`core-platform`, `api-services`, `web-client`) with your actual business domains and initial capabilities.
- [ ] **Configure Universal Instructions (`AGENTS.md`)**:
  - Update the **Repository Layout** section with your monorepo structure (e.g., `apps/`, `packages/`, `services/`).
  - Specify your backend and frontend tech stacks, runtimes, and framework versions.
  - Document your database migration strategies and testing conventions.
  - Review the agent permissions and build execution rules.
- [ ] **Tune Harness Context Files**:
  - Check `CLAUDE.md` and `GEMINI.md` to ensure any custom commands or paths align with your build system.
  - Review `.github/instructions/project-context.instructions.md` to match your application details.
- [ ] **Configure MCP Hub Paths**:
  - In `.mcp-hub/mcp_settings.json`, set your repository root and volume mounts.
- [ ] **Scaffold Your First Living Spec**:
  - Add your first feature or capability spec in `openspec/specs/<domain>/<capability>/spec.md`.
- [ ] **Start Your First Spec-Driven Change**:
  - OpenCode: run `/opsx-new` or `/opsx-propose`.
  - VS Code / Copilot: ask Copilot to draft a change adhering to `openspec/GOVERNANCE.md`.
