---
description: "Fetch and review a remote PR locally by PR ID or branch"
---

Review the Pull Request named in the request (the first argument after `/opsx-review-pr`: a PR ID or branch name). If a second argument names a base ref, use it instead of `origin/main`.

### 1. Checkout PR Branch Locally

Ask the developer which hosting platform applies if it is not obvious, then run the matching command:

- GitHub: `gh pr checkout <pr-id-or-branch>`
- GitLab: `glab mr checkout <pr-id-or-branch>`
- Azure Repos: `az repos pr checkout --id <pr-id-or-branch>`
- Standard Git: `git checkout <branch>`

The review evaluates the committed PR content, not unrelated local working-tree changes.

### 2. Inspect Changes Against the Base

```bash
BASE=origin/main
git diff --stat "$BASE"...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
git diff "$BASE"...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
```

### 3. Execution Instructions

1. Analyze the changes against project conventions, security standards, and performance invariants.
2. Produce a two-axis review summary (Standards & Invariants).
3. Output the summary in chat with specific `File:Line` citations.
4. Output suggested CLI review commands (e.g. `gh pr review`, `glab mr note`, or `az repos pr set-vote`). Do NOT submit the review or vote yourself.
