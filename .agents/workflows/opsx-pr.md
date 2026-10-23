---
description: "Run cross-model PR audit, write pr.md, and output Pull Request commands"
---

Execute the cross-model PR review for an OpenSpec change.

**Input**: The argument after `/opsx-pr` is the change name. An optional second argument names the base ref; otherwise use `origin/main`.

The review compares the **current working tree** against the base ref. Committed, staged, unstaged, and untracked changes all count; the developer does not commit or push before this audit.

**Steps**

1. **Select the change**
   If a change name is provided, use it. Otherwise infer from context or discover via `openspec list --json`.
   Always announce: "Running PR audit for change: <name>"

2. **Collect the working-tree diff**
   ```bash
   BASE=origin/main
   git diff --stat "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   git diff "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   git ls-files --others --exclude-standard -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   ```
   Read every untracked file returned by the last command from disk; `git diff` cannot show them, but they are part of the change.

3. **Read OpenSpec planning artifacts**
   Read `proposal.md`, `specs/**/*.md`, `design.md`, `adr.md` (plus referenced files under `adr/`), and `tasks.md` under `openspec/changes/<name>/`.

4. **Run the audit in isolated context**
   Do not review inline in the authoring session. Spawn a subagent with a different model family if this harness supports it; otherwise start a fresh session, select a different model, and give it only the artifacts and the filtered diff. State which model performed the audit. If isolation is impossible, say so instead of claiming a cross-model review.
   - **Axis 1 (Spec Compliance)**: Verify every Gherkin scenario has authentic test coverage. Reject tautological assertions. Verify ADR adherence. Check for scope creep.
   - **Axis 2 (Standards & Security)**: Check for parameterized queries, auth guards, Fowler smells, N+1 queries, performance bottlenecks, and file sizing.
   - Categorize issues as `[CRITICAL]`, `[WARNING]`, or `[SUGGESTION]`.

5. **Write the report and format commands**
   Write `openspec/changes/<name>/pr.md` using `openspec/schemas/intent-driven/templates/pr.md`:
   - Any `[CRITICAL]` finding: status is `BLOCKED BY CRITICAL FINDINGS`.
   - Zero `[CRITICAL]` findings: status is `READY FOR PR`.
   - Format the conventional PR title (`type(scope): concise description`), the markdown description, and ready-to-run commands for `git push -u origin HEAD` plus platform options (`gh`, `glab`, `az`).

6. **Output the verdict**
   - If **BLOCKED**: Summarize critical findings with `file:line` citations and point the developer at `/opsx-apply <name>`.
   - If **READY**: Display the PR title, summary, and ready-to-run CLI commands. Do NOT execute git push or PR creation commands automatically.
