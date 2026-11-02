---
title: "OpenSpec Governance"
description: "Governance model for architectural domains, capabilities, and living specifications."
type: guide
tags:
  - guide
  - governance
  - openspec
---

# OpenSpec Lifecycle & Domain Governance

> [!NOTE] Framework Reference
> Synced from `openspec/GOVERNANCE.md`.

# OpenSpec Domain & Capability Governance

This document establishes the canonical governance model for architectural domains, capabilities, and living specifications within this repository. It serves as the primary reference for both human software engineers and AI coding agents.

---

## 1. Core Hierarchy & Definitions

The system specification architecture is structured into three discrete layers:

```text
Domain (Bounded Context)
  └── Capability (Feature Slice & Living Spec)
        └── Requirements & Scenarios (Gherkin Behavior Contracts)
```

### Domains (Bounded Contexts)
A **Domain** represents a high-level bounded context and top-level architectural boundary of the repository.
- Declared strictly in `openspec/domains.yaml`.
- Encompasses a cohesive partition of system responsibility (e.g., `core-platform`, `api-services`, `web-client`).
- Domains are durable and slow to change. They reflect macro architecture and team ownership boundaries.
- **Rule**: Introducing a new domain is an architectural boundary change affecting the entire codebase. It requires explicit developer review and consensus.

### Capabilities (Feature Slices)
A **Capability** is a cohesive behavioral slice within a parent domain.
- Declared under a domain in `openspec/domains.yaml`.
- **One-to-One Mapping**: Exactly one capability corresponds to exactly one living specification file at:
  ```text
  openspec/specs/<domain>/<capability>/spec.md
  ```
- Groups related business rules, technical requirements, and behavior scenarios that evolve together.
- Example: `core-platform/configuration-management` specifies dynamic configuration resolution, profile handling, and secret masking.

### Requirements & Scenarios (Behavior Contracts)
A **Requirement** defines a specific functional capability, rule, or invariant.
- Declared using OpenSpec Markdown wrapper headers: `### Requirement: <Name>`.
- Contains one or more concrete behavior scenarios formatted in Gherkin syntax:
  ```markdown
  #### Scenario: <Descriptive Scenario Name>
  - **GIVEN** <initial context or precondition>
  - **WHEN** <triggering action or event occurs>
  - **THEN** <observable, verifiable system outcome>
  ```
- Expresses observable system behavior rather than transient internal implementation details.

---

## 2. Agent Decision Rules

When an AI coding agent plans or executes changes in this repository, it must adhere to the following decision hierarchy:

```
                          Proposed Change
                                │
                                ▼
         Does it fit an existing Capability in domains.yaml?
                     ├── YES ──► Decisive Capability Extension
                     │           (create delta spec for <domain>/<capability>)
                     └── NO
                          │
                          ▼
         Does it fit an existing Domain in domains.yaml?
                     ├── YES ──► New Capability in Existing Domain
                     │           (update domains.yaml, scaffold spec.md)
                     └── NO
                          │
                          ▼
         High-Friction Gate for New Domains
         - Warn developer: "Adding a new domain is an architectural boundary change."
         - Suggest closest existing domain.
         - Require explicit approval before proceeding.
```

### Rule 1: Decisive Capability Extension (Preferred Path)
Whenever a proposed change, feature addition, or bug fix clearly aligns with an existing capability listed in `openspec/domains.yaml`:
- **Action**: Automatically target that capability (`<domain>/<capability>`).
- **Do NOT ask**: Never ask the developer redundant questions like *"Should I create a new capability or extend the existing one?"*.
- **Delta Spec**: Create a delta specification at `specs/<domain>/<capability>/spec.md` within the change directory referencing the existing living spec.

### Rule 2: Adding a Capability to an Existing Domain
When a proposed change introduces a distinct new behavioral capability that fits naturally within an existing domain, but does not fit any existing capability:
- **Action**:
  1. Add the capability entry under the appropriate domain in `openspec/domains.yaml`.
  2. Provide a descriptive `id` (kebab-case) and concise `description`.
  3. Initialize the corresponding living specification at `openspec/specs/<domain>/<capability>/spec.md`.
  4. Reference `<domain>/<new-capability>` under `## Capabilities -> ### New Capabilities` in the change proposal.

### Rule 3: High-Friction Gate for New Domains
The declared domains in `openspec/domains.yaml` are designed to cover the full scope of the system. If a requested change appears not to fit any existing domain:
- **Action**:
  1. **Pause immediately** before drafting proposals or writing application code.
  2. **Alert the developer**:
     > *"Adding a new domain is an architectural boundary change affecting the entire repository and team structure."*
  3. **Suggest the closest existing domain** from `openspec/domains.yaml` and explain how the feature can map to it.
  4. **Gate**: DO NOT create a new domain unless the developer gives explicit, affirmative instruction (e.g., *"Yes, create a new domain called analytics"*).

---

## 3. Step-by-Step Lifecycle Workflows

### How to Inspect Active Domains and Specs
Before proposing or implementing any change:
1. Read `openspec/domains.yaml` to identify the active domain and capability catalog.
2. Read `openspec/specs/<domain>/<capability>/spec.md` to review existing requirements and baseline behavior.

### How to Add a New Capability
1. Open `openspec/domains.yaml`.
2. Locate the target domain and append the new capability:
   ```yaml
   domains:
     core-platform:
       capabilities:
         # Existing capabilities...
         - id: health-checks
           description: "Application liveness, readiness, and subsystem diagnostics"
   ```
3. Create the living specification directory and starter file:
   ```text
   openspec/specs/core-platform/health-checks/spec.md
   ```
4. Define requirements and Gherkin scenarios following standard OpenSpec wrapper syntax.

### How to Introduce a New Domain (Architectural Approval Required)
1. Confirm explicit developer approval.
2. Open `openspec/domains.yaml` and add the domain block:
   ```yaml
   domains:
     analytics:
       name: "Analytics & Telemetry"
       description: "Operational metric collection, aggregation pipelines, and reporting"
       capabilities:
         - id: metric-collection
           description: "Counter and gauge instrumentation across background services"
   ```
3. Create the directory tree `openspec/specs/<new-domain>/<initial-capability>/spec.md`.
4. Commit the update as an architectural change with appropriate team visibility.

### How Changes Flow from Delta to Living Spec
OpenSpec follows an intent-driven lifecycle:
```text
Proposal (proposal.md)
  └── Specs (specs/<domain>/<capability>/spec.md with ADDED/MODIFIED/REMOVED)
        └── Design (design.md)
              └── ADR Review Manifest (adr.md)
                    └── Tasks (tasks.md)
                          └── Apply & Verify
                                └── Archive (merges delta into living spec)
```
- During the change, deltas are written under `openspec/changes/<change-name>/specs/<domain>/<capability>/spec.md`.
- When the change is completed and verified, `openspec archive <change-name>` automatically merges the delta requirements into the canonical living spec at `openspec/specs/<domain>/<capability>/spec.md`.

---

## 4. Ubiquitous Domain Language Integration (`glossary/`)

To prevent semantic drift across code, specifications, and architecture decisions, all domain terminology is anchored in Domain-Driven Design (DDD) ubiquitous language:

- **Business Terminology (`glossary/business.md`)**: Defines user-facing domain concepts, entities, and workflows.
- **Technical Terminology (`glossary/technical.md`)**: Defines architectural patterns, infrastructure components, and engineering standards.
- **Workflow Integration**:
  - During the proposal and design phases, agents and developers use the `grill-with-docs` skill (or `grilling`) to clarify ambiguous concepts.
  - Any new domain term introduced or refined during an OpenSpec change must be recorded in `glossary/business.md` or `glossary/technical.md`.
  - Specs and code must use the exact terms defined in the glossary (avoiding forbidden synonyms listed in the *Avoid* column).


---
[[Home|← Back to Home]] | [[Guides/OpenSpec-Schemas|OpenSpec Schemas →]]
