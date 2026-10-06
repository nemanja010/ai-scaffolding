---
name: OpenSpec Architecture & Domain Governance
description: Directs agents to read openspec/domains.yaml, GOVERNANCE.md, and SCHEMAS.md for architecture, new features, and change proposals.
applyTo: "**"
---

# OpenSpec Architecture & Domain Governance

This instruction mandates dynamic domain discovery, living specification integrity, and governance rules for all AI agents creating or modifying features, specifications, and architecture.

---

## Required Reading Before Specification Work

Whenever tasked with designing architecture, introducing a new feature, modifying system behavior, or executing an OpenSpec workflow (`/opsx-*` commands), you **MUST** read the following governance files:

1. **`openspec/domains.yaml`**: The canonical catalog of bounded contexts, architectural domains, and recognized capabilities.
2. **`openspec/GOVERNANCE.md`**: The governance principles, domain lifecycle policies, and naming conventions.
3. **`openspec/SCHEMAS.md`**: The schema mechanics, artifact stages, template guidelines, and validation instructions.

---

## Core Governance Directives

### 1. Dynamic Domain Discovery
- **Never hardcode or assume a static list of domains.**
- Always read `openspec/domains.yaml` dynamically to inspect current active domains, capability listings, and architectural boundaries.
- Respect the definitions and boundaries established in `domains.yaml` as the authoritative source of truth.

### 2. High-Friction Gate for New Domains
- **Domains represent top-level architectural boundaries and bounded contexts.**
- Adding a new domain impacts repository structure, module organization, team boundaries, and the living specification hierarchy.
- If a requested change or proposed feature does not immediately align with an existing domain:
  1. **Pause before creating a new domain.**
  2. **Warn the developer** that introducing a new domain constitutes an architectural boundary change affecting the entire codebase.
  3. **Analyze existing domains** and suggest the closest matching domain from `openspec/domains.yaml`.
  4. Only declare a new domain if the developer explicitly approves the architectural boundary expansion.

### 3. Decisive Capability Extension
- When a change clearly aligns with an existing domain in `openspec/domains.yaml`:
  - Target that capability directly and inspect its living specification at:
    `openspec/specs/<domain>/<capability>/spec.md`
  - Do NOT pause to ask the developer whether to create a new capability if the requirement naturally extends an existing one.
  - When introducing a genuinely new capability within an approved domain, declare it in `openspec/domains.yaml` with a clear description following the schema in `openspec/GOVERNANCE.md`.

### 4. Living Specifications Hierarchy
- **Living specs are permanent truth**: They reside strictly at:
  ```
  openspec/specs/<domain>/<capability>/spec.md
  ```
- **Active changes are temporary staging**: They reside at:
  ```
  openspec/changes/<change-name>/
  ```
  Inside an active change, delta specifications reflect proposed changes against living specs.
- **Archived changes are historical records**: When an implementation is complete and verified, archiving moves the change to:
  ```
  openspec/changes/archive/YYYY-MM-DD-<name>/
  ```
- **Spec synchronization**: Delta specifications from changes must be synced into the living specifications (`/opsx-sync` or `openspec-sync-specs`) to keep system documentation evergreen.

### 5. Schema Alignment (`intent-driven`)
- This repository uses the custom **`intent-driven`** schema configured in `openspec/config.yaml`.
- Artifact sequence:
  `proposal.md` → `spec.md` (delta requirements & Gherkin scenarios) → `design.md` → `adr.md` (if architectural decisions are made) → `tasks.md`.
- All artifacts must adhere strictly to the schema templates in `openspec/schemas/intent-driven/templates/` and rules documented in `openspec/SCHEMAS.md`.

---

## Proactive Nudge on Unspecced Work

If a developer asks to implement a feature, refactor architecture, or make non-trivial code modifications without an active OpenSpec change:

> *"I notice we don't have an active OpenSpec change for this work. In this project, changes are spec-driven to keep our living system documentation accurate. Shall I create an OpenSpec change under `<domain>/<capability>` based on what you've described (or your current working tree diff)?"*

Do NOT proceed with code implementation until an OpenSpec change is established or the developer explicitly directs otherwise.
