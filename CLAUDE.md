# Claude Code Instructions

This repository uses **`AGENTS.md`** as its canonical instructions anchor.
All agents and harnesses operating in this workspace must adhere strictly to the rules, governance, and conventions defined in `AGENTS.md`.

---

## Universal Guidelines Summary

Before executing any task, ensure full alignment with `AGENTS.md`:

1. **Anti-Fabrication**: Never invent metrics, benchmark percentages, or test counts. Require empirical evidence before asserting task completion.
2. **OpenSpec-First Directive**: All non-trivial modifications, new features, and bug fixes must be spec-driven. Enforce domain and capability boundaries declared in `openspec/domains.yaml` and `openspec/GOVERNANCE.md`.
3. **Commit Confirmation Gate**: Never run `git commit`, `git commit --amend`, or `git push` without the developer's explicit confirmation.
4. **Codebase Intelligence Hierarchy**: Prioritize MCP tools (`cocoindex_code` with `refresh_index: false`, `codebase-memory`, `codespelunker`, and `agent-lsp`) over raw text searches. Use ripgrep (`rg`) with OS-safe syntax as fallback.
5. **Testing Philosophy**: Prioritize domain invariants and business rules over trivial coverage. Use BDD scenario naming: `{Unit}_SHOULD_{Result}_WHEN_{Condition}`.
6. **Time & Clock Abstraction**: Always inject clock/time providers into domain logic rather than calling system time directly.

---

## Common Command Shortcuts

### OpenSpec CLI
- **List Active & Archived Changes**:
  ```bash
  npx openspec list
  ```
- **Inspect Specific Change**:
  ```bash
  npx openspec show <change-name>
  ```
- **Create New Change**:
  ```bash
  npx openspec new change <change-name>
  ```
- **Validate Intent-Driven Schema**:
  ```bash
  npx openspec schema validate intent-driven
  ```

### Skills Management
- **Audit Installed Skills**:
  ```bash
  npx skills check
  ```
- **Update Skills from Upstream**:
  ```bash
  npx skills update
  ```
- **Install New Skill across Agents**:
  ```bash
  npx skills add <source> --skill <skill-name> --agent github-copilot opencode -y
  ```

### Codebase Intelligence & Search
- When using ripgrep, respect OS-specific syntax:
  - Windows alternation: `rg "patternA|patternB"`
  - Glob filter: `rg "term" -g "*.ts"`
  - Max count: `rg "term" -m 10`
