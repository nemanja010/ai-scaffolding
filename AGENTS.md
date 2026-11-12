# Universal Project Context & AI Agent Guidelines

Canonical instruction anchor for all AI agents and harnesses operating in this repository (OpenCode, VS Code / GitHub Copilot, Antigravity CLI / IDE, and Claude Code).

---

## Repository Layout

```
apps/                 ← Applications (web, mobile, service hosts)
libs/                 ← Shared libraries (domain, data-access, ui, util)
openspec/             ← Living specifications, domain catalog, and change proposals
docs/                 ← Project documentation, design notes, and guides
.agents/              ← Managed engineering discipline and stack skills
.agent-workspace/     ← Agent scratch state, resume tokens, and session history
.mcp-hub/             ← Dockerized codebase intelligence MCP server
.opencode/            ← OpenCode subagents, commands, and workflow skills
.github/              ← Copilot instructions, prompts, and advisory agents
.vscode/              ← VS Code MCP configuration and settings
.antigravity/         ← Antigravity CLI & IDE MCP configuration
```

---

## Agent Workspace

All agent scratch files and persistent session tokens are isolated under:
```
.agent-workspace/<agent-name>/
```
*(relative to the repository root)*

- **Active task resume token**: `.agent-workspace/<agent-name>/active-task.md` — check at startup; skip if `status: idle`.
- **Session history**: `.agent-workspace/<agent-name>/history/` — completed tasks archived by date.
- **State isolation**: Never pollute application directories (`apps/`, `libs/`, `docs/`) with temporary agent scratchpads or unstructured notes.

---

## Agent Conventions

### 1. Anti-Fabrication Mandate

- **NEVER fabricate metrics, benchmark percentages, performance gains, test counts, or measurement data.**
- If specific numbers or percentages are **not explicitly present** in the source material (code, git diffs, build logs, or test execution output), **do not invent them**.
- Describe improvements **qualitatively** (*"reduces payload size"*, *"improves query efficiency"*, *"eliminates redundant allocations"*) without inventing arbitrary statistics.
- Always require empirical evidence before asserting that a fix, refactor, or optimization is complete and successful.

### 2. OpenSpec Workflow & Domain Governance

- **OpenSpec-First Directive**: All non-trivial features, behavioral modifications, bug fixes, or architectural changes must be driven through OpenSpec (`/opsx-propose` or `openspec new change <name>`).
- **Proactive Nudge on Unspecced Work**: Whenever a developer asks to make changes or uncommitted working tree modifications exist without an active OpenSpec change, the AI assistant must pause before writing application code and nudge the developer:
  > *"I notice we don't have an active OpenSpec change for this work. In this project, changes are spec-driven to keep our living system documentation accurate. Shall I create an OpenSpec change under `<domain>/<capability>` based on what you've described (or your current working tree diff)?"*
  > Briefly explain the command (`/opsx-propose` or `openspec new change`) and offer to scaffold it.
- **Superpowers Spec Framework Prohibition**: NEVER use the Superpowers spec framework (`docs/superpowers/specs/`, `docs/superpowers/plans/`) in this repository. OpenSpec is the sole specification framework. Superpowers skills (such as `systematic-debugging`, `test-driven-development`) may only be used as internal execution sub-skills during an OpenSpec apply workflow or when explicitly requested by a developer.
- **Planning Skills Run Inside OpenSpec Only**: `brainstorming`, `spec-driven-development`, `writing-plans`, and `planning-and-task-breakdown` are never entry points. Use them only while authoring an OpenSpec artifact (as directed by `openspec/config.yaml` rules) or when a developer explicitly invokes them. Their output goes into the active change's artifacts (`proposal.md`, `design.md`, `specs/`, `tasks.md`) — never into `docs/superpowers/`, `docs/specs/`, or a standalone PRD/plan file. When a skill says to save or commit its document, write it into the OpenSpec artifact instead and do not commit.
- **Dynamic Domain & Capability Governance**:
  - System capabilities are organized into explicit architectural domains declared in `openspec/domains.yaml` and governed by `openspec/GOVERNANCE.md`.
  - **Living specifications** reside strictly at `openspec/specs/<domain>/<capability>/spec.md`.
  - **Archived changes** reside flat under `openspec/changes/archive/YYYY-MM-DD-<name>/` with internal deltas at `specs/<domain>/<capability>/spec.md`.
  - **Decisive Capability Extension**: When a change clearly aligns with an existing capability in `openspec/domains.yaml`, target that capability and inspect the living spec. Do NOT prompt asking whether to create a new capability.
  - **High-Friction Gate for New Domains**: Domains define top-level architectural boundaries. Adding a new domain requires architectural consensus. The AI must warn the developer before introducing a new domain and suggest the closest existing domain from `openspec/domains.yaml`.
- **Post-Archive Documentation Vault Sync**: After archiving an OpenSpec change (`openspec archive` or `/opsx-archive`), the AI assistant must always prompt the developer to synchronize the documentation vault:
  > *"Change `<change-name>` has been archived. Would you like to synchronize the documentation vault now via `/opsx-sync-docs`?"*
- **Optional Cross-Model PR Audit**: After all tracked tasks are complete and verification passes, the developer may run the post-implementation audit (`/opsx-pr` in OpenCode and VS Code, `/opsx:pr` in Antigravity and Claude Code). It reviews the current working tree against `origin/main` (or a named base), writes `openspec/changes/<change>/pr.md`, and formats — but never executes — the PR creation commands. It is optional; `/opsx-archive` does not require it.

### 3. Git Commit Approval Gate

- When making code changes as part of the OpenSpec process or general engineering tasks, **NEVER `git commit`, amend, or push without the developer's explicit confirmation first.**
- After implementing or modifying files, stop and let the developer review the changed files. Only commit once the developer has explicitly instructed to proceed (e.g. *"commit this"*, *"go ahead and commit"*).
- This applies to all agent workflows and harness environments, regardless of how routine the change appears.
- **This gate overrides skill instructions.** When a skill (e.g. `subagent-driven-development`, `executing-plans`, `finishing-a-development-branch`, `brainstorming`, `git-workflow-and-versioning`) tells you or a subagent to commit, merge, open a PR, or push, stage the work and stop for confirmation instead. Subagents dispatched by these skills must be told not to commit.

### 4. Skill Artifact Locations & Precedence

Repository conventions override the default paths and formats baked into installed skills:

- **Glossary**: `glossary/business.md` and `glossary/technical.md` using the four-column format in `glossary/README.md`. Never create a root `GLOSSARY.md` or `GLOSSARY-MAP.md` (default of `domain-modeling` / `grill-with-docs`).
- **ADRs**: `adr/` at the repository root, authored with the `architectural-decision-records` skill and the style recorded in its `preferences.md`. Do not use `docs/adr/` (`domain-modeling` default) or `docs/decisions/`.
- **Code review**: `code-review-and-quality` is the review rubric. `requesting-code-review` is used only as the reviewer-dispatch step inside `subagent-driven-development` / `executing-plans`.

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

### 6. Code Quality & Hygiene

- **Do not remove or reorganize imports/usings blindly**: Leave existing imports in place even if they appear unused, unless the developer explicitly requests import cleanup.
- **Preserve existing conventions**: Match the established project indentation, casing, comment style, and file structure.
- **Investigate unfamiliar code**: Treat unfamiliar files or modifications as potential concurrent work by the developer; never overwrite or delete without verification.
- **Agent permissions**: Read, search, and inspection operations are always permitted without asking for confirmation.

### 7. Testing Philosophy

- **Focus on business invariants and domain rules**: Prioritize testing behavior that, if broken, causes real harm, corrupted state, or incorrect calculations.
- **Do not chase 100% code coverage**: Coverage is a by-product of high-quality tests, not a goal in itself. Trivial getters, property assignments, and boilerplate wiring do not require dedicated tests.
- **Test pyramid**:
  - **Unit tests**: Emphasize for pure domain logic, algorithms, state transitions, and validation rules. Fast, isolated, and dependency-free.
  - **Integration tests**: For repository/data-access interactions, API contract verification, and cross-boundary wiring where mocks would obscure reality.
  - **End-to-End (E2E) tests**: Minimal, reserved for critical happy-path user journeys.
- **No duplicate coverage**: If a domain invariant is fully exercised by unit tests, an integration test only needs to verify correct wiring, not repeat every edge case.
- **Specification-style test naming**: One test block = one business scenario. Use the standard BDD naming convention:
  ```
  {UnitOrMethodUnderTest}_SHOULD_{ExpectedResult}_WHEN_{Condition}
  ```
  *Example:* `OrderProcessor_SHOULD_RejectOrder_WHEN_InventoryIsDepleted`

### 8. Date & Time Handling

- In domain services, business logic, and scheduling components, **always inject clock/time abstractions** (e.g. `Clock`, `TimeProvider`, `IDateTimeProvider`) rather than calling system time directly (`Date.now()`, `DateTime.UtcNow`, `new Date()`).
- Direct access to system clocks impairs unit test determinism, introduces race conditions, and obscures time-dependent boundary conditions.

### 9. Response Style

- Do not explain what you did unless explicitly asked.
- Do not provide unsolicited summaries of file modifications.
- Deliver clear, direct, and actionable solutions.
