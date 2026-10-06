# AI Scaffolding Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Create a production-ready, sanitized boilerplate repository at `D:/code/ai-scaffolding` containing the full AI-assisted engineering setup (OpenCode, VS Code / Copilot, Antigravity CLI / IDE, Claude Code, OpenSpec with custom intent-driven workflow & domain governance, Dockerized MCP Hub, and curated skills).

**Architecture:** A multi-harness repository foundation where `AGENTS.md` is the canonical instructions anchor, OpenSpec governs domain-driven architecture and living specifications, and `.agents/skills` provides standard engineering discipline. All files are strictly sanitized with zero product leakage.

**Tech Stack:** Git, Node.js / npm (`@openspec/cli`, `@skills/cli`), Docker (MCP Hub), Markdown / YAML / JSON.

## Global Constraints
- Target directory: `D:/code/ai-scaffolding`
- ZERO legacy product or company references (no proprietary naming, no database assumptions, no domain assumptions)
- Exclude all domain-specific skills and Ignite UI skills
- Antigravity support via `AGENTS.md`, `GEMINI.md`, and `.antigravity/mcp.json`
- OpenSpec domain-governance with `openspec/domains.yaml`, `openspec/GOVERNANCE.md`, and full intent-driven schema templates

---

### Task 1: Repository Root & Git Initialization

**Files:**
- Create: `D:/code/ai-scaffolding/.gitignore`
- Create: `D:/code/ai-scaffolding/README.md`

- [x] **Step 1: Create `.gitignore`**
Include rules for Node.js, IDEs, Docker volumes/data, and AI agent scratch areas (`.agent-workspace/*/active-task.md`, `.agent-workspace/*/history/`, but keep `.keep` files).

- [x] **Step 2: Create comprehensive `README.md`**
Document the scaffolding overview, supported harnesses (OpenCode, VS Code/Copilot, Antigravity, Claude Code), how to adopt the repo for a new monorepo, how to run MCP Hub, how to use OpenSpec, and how to manage skills.

- [x] **Step 3: Initialize git repository in `D:/code/ai-scaffolding`**
Run `git init` in `D:/code/ai-scaffolding` to set up the clean git repository.

---

### Task 2: Canonical Instructions & Context Anchors

**Files:**
- Create: `D:/code/ai-scaffolding/AGENTS.md`
- Create: `D:/code/ai-scaffolding/CLAUDE.md`
- Create: `D:/code/ai-scaffolding/GEMINI.md`
- Create: `D:/code/ai-scaffolding/skills-lock.json`

- [x] **Step 1: Write `AGENTS.md`**
Establish the canonical monorepo layout template (`apps/`, `libs/`), stack conventions, anti-fabrication mandate, OpenSpec-first directive, domain governance gate, commit confirmation gate, and MCP tool usage hierarchy.

- [x] **Step 2: Write `CLAUDE.md`**
Import/reference `AGENTS.md` conventions and document command shortcuts for Claude Code.

- [x] **Step 3: Write `GEMINI.md`**
Import/reference `AGENTS.md` conventions and document Antigravity CLI / IDE behavior and tool expectations.

- [x] **Step 4: Create sanitized `skills-lock.json`**
Extract and curate only general engineering skills and Angular from the root `skills-lock.json`. Omit all proprietary and Ignite UI skills.

---

### Task 3: OpenSpec Architecture, Schema Customization & Domain Governance

**Files:**
- Create: `D:/code/ai-scaffolding/openspec/config.yaml`
- Create: `D:/code/ai-scaffolding/openspec/domains.yaml`
- Create: `D:/code/ai-scaffolding/openspec/GOVERNANCE.md`
- Create: `D:/code/ai-scaffolding/openspec/SCHEMAS.md`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/schema.yaml`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/README.md`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/templates/proposal.md`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/templates/spec.md`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/templates/design.md`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/templates/adr.md`
- Create: `D:/code/ai-scaffolding/openspec/schemas/intent-driven/templates/tasks.md`
- Create: `D:/code/ai-scaffolding/openspec/specs/core-platform/configuration-management/spec.md`

- [x] **Step 1: Write `openspec/config.yaml` and `openspec/GOVERNANCE.md`**
Configure `schema: intent-driven` and artifact-level skill rules. Write detailed guidelines on how to declare, modify, and extend domains and capabilities.

- [x] **Step 2: Write `openspec/SCHEMAS.md`**
Comprehensive documentation detailing:
- How OpenSpec schemas function (artifacts, stages, dependencies, generators).
- How to customize the existing `intent-driven` schema or templates.
- Where and how to download alternative schemas (e.g. from GitHub repositories like `https://github.com/intent-driven-dev/openspec-schemas`, community schemas, or built-in schemas).
- How to register and switch schemas in `openspec/config.yaml`.
- How to validate schemas using `openspec schema validate <name>`.

- [x] **Step 3: Write starter `openspec/domains.yaml`**
Provide a clean initial catalog (`core-platform`, `api-services`, `web-client`) with rich explanatory comments for developers and AI agents.

- [x] **Step 4: Create `openspec/schemas/intent-driven/` schema & templates**
Port the custom intent-driven schema and markdown templates, sanitized of all product-specific examples.

- [x] **Step 5: Create starter living specification**
Add `openspec/specs/core-platform/configuration-management/spec.md` as an example Gherkin-style living specification.

---

### Task 4: OpenCode Subagents, Commands & Workflow Skills

**Files:**
- Create: `D:/code/ai-scaffolding/.opencode/package.json`
- Create: `D:/code/ai-scaffolding/.opencode/agent/adversarial-author.md`
- Create: `D:/code/ai-scaffolding/.opencode/agent/adversarial-reviewer.md`
- Create: `D:/code/ai-scaffolding/.opencode/commands/*.md` (all 9 opsx commands)
- Create: `D:/code/ai-scaffolding/.opencode/skills/adversarial-authoring/SKILL.md`
- Create: `D:/code/ai-scaffolding/.opencode/skills/openspec-*/SKILL.md` (all 9 OpenSpec workflow skills)

- [x] **Step 1: Write `.opencode/package.json` and agent definitions**
Set up `@opencode-ai/plugin` and the two adversarial subagents (`adversarial-author.md` and `adversarial-reviewer.md`).

- [x] **Step 2: Copy and sanitize OpenSpec slash commands in `.opencode/commands/`**
Install `opsx-propose.md`, `opsx-new.md`, `opsx-explore.md`, `opsx-continue.md`, `opsx-apply.md`, `opsx-verify.md`, `opsx-archive.md`, `opsx-sync.md`, `opsx-bulk-apply.md`.

- [x] **Step 3: Copy and sanitize `.opencode/skills/`**
Port `adversarial-authoring` and all `openspec-*` skills, ensuring domain-governance rules point dynamically to `openspec/domains.yaml`.

---

### Task 5: VS Code, GitHub Copilot & Antigravity IDE Setup

**Files:**
- Create: `D:/code/ai-scaffolding/.github/instructions/anti-fabrication.instructions.md`
- Create: `D:/code/ai-scaffolding/.github/instructions/project-context.instructions.md`
- Create: `D:/code/ai-scaffolding/.github/instructions/openspec-governance.instructions.md`
- Create: `D:/code/ai-scaffolding/.github/instructions/ai-setup-sync.instructions.md`
- Create: `D:/code/ai-scaffolding/.github/prompts/code-review.prompt.md`
- Create: `D:/code/ai-scaffolding/.github/prompts/architecture-note.prompt.md`
- Create: `D:/code/ai-scaffolding/.github/agents/*.agent.md` (architect, ux-expert, devops-expert, docs-keeper)
- Create: `D:/code/ai-scaffolding/.vscode/mcp.json`
- Create: `D:/code/ai-scaffolding/.vscode/settings.json`
- Create: `D:/code/ai-scaffolding/.antigravity/mcp.json`

- [x] **Step 1: Write instructions in `.github/instructions/`**
Port anti-fabrication, project context template, dynamic domain governance, and multi-harness sync instructions.

- [x] **Step 2: Write prompts in `.github/prompts/`**
Create clean `code-review.prompt.md` and `architecture-note.prompt.md`.

- [x] **Step 3: Write advisory agents in `.github/agents/`**
Create `architect.agent.md`, `ux-expert.agent.md`, `devops-expert.agent.md`, and `docs-keeper.agent.md`.

- [x] **Step 4: Configure `.vscode/mcp.json`, `.vscode/settings.json`, and `.antigravity/mcp.json`**
Configure MCP wiring to point to the local Dockerized MCP Hub and standard dev tools.

---

### Task 6: Dockerized MCP Hub & Agent Workspace

**Files:**
- Create: `D:/code/ai-scaffolding/.mcp-hub/Dockerfile`
- Create: `D:/code/ai-scaffolding/.mcp-hub/docker-compose.yml`
- Create: `D:/code/ai-scaffolding/.mcp-hub/mcp_settings.json.example`
- Create: `D:/code/ai-scaffolding/.mcp-hub/README.md`
- Create: `D:/code/ai-scaffolding/.agent-workspace/README.md`
- Create: `D:/code/ai-scaffolding/.agent-workspace/{architect,ux-expert,devops-expert,docs-keeper}/history/.keep`

- [x] **Step 1: Port and genericize `.mcp-hub/`**
Set up Dockerfile, docker-compose using `${WORKSPACE_ROOT}`, `mcp_settings.json.example` (with `cocoindex_code`, `codebase-memory`, `codespelunker`, `agent-lsp`, `basic-memory`, `filesystem`), and setup instructions.

- [x] **Step 2: Create `.agent-workspace/` hierarchy**
Create agent scratch directories with `.keep` sentinels and `README.md` explaining resume conventions.

---

### Task 7: Skills Extraction & Sanitization

**Files:**
- Copy to: `D:/code/ai-scaffolding/.agents/skills/*`

- [x] **Step 1: Copy selected general engineering and Angular skills**
Transfer:
- Superpowers skills (`brainstorming`, `writing-plans`, `executing-plans`, `subagent-driven-development`, `test-driven-development`, `systematic-debugging`, `verification-before-completion`, `finishing-a-development-branch`, `requesting-code-review`, `receiving-code-review`, `using-git-worktrees`, `using-superpowers`, `writing-skills`, `dispatching-parallel-agents`)
- Addy Osmani skills (`api-and-interface-design`, `browser-testing-with-devtools`, `ci-cd-and-automation`, `code-review-and-quality`, `code-simplification`, `context-engineering`, `deprecation-and-migration`, `documentation-and-adrs`, `doubt-driven-development`, `git-workflow-and-versioning`, `idea-refine`, `incremental-implementation`, `interview-me`, `observability-and-instrumentation`, `performance-optimization`, `planning-and-task-breakdown`, `security-and-hardening`, `shipping-and-launch`, `source-driven-development`, `spec-driven-development`)
- Architecture/Analysis skills: `c4-diagrams`, `gherkin-authoring`, `architectural-decision-records`, `glossary`, `grill-me`, `grill-with-docs`, `handoff`, `improve-codebase-architecture`
- Tooling/Frontend: `ccc`, `find-skills`, `angular-developer`
Exclude: proprietary/domain-specific skills (`custom-properties`, `generate-changelog`, etc.).

---

### Task 8: Verification, Sanitization Audit & Initial Commit

- [x] **Step 1: Run comprehensive leak audit**
Execute ripgrep scans across the entire `D:/code/ai-scaffolding` directory for any proprietary tokens. Verify 0 matches.

- [x] **Step 2: Validate OpenSpec configuration**
Run schema validation to ensure `schema: intent-driven` parses cleanly.

- [x] **Step 3: Initial git commit**
Stage all files in `D:/code/ai-scaffolding` and create the initial commit: `feat: initial scaffolding for multi-agent AI monorepo`.
