---
name: "OPSX: Review PR"
description: "Fetch and review a remote PR locally by PR ID or branch"
allowed-tools: Bash(git:*, gh:*, glab:*, az:*), Read, Grep, Glob, Task
category: "Workflow"
tags: ["workflow", "pr", "review"]
---

Review Pull Request: $ARGUMENTS

**Isolation requirement:** Delegate to the `pr-reviewer` subagent so the review runs in fresh context with a different model family than the author.

**Steps**

1. **Checkout PR Branch Locally**
   Ask which hosting platform applies if it is not obvious, then run the matching command:
   - GitHub: `gh pr checkout $ARGUMENTS`
   - GitLab: `glab mr checkout $ARGUMENTS`
   - Azure Repos: `az repos pr checkout --id $ARGUMENTS`
   - Generic Git: `git checkout $ARGUMENTS`

2. **Inspect Filtered Diff Against Base**
   The review evaluates the committed PR content, not unrelated local working-tree changes.
   ```bash
   BASE=origin/main
   git diff --stat "$BASE"...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   git diff "$BASE"...HEAD -- . ':!*package-lock.json' ':!*.generated.*' ':!*/dist/*' ':!dist/*' ':!*.map'
   ```

3. **Conduct Dual-Axis Review**
   Analyze the changes against project conventions, security standards, and performance invariants.
   Categorize findings by `[CRITICAL]`, `[WARNING]`, `[SUGGESTION]`.

4. **Output Findings & Suggested Review Vote**
   Output the review summary in chat with specific `file:line` citations.
   Display suggested CLI review commands (e.g. `gh pr review`, `glab mr note`, or `az repos pr set-vote`). Do NOT submit the review or vote yourself.
