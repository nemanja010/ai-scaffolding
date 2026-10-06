# Antigravity CLI (`agy`) & IDE Guidelines

This repository uses **`AGENTS.md`** as its canonical instructions anchor.
When operating via Antigravity CLI (`agy`) or within the Antigravity IDE environment, adhere strictly to the rules, governance, and architecture patterns established in `AGENTS.md`.

---

## Universal Guidelines Summary

All Antigravity sessions must align with the core conventions from `AGENTS.md`:

1. **Anti-Fabrication**: NEVER fabricate metrics, benchmark percentages, performance improvements, or test counts. Qualitative descriptions only unless empirical measurements exist in source code or execution logs.
2. **OpenSpec-First Directive**: All non-trivial changes must have an active OpenSpec change. Verify domain mapping against `openspec/domains.yaml` and adhere to `openspec/GOVERNANCE.md`.
3. **Commit Approval Gate**: NEVER run `git commit`, amend, or push without explicit confirmation from the developer.
4. **Codebase Intelligence Hierarchy**: Prefer MCP tools (`cocoindex_code` with `refresh_index: false`, `codebase-memory`, `codespelunker`, `agent-lsp`) before falling back to ripgrep (`rg`).
5. **Testing & Quality**: Focus on domain invariants and business rules over trivial coverage. Use BDD naming: `{Unit}_SHOULD_{Result}_WHEN_{Condition}`.
6. **Clock Abstractions**: Inject time providers in domain logic rather than referencing system clocks directly.

---

## Antigravity CLI Conventions

### Task Tracking via Task Artifacts
- **Markdown Checklist Tracking**: Structure complex implementations into ordered tasks using markdown checklist syntax (`- [ ]`).
- **Atomic Progress Updates**: As each task item is executed and verified, update the checkbox (`- [x]`) in the active plan artifact or scratchpad.
- **Verification Before Completion**: Run verification checks before marking any step complete. Confirm outputs rather than assuming success.
- **Scratch Workspace**: Maintain temporary task state in `.agent-workspace/antigravity/active-task.md` and archive past sessions in `.agent-workspace/antigravity/history/`.

### Tool Mapping & MCP Server Access
- **MCP Configuration**: Antigravity connects to MCP services via `.antigravity/mcp.json`.
- **MCP Hub Integration**: Codebase intelligence tools are served by the Dockerized MCP Hub running at `http://localhost:3000/mcp`.
- **Tool Selection Strategy**:
  - For semantic code search: Invoke `cocoindex_code` with parameter `refresh_index: false`.
  - For architecture relationships: Invoke `codebase-memory`.
  - For instant text and symbol search: Invoke `codespelunker`.
  - For compiler-accurate references and diagnostics: Invoke `agent-lsp`.
  - For file pattern text search: Use ripgrep (`rg`) with OS-safe alternation syntax (`|`).

### Command Shortcuts
- **OpenSpec Operations**:
  - `openspec list` — View active changes and status.
  - `openspec new change <name>` — Scaffold a new change.
  - `openspec schema validate intent-driven` — Validate schema integrity.
- **Skills Operations**:
  - `npx skills check` — Check installed skills status.
  - `npx skills update` — Update skill definitions.
