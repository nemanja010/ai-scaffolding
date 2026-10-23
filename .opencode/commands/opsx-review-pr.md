---
description: Fetch and review a remote PR locally by PR ID or branch
agent: pr-reviewer
model: github-copilot/claude-opus-5.5
subtask: true
---

Review Pull Request: $ARGUMENTS

### 1. Checkout the PR Branch

Ask the developer which hosting platform applies if it is not obvious, then run the matching command:

- GitHub: `gh pr checkout $ARGUMENTS`
- GitLab: `glab mr checkout $ARGUMENTS`
- Azure Repos: `az repos pr checkout --id $ARGUMENTS`
- Standard Git: `git checkout $ARGUMENTS` (branch must already exist locally or on a fetched remote)

The review evaluates the committed PR content, not unrelated local working-tree changes. If the base ref differs from `origin/main`, substitute it in the commands below.

### 2. Inspect Changes Against the Base

!`git diff --stat origin/main...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'`

!`git diff origin/main...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'`

### 3. Execution Instructions

1. Analyze the changes against project conventions, security standards, and performance invariants.
2. Produce a two-axis review summary (Standards & Invariants).
3. Output the summary in chat with specific `File:Line` citations.
4. Output suggested CLI review commands (e.g. `gh pr review`, `glab mr note`, or `az repos pr set-vote`). Do NOT submit the review or vote yourself.
