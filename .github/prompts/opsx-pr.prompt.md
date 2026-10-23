---
description: "Run cross-model PR audit, write pr.md, and output Pull Request commands"
---

Execute the cross-model PR review for the OpenSpec change named in the request (the first argument after `/opsx-pr`). If no change name is given, infer it from context or run `openspec list --json`. If a second argument names a base ref, use it instead of `origin/main`.

The review compares the **current working tree** against the base ref. Committed, staged, unstaged, and untracked changes all count; the developer does not commit or push before this audit.

### 1. Collect the Diff

Tracked changes (committed + staged + unstaged) versus the base ref:

```bash
BASE=origin/main
git diff --stat "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
git diff "$BASE" -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
```

Untracked files are invisible to `git diff`. List them, then read each file from disk:

```bash
git ls-files --others --exclude-standard -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
```

### 2. Execution Instructions

1. Read the change artifacts in `openspec/changes/<change-name>/` (`proposal.md`, `specs/**/*.md`, `design.md`, `adr.md`, `tasks.md`).
2. Conduct the dual-axis review comparing the tracked diff **and the untracked files listed above** against the specs and repo standards.
3. Write the completed report into `openspec/changes/<change-name>/pr.md` using the template in `openspec/schemas/intent-driven/templates/pr.md`.
4. Output the final verdict summary in chat:
   - If **BLOCKED**: Summarize the critical findings with file/line citations and prompt the developer to address them via `/opsx-apply <change-name>`.
   - If **READY**: Display the ready-to-run `git push` and PR creation CLI commands (such as `gh pr create`, `glab mr create`, or `az repos pr create`) with the prepared title and description. Do NOT execute git push or PR creation commands automatically.
