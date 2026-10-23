---
name: openspec-pr-review
description: Conduct adversarial cross-model PR audits, generate pr.md, and prepare Git host-agnostic pull requests for OpenSpec changes.
allowed-tools: Bash(git:*, gh:*, glab:*, az:*, openspec:*)
license: MIT
compatibility: Requires git and openspec CLI.
metadata:
  author: template
  version: "1.0"
---

Conduct an independent, adversarial code review and prepare a Pull Request for an OpenSpec change.

## Key Principles

1. **Context Isolation**: Run as an independent subagent or fresh session using a different model family where the harness supports it. Inspect only disk artifacts (`proposal.md`, `specs/`, `design.md`, `adr.md`, `tasks.md`) and the working-tree diff against the base ref.
2. **Dual-Axis Review Engine**:
   - **Spec Axis**: Verifies that Gherkin scenarios are authentically tested, ADR constraints are honored, and no unrequested scope creep exists.
   - **Standards & Security Axis**: Audits repo standards, parameterized inputs, auth guards, Fowler code smells, and performance invariants.
3. **Human-in-the-Loop Safety**: Never automatically push code or open a PR. Output `pr.md` and present ready-to-run CLI commands for the developer to execute.
4. **Git Host Agnostic**: Formats commands for GitHub CLI (`gh`), GitLab CLI (`glab`), Azure Repos (`az`), and plain Git.

---

## Execution Steps

### 1. Select the Change & Collect the Diff

If a change name is provided, use it. Otherwise, infer from context or inspect `openspec list --json`.
Announce: `Running PR audit for change: <change-name>`.

Compare the current working tree against the base ref (`origin/main` unless the developer named another base). Committed, staged, unstaged, and untracked changes all count; the developer does not commit before this audit:

```bash
BASE=origin/main
git diff --stat "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
git diff "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
git ls-files --others --exclude-standard -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
```

Read every untracked file returned by the last command from disk; `git diff` cannot show them, but they are part of the change. Use the same three-dot form (`"$BASE"...HEAD`) only when reviewing an already-checked-out pull request branch.

### 2. Read Planning Context & Living Specs

Read all available change artifacts under `openspec/changes/<change-name>/`:
- `proposal.md`
- `specs/**/*.md`
- `design.md`
- `adr.md` and any referenced durable ADRs under `adr/`
- `tasks.md`

### 3. Conduct Dual-Axis Audit

#### Axis 1: Spec Compliance (Did we build the right thing?)
- **Gherkin Verification**: Confirm every scenario under `specs/**/*.md` has authentic test coverage. Reject tautological assertions (e.g. `Assert.True(true)`, over-mocked units where mocks return the expected result directly).
- **Architectural Conformance**: Ensure constraints defined in `adr.md` and component boundaries in `design.md` were strictly respected.
- **Scope Creep & Hallucination**: Flag any behavior, endpoints, or dependencies present in the diff that were not specified in `proposal.md` or `specs/`.

#### Axis 2: Standards, Quality & Security (Did we build the thing right?)
- **Security**: Ensure all database queries use parameterized inputs (no raw string interpolation), authentication/authorization guards are present, and untrusted inputs are validated at boundaries.
- **Performance**: Check for N+1 query patterns in data access, unbounded loops, memory leaks, or unnecessary change-detection/re-renders.
- **Architecture & Code Smells**: Check for Fowler smells—Primitive Obsession, Feature Envy, Shotgun Surgery, Duplicated Logic, or bolting conditionals onto unrelated flows. Propose concrete structural remedies.
- **Change Sizing**: Flag if single files have grown excessively without decomposition.

### 4. Categorize Findings

- `[CRITICAL]` (Blocks PR): Broken caller, unfulfilled Gherkin scenario, violated ADR, security vulnerability, fabricated mock.
- `[WARNING]` (Should fix): Suboptimal error handling, missing edge-case test, naming drift, code smell.
- `[SUGGESTION]` (Optional): Minor refactoring or style cleanups.

### 5. Write Report & Format Commands

Write `openspec/changes/<change-name>/pr.md` using the template at `openspec/schemas/intent-driven/templates/pr.md`:
1. Record overall status:
   - If ANY `[CRITICAL]` finding: `BLOCKED BY CRITICAL FINDINGS`.
   - If zero `[CRITICAL]` findings: `READY FOR PR`.
2. Format the conventional PR title (`type(scope): concise description`) and markdown description.
3. Format ready-to-run commands:
   - `git push -u origin HEAD`
   - Platform options (`gh pr create`, `glab mr create`, `az repos pr create`).

### 6. Final Verdict in Chat

- If **BLOCKED**: Summarize critical blockers with `file:line` citations. Prompt developer to fix via `/opsx-apply <change-name>`.
- If **READY**: Display formatted PR title, summary, and ready-to-run CLI commands. Do NOT execute them.
