---
name: Architecture Note
mode: agent
description: Generate a structured architecture update note from staged git changes to document in docs/updates/YYYY-MM-DD-<slug>.md.
tools:
  - run_in_terminal
  - create_file
  - read_file
---

# Architecture Update Note Generator

You are helping a developer document an architectural change, significant feature, or refactor for the repository documentation in `docs/updates/`.

---

## Step 1 — Collect Git Context

Execute the following commands to inspect the changes:

```bash
git diff --staged --stat
git diff --staged
```

If nothing is staged, fall back to the most recent commit:

```bash
git diff HEAD~1 --stat
git diff HEAD~1
```

Also retrieve recent commit context:

```bash
git log --oneline -1
```

---

## Step 2 — Analyze the Changes

From the diff and commit history, extract:

- **Scope**: Identify affected applications (`apps/*`) and shared libraries (`libs/*`). List them comma-separated.
- **Type**: Choose one: `New Feature | Refactor | Bug Fix | Architecture Refactor | Performance | Security`.
- **What Changed**: Group related file changes into logical subsections (e.g., "Domain Model Refactor", "API Gateway Updates", "State Management Enhancements").
- **Why & Architectural Impact**: What problem does this solve? What design pattern or abstraction was introduced or modified? What architectural boundaries are affected?
- **Related Documentation**: Identify related architecture documents in `docs/` or living specifications in `openspec/specs/`.

---

## Step 3 — Determine the Output Filename

Format: `docs/updates/YYYY-MM-DD-<slug>.md`

- Use the current date (`YYYY-MM-DD`).
- The `<slug>` must be 3–6 lowercase, hyphen-separated words describing the update (e.g., `2026-10-06-token-refresh-mechanism.md`).

---

## Step 4 — Write the Update Note

Create the file at `docs/updates/YYYY-MM-DD-<slug>.md` using this standard template:

```markdown
---
title: "Update: <Topic Title> (<YYYY-MM-DD>)"
description: <One sentence summarizing what changed and what it achieves. Max 200 characters.>
tags: [update, <2–5 lowercase relevant tags: architecture, frontend, backend, security, performance, data-access, state>]
related: "<[[docs/architecture-design.md]], [[openspec/specs/...]]>"
date: <YYYY-MM-DD>
scope: "<Comma-separated list of affected apps/libs>"
---

# <Topic Title>

**Date:** <YYYY-MM-DD>  
**Type:** <New Feature | Refactor | Bug Fix | Architecture Refactor | Performance | Security>

---

## Summary

<2–4 sentences providing a clear, high-level summary of what was changed and the primary outcome.>

---

## What Changed

### 1. <Descriptive heading for first group of changes>

<Explanation of changes in this area. Include brief before/after code snippets if illustrative of API changes.>

**Key Files:**
- `apps/...`
- `libs/...`

### 2. <Descriptive heading for next group of changes>

<Explanation of changes.>

**Key Files:**
- `...`

---

## Architectural Motivation & Impact

<Explain the rationale behind the change. What technical debt was resolved? What design principle or boundary was preserved or improved?>

---

## Testing & Verification Evidence

<Document the verification steps executed (unit tests, integration tests, type checks) and their results without fabricating unverified metrics.>
```
