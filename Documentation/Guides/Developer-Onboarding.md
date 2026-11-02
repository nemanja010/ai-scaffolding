---
title: "Developer Onboarding & Workflow Guide"
description: "Essential onboarding guide for software engineers and AI coding assistants navigating the multi-harness development workflow."
type: guide
tags:
  - guide
  - onboarding
  - developer
  - workflow
---

# Developer Onboarding & Workflow Guide

## Welcome to the Project
This repository is engineered for seamless, specification-driven collaboration between human software engineers and AI coding assistants across terminals, editors, and IDEs.

## Multi-Harness Toolchain
The repository provides unified instruction governance and skills across all 4 major AI harnesses:
- **GitHub Copilot**: Configured via `.github/` instructions and prompt files.
- **OpenCode**: Configured via `.opencode/` subagents, commands, and skills.
- **Claude Code**: Configured via `.claude/` commands and `CLAUDE.md`.
- **Google Antigravity CLI & IDE**: Configured via `.gemini/` and `GEMINI.md`.

All harnesses align to the canonical rules in `AGENTS.md`.

## The OpenSpec Development Lifecycle
All non-trivial feature additions, architectural updates, and bug fixes follow the spec-driven lifecycle:
1. **Propose (`/opsx-propose` or `openspec new change <name>`)**: Draft user story, architecture design, living spec deltas, and task checklist.
2. **Apply (`/opsx-apply`)**: Execute tasks step-by-step using test-driven development.
3. **Verify (`/opsx-verify`)**: Validate that all scenarios and contract invariants pass.
4. **Archive & Synchronize (`/opsx-archive` & `/opsx-sync-docs`)**: Promote delta specs into living specifications and synchronize this documentation vault.

## Key Engineering Discipline & Rules
- **Anti-Fabrication**: Never invent metrics, benchmark percentages, or test counts. Empirical evidence is mandatory.
- **Git Commit Approval Gate**: AI agents never run `git commit`, amend, or push without explicit confirmation from the developer.
- **Deterministic Time**: Always inject clock/time abstractions; never reference system time directly in domain logic.

---
[[Home|← Back to Home]] | [[Guides/OpenSpec-Governance|OpenSpec Governance →]]
