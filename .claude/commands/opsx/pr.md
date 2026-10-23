---
name: "OPSX: PR"
description: "Run cross-model PR audit, write pr.md, and output Pull Request commands"
allowed-tools: Bash(git:*, gh:*, glab:*, az:*, openspec:*), Read, Grep, Glob, Write, Task
category: "Workflow"
tags: ["workflow", "pr", "review"]
---

Execute the cross-model PR review for OpenSpec change.

**Isolation requirement:** Run this review in the dedicated `pr-reviewer` subagent (fresh context, `opus` model), not inline in this session. Delegate to it and let it read the artifacts and diff itself so author bias does not leak into the audit.

**Store selection:** If the user names a store or the work lives in one, pass `--store <id>` to any `openspec` commands. Without a store, commands act on the nearest local `openspec/` root.

**Steps**

1. **Select the change**
   If a change name is provided, use it. Otherwise infer from context or discover via `openspec list --json`.
   Always announce: "Running PR audit for change: <name>"
   If a second argument names a base ref, use it instead of `origin/main`.

2. **Collect the working-tree diff**
   The review compares the current working tree against the base ref. Committed, staged, unstaged, and untracked changes all count; do not require the developer to commit first.
   ```bash
   BASE=origin/main
   git diff --stat "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   git diff "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   git ls-files --others --exclude-standard -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   ```
   Read every untracked file returned by the last command from disk; `git diff` cannot show them.

3. **Read OpenSpec Planning Artifacts**
   Read all change artifacts under `openspec/changes/<name>/`:
   - `proposal.md`
   - `specs/**/*.md`
   - `design.md`
   - `adr.md` and any referenced files under `adr/`
   - `tasks.md`

4. **Conduct Adversarial Dual-Axis Audit**
   - **Axis 1 (Spec Compliance)**: Confirm every Gherkin scenario in `specs/**/*.md` has authentic test coverage. Reject tautological assertions. Verify adherence to ADR constraints. Check for scope creep.
   - **Axis 2 (Standards & Security)**: Check for parameterized queries, auth guards, Fowler smells, N+1 queries, performance bottlenecks, and file sizing.
   - Categorize issues by priority: `[CRITICAL]`, `[WARNING]`, `[SUGGESTION]`.

5. **Write Audit Report & Format Commands**
   Write the structured report to `openspec/changes/<name>/pr.md` using the template at `openspec/schemas/intent-driven/templates/pr.md`:
   - If any `[CRITICAL]` issue: Status is `BLOCKED BY CRITICAL FINDINGS`.
   - If zero `[CRITICAL]` issues: Status is `READY FOR PR`.
   - Format conventional PR title (`type(scope): concise description`) and markdown description.
   - Format ready-to-run commands for `git push -u origin HEAD` and platform options (GitHub `gh`, GitLab `glab`, or Azure Repos `az`).

6. **Output Summary in Chat**
   - If **BLOCKED**: Summarize critical findings with `file:line` citations and advise developer to resolve via `/opsx:apply <name>`.
   - If **READY**: Display formatted PR title, summary, and ready-to-run CLI commands. Do NOT execute git push or PR creation commands automatically.
