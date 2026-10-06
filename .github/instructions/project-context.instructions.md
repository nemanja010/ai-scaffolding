---
name: Project Context & Agent Conventions
description: Universal monorepo context, repository architecture, and operational conventions for AI assistants.
applyTo: "**"
---

# Universal Project Context & Agent Conventions

This document establishes the universal context, structural layout, and operational discipline for all AI assistants and automated tools operating within this repository.

---

## Repository Layout

```
apps/                 ← Deployable applications and host projects (web, mobile, backend services)
libs/                 ← Shared libraries layered cleanly (domain, data-access, state, ui, utilities)
openspec/             ← Living specifications, domain catalog, schema rules, and change proposals
docs/                 ← Architecture designs, ADRs, updates, and setup documentation
glossary/             ← Ubiquitous language definitions (business.md, technical.md)
.agents/              ← Managed engineering discipline and stack skills
.agent-workspace/     ← Agent scratch state, resume tokens, and session history
.mcp-hub/             ← Dockerized codebase intelligence MCP server
.opencode/            ← OpenCode subagents, commands, and workflow skills
.github/              ← Instructions, prompts, and advisory agents
.vscode/              ← VS Code MCP configuration and settings
.antigravity/         ← Antigravity CLI & IDE MCP configuration
```

---

## Agent Workspace Isolation

All agent scratch files, temporary task tracking artifacts, and persistent session tokens reside strictly under:

```
.agent-workspace/<agent-name>/
```

- **Active task resume token**: `.agent-workspace/<agent-name>/active-task.md` — read at startup; resume if `status: in-progress` or `status: paused`.
- **Session history**: `.agent-workspace/<agent-name>/history/` — completed tasks archived by date.
- **Clean workspace**: Never pollute `apps/`, `libs/`, or `docs/` with temporary agent scratchpads, debug dumps, or raw notes.

---

## Core Agent Conventions

### 1. Anti-Fabrication Mandate
- **NEVER fabricate metrics, benchmark percentages, performance gains, test counts, or measurement data.**
- If specific numbers, timings, or percentages are **not explicitly present** in the source material (source code, git diffs, build output, or test execution runs), **do not invent them**.
- Describe improvements **qualitatively** (*"reduces payload size"*, *"improves query efficiency"*, *"eliminates redundant allocations"*) without inventing arbitrary statistics.
- See `.github/instructions/anti-fabrication.instructions.md` for complete enforcement rules.

### 2. OpenSpec-First Directive
- **OpenSpec-First**: All non-trivial features, architectural refactors, behavioral modifications, or bug fixes must be driven through OpenSpec (`/opsx-propose` or `openspec new change <name>`).
- **Proactive Nudge on Unspecced Work**: Whenever a developer requests code changes or uncommitted modifications exist without an active OpenSpec change, pause and prompt the developer:
  > *"I notice we don't have an active OpenSpec change for this work. In this project, changes are spec-driven to keep our living system documentation accurate. Shall I create an OpenSpec change under `<domain>/<capability>` based on what you've described (or your current working tree diff)?"*
- **Superpowers Spec Framework Prohibition**: NEVER create or edit specs under `docs/superpowers/specs/`. OpenSpec is the sole specification framework. Superpowers skills (such as `systematic-debugging`, `test-driven-development`) may only be used as internal execution sub-skills during an OpenSpec apply workflow or when explicitly requested by a developer.

### 3. Dynamic Domain Governance
- System capabilities are organized into explicit architectural domains declared in `openspec/domains.yaml` and governed by `openspec/GOVERNANCE.md`.
- **Living specifications** reside strictly at `openspec/specs/<domain>/<capability>/spec.md`.
- **Archived changes** reside flat under `openspec/changes/archive/YYYY-MM-DD-<name>/` with internal deltas at `specs/<domain>/<capability>/spec.md`.
- **Decisive Capability Extension**: When a change clearly aligns with an existing capability in `openspec/domains.yaml`, target that capability and inspect the living spec. Do NOT prompt asking whether to create a new capability.
- **High-Friction Gate for New Domains**: Domains define top-level architectural boundaries. Adding a new domain requires architectural consensus. The AI must warn the developer before introducing a new domain and suggest the closest existing domain from `openspec/domains.yaml`.

### 4. Git Commit Approval Gate
- When making code changes as part of any workflow, **NEVER run `git commit`, amend, or push without explicit confirmation from the developer.**
- After implementing or modifying files, stop and present the modified files for review. Only commit once the developer explicitly instructs to proceed (e.g. *"commit this"*, *"go ahead and commit"*).

### 5. Codebase Search Hierarchy (MCP Tools First)
Prefer available Model Context Protocol (MCP) tools over naive file scanning or raw grep workflows when navigating or exploring the codebase:
1. **`cocoindex_code` semantic search**: For concept-based searches and architectural queries.
   - **Crucial rule**: Always invoke with `refresh_index: false`. Reindexing should only be triggered manually upon explicit user request.
2. **`codebase-memory` knowledge graph**: For dependency analysis, call chains, cross-file relationships, and architectural impact mapping.
3. **`codespelunker`**: Fast BM25 lexical and symbol search across the workspace without indexing overhead.
4. **`agent-lsp`**: Language Server Protocol integration providing compiler-grade symbol references, definitions, and diagnostics.
5. **Ripgrep (`rg`) Fallback**: Use `rg` for simple, exact-text lookups where MCP tools are not suited.
   - **Respect line endings**: Never normalize or convert line endings (CRLF/LF) when editing existing files.
   - **Regex alternation — OS-aware syntax**: On Windows, always use `|` for alternation — never `\|` (which is treated as a literal character). On Linux/macOS, use `|`.
   - **File type filtering**: Use `-g "*.ext"` or `--glob "*.ext"` — never `--include="*.ext"`.
   - **Limiting output lines**: Never pipe `rg` output to `head` (not cross-platform). Use ripgrep's own `-m N` (`--max-count N`) flag to cap results per file instead.

### 6. Code Quality & Testing Philosophy
- **Preserve Clean Architecture**: Dependencies must flow inward: `features → ui → store/helpers/types → data-access`. Never import from outer layers into inner core layers.
- **Do not remove or reorganize imports/usings blindly**: Leave existing imports in place even if they appear unused, unless explicitly requested.
- **Focus tests on business invariants and domain rules**: Prioritize testing behavior that, if broken, causes corrupted state, security breaches, or incorrect computations.
- **Do not chase 100% code coverage**: Trivial getters, property assignments, and boilerplate wiring do not require tests.
- **Test pyramid**:
  - **Unit tests**: Emphasize for pure domain logic, algorithms, state transitions, and validation rules. Fast, isolated, and dependency-free.
  - **Integration tests**: For repository/data-access interactions, API contract verification, and cross-boundary wiring where mocks would obscure reality.
  - **End-to-End (E2E) tests**: Minimal, reserved for critical happy-path user journeys.
- **BDD naming convention**: Write test names as clear specifications:
  `{MethodOrUnitUnderTest}_SHOULD_{ExpectedOutcome}_WHEN_{Condition}`.
