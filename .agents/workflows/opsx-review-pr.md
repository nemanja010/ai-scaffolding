---
description: "Fetch and review a remote PR locally by PR ID or branch"
---

Review a remote Pull Request locally.

**Input**: The argument after `/opsx-review-pr` is a PR ID or branch name. An optional second argument names the base ref; otherwise use `origin/main`.

**Steps**

1. **Checkout the PR branch**
   Ask which hosting platform applies if it is not obvious, then run the matching command:
   - GitHub: `gh pr checkout <pr-id-or-branch>`
   - GitLab: `glab mr checkout <pr-id-or-branch>`
   - Azure Repos: `az repos pr checkout --id <pr-id-or-branch>`
   - Generic Git: `git checkout <branch>`

   The review evaluates the committed PR content, not unrelated local working-tree changes.

2. **Inspect the filtered diff against the base**
   ```bash
   BASE=origin/main
   git diff --stat "$BASE"...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   git diff "$BASE"...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   ```

3. **Run the review in isolated context**
   Spawn a subagent with a different model family if this harness supports it; otherwise start a fresh session with a different model selected. State which model performed the review.

4. **Report findings and the suggested vote**
   Analyze the changes against project conventions, security standards, and performance invariants, categorized as `[CRITICAL]`, `[WARNING]`, `[SUGGESTION]`.
   Output the summary with `file:line` citations and suggested CLI review commands (e.g. `gh pr review`, `glab mr note`, `az repos pr set-vote`). Do NOT submit the review or vote yourself.
