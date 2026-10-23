# PR Audit & Pull Request Summary: <change-name>

## 1. Review Verdict

- **Status:** [READY FOR PR | BLOCKED BY CRITICAL FINDINGS]
- **Reviewer Model:** [Model Name / Family] (Cross-Model Review)
- **Target Branch:** `origin/main` (or the base ref named by the developer)
- **Spec / Gherkin Verification:** [PASS | FAIL]
- **Standards & Security Compliance:** [PASS | FAIL]

---

## 2. Findings & Discrepancies

### Spec Axis (Requirements & ADR Adherence)

<!--
- [CRITICAL]: Unimplemented Gherkin scenario, violated ADR constraint, scope creep.
- [WARNING]: Incomplete edge case scenario, minor requirement drift.
-->

### Standards & Security Axis (Quality & Invariants)

<!--
- [CRITICAL]: SQL/EF injection risk, missing auth guard, broken contract.
- [WARNING]: N+1 query, Fowler code smell, missing error handling.
- [SUGGESTION]: Cleanups, naming refinement.
-->

---

## 3. Pull Request Details

### Title

`type(scope): concise description`

<!-- Note: Reference any issue/ticket if applicable (e.g. #123, PROJ-456); omit if none exists -->

### Description

```markdown
## Overview

<!-- 2-3 sentence summary adapted from proposal.md -->

## Key Architectural Decisions

<!-- Key decisions and constraints from adr.md and design.md -->

## Verification & Testing

- [x] Gherkin scenarios verified against test suite
- [x] Zero critical security or regression defects identified

## OpenSpec Reference

- Change: `<change-name>`
- Artifacts reviewed: `proposal.md`, `specs/`, `design.md`, `adr.md`
```

---

## 4. Ready-to-Run Pull Request Commands

```bash
# Push branch to remote (if not already pushed)
git push -u origin HEAD

# Option A: GitHub CLI
gh pr create \
  --title "<PR Title>" \
  --body "<PR Description Markdown>" \
  --base main

# Option B: GitLab CLI
glab mr create \
  --title "<PR Title>" \
  --description "<PR Description Markdown>" \
  --target-branch main

# Option C: Azure Repos CLI
az repos pr create \
  --title "<PR Title>" \
  --description "<PR Description Markdown>" \
  --target-branch main \
  --open
```
