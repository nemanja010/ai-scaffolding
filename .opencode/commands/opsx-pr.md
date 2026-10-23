---
description: Run cross-model PR audit, write pr.md, and output Pull Request commands
agent: pr-reviewer
model: github-copilot/claude-opus-5.5
subtask: true
---

Execute the cross-model PR review for OpenSpec change: $ARGUMENTS

The review compares the **current working tree** against the base ref, which is `origin/main` unless the developer names a different base as a second argument (replace `origin/main` below in that case). Committed, staged, unstaged, and untracked changes all count: the developer should not have to commit or push before this audit.

### 1. Collect the Diff

Tracked changes (committed + staged + unstaged) versus the base ref:

!`git diff --stat origin/main -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'`

!`git diff origin/main -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'`

Untracked files are invisible to `git diff`. List them and read each file from disk:

!`git ls-files --others --exclude-standard -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'`

### 2. Execution Instructions

1. Read the change artifacts in `openspec/changes/$ARGUMENTS/` (`proposal.md`, `specs/**/*.md`, `design.md`, `adr.md`, `tasks.md`).
2. Conduct the dual-axis review comparing the tracked diff **and the untracked files listed above** against the specs and repo standards.
3. Write the completed report into `openspec/changes/$ARGUMENTS/pr.md` using the template at `openspec/schemas/intent-driven/templates/pr.md`.
4. Output the final verdict summary in chat:
   - If **BLOCKED**: Summarize the critical findings with file/line citations and prompt the developer to address them via `/opsx-apply $ARGUMENTS`.
   - If **READY**: Display the ready-to-run `git push` and PR creation CLI commands with the prepared title and description.
