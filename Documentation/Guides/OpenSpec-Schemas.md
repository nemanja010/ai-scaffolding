---
title: "OpenSpec Schemas"
type: guide
last_synced: "2026-11-02T22:51:46.032Z"
tags:
  - guide
  - schemas
  - openspec
---

# OpenSpec Artifact Schemas & Syntax

> [!NOTE] Framework Reference
> Synced from `openspec/SCHEMAS.md`.

# OpenSpec Schemas Architecture & Customization Guide

This document explains how OpenSpec schemas define, structure, and enforce change workflows across this repository. It covers schema anatomy, customization, community sources, validation, and upgrade invariance.

---

## 1. What is an OpenSpec Schema?

An OpenSpec schema is a declarative workflow definition that governs how change proposals are authored, validated, implemented, and archived. Schemas decouple the **workflow structure** (stages, required artifacts, document templates, and validation gates) from the **CLI engine** (`@openspec/cli`).

In this repository, the primary schema is `intent-driven`, which enforces an engineering workflow prioritizing contributor intent, observable behavioral specifications, technical design, durable architectural decision records (ADRs), and trackable implementation tasks.

---

## 2. Anatomy of a Schema

All schemas reside in userland under:
```text
openspec/schemas/<schema-name>/
├── schema.yaml          ← Declarative artifact DAG, rules, and apply instructions
├── README.md            ← Documentation explaining workflow stages and gates
└── templates/           ← Markdown starter templates rendered for each artifact
    ├── proposal.md
    ├── spec.md
    ├── design.md
    ├── adr.md
    └── tasks.md
```

### The `schema.yaml` File

`schema.yaml` defines the schema metadata, stage dependencies (a directed acyclic graph), generated file paths, and instructions:

```yaml
name: intent-driven
version: 1
description: Intent-driven workflow (proposal -> specs -> design -> adr -> tasks)

artifacts:
  - id: proposal
    generates: proposal.md
    description: Initial proposal document outlining the change
    template: proposal.md
    instruction: >
      Create the proposal document that establishes WHY this change is needed...
    requires: []

  - id: specs
    generates: specs/**/*.md
    description: OpenSpec Markdown specs with Gherkin-style behavior scenarios
    template: spec.md
    instruction: >
      Create OpenSpec Markdown spec files defining WHAT the system should do...
    requires:
      - proposal

  - id: design
    generates: design.md
    description: Technical design document with implementation details
    template: design.md
    instruction: >
      Create the design document explaining HOW to implement the change...
    requires:
      - proposal

  - id: adr
    generates: adr.md
    description: Per-change ADR review manifest and durable decision handoff
    template: adr.md
    instruction: >
      Complete ADR review for this change by writing a concise manifest...
    requires:
      - design

  - id: tasks
    generates: tasks.md
    description: Implementation checklist with trackable tasks
    template: tasks.md
    instruction: >
      Create the task list that breaks down implementation work...
    requires:
      - specs
      - adr

apply:
  requires:
    - tasks
  tracks: tasks.md
  instruction: |
    Read context files, work through pending tasks, mark complete as you go.
    Must use test-driven-development skill when implementing features or fixes.
    Must use verification-before-completion skill before marking any task complete.
```

#### Key Schema Attributes:
- **`id`**: Unique string identifier for the artifact stage (e.g., `proposal`, `specs`, `design`, `adr`, `tasks`).
- **`generates`**: Target file path or glob pattern within `openspec/changes/<change-name>/`.
- **`template`**: Relative path to the starter markdown template inside `templates/`.
- **`instruction`**: Prompt instructions provided to AI agents or human authors during creation.
- **`requires`**: List of upstream artifact IDs that must be completed before this artifact can be scaffolded.
- **`apply`**: Defines execution phase constraints (`requires: [tasks]`, `tracks: tasks.md`, and execution instructions).

---

## 3. Customizing the `intent-driven` Schema

Because schemas live in the repository's source tree (`openspec/schemas/`), your team has full ownership to adapt them to your project's unique requirements.

### Editing Templates
You can customize any markdown template in `openspec/schemas/intent-driven/templates/`:
- **`templates/proposal.md`**: Add domain-specific problem framing or customer impact sections.
- **`templates/design.md`**: Mandate specific diagram styles (Mermaid, C4), security threat modeling sections, or latency budgets.
- **`templates/tasks.md`**: Add pre-configured verification or quality gate checkboxes.

### Modifying Schema Rules
You can update `schema.yaml` to:
- Adjust authoring prompts and AI agent guidance.
- Add new artifacts to the change lifecycle (e.g., a `threat-model.md` artifact dependent on `design`).
- Change stage dependencies (e.g., requiring `design` before `specs` if your team follows design-first rather than spec-first).

---

## 4. Downloading & Using Alternative Schemas

You are not limited to `intent-driven`. OpenSpec supports swapping or maintaining multiple workflow schemas tailored to your team's process.

### Authoritative Documentation & Sources
- **Community Schemas Guide**: Explore community-contributed schemas and alternative workflows:
  [https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md#community-schemas](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md#community-schemas)
- **Editing Your Fork & Customizing Schemas**: Detailed instructions on forking schemas, adjusting artifacts, and maintaining customizations:
  [https://openspec.dev/docs/customize-schemas#editing-your-fork](https://openspec.dev/docs/customize-schemas#editing-your-fork)
- **Intent-Driven Dev Schemas Hub**: Additional reference workflows:
  [https://github.com/intent-driven-dev/openspec-schemas](https://github.com/intent-driven-dev/openspec-schemas)
- **Built-in / Standard Schemas**:
  - `default`: Minimal change proposal and tasks.
  - `behaviour-driven`: Focused on BDD scenarios without full architectural design documents.
  - `lightweight`: Streamlined single-stage proposals for rapid prototyping or small fixes.

### Installing a Schema
To install a schema from a community repository or another project:
1. Clone or copy the schema directory into `openspec/schemas/<schema-name>/`:
   ```bash
   # Example: copy or download schema into your repository
   mkdir -p openspec/schemas/lightweight
   # Copy schema.yaml, README.md, and templates/ into openspec/schemas/lightweight/
   ```
2. Verify that `openspec/schemas/<schema-name>/schema.yaml` is present and valid.

---

## 5. Registering and Switching Schemas

To activate a schema for the repository, set the `schema` key in `openspec/config.yaml`:

```yaml
# openspec/config.yaml
schema: intent-driven

rules:
  proposal:
    - Can use brainstorming skill to explore user intent, domain boundaries, and requirements when helpful
    - Can use grill-with-docs skill (or grilling) to stress-test scope, decisions, and persist ubiquitous domain language into glossary/
  design:
    - Must use c4-diagrams skill
  adr:
    - Must use architectural-decision-records skill
  specs:
    - Must use gherkin-authoring skill
  tasks:
    - Must use writing-plans skill for task granularity and ordering, but write the result into tasks.md using the schema checkbox format (never docs/superpowers/plans/) and do not commit
```

To switch to a different schema, update the `schema` field:
```yaml
schema: lightweight
```
Existing archived changes remain safe under `openspec/changes/archive/`. Active changes will be evaluated against the registered schema.

---

## 6. Validating Schemas

You can validate that your custom or installed schema is well-formed using the OpenSpec CLI:

```bash
# Validate the active schema or a specific schema by name
openspec schema validate intent-driven
```

The validation command verifies:
1. `schema.yaml` parses as valid YAML and conforms to the OpenSpec schema specification.
2. All artifact IDs are unique and reference valid templates in `templates/`.
3. The dependency graph defined by `requires` is a valid directed acyclic graph (no circular references).
4. File generation patterns (`generates`) are valid file names or glob patterns.
5. `apply` specifies valid tracked files and prerequisites.

---

## 7. CLI Updates & Userland Isolation

A core architectural advantage of OpenSpec is that **schemas live strictly in repository userland**.

- When you update the CLI package (e.g. `npm install -g @openspec/cli@latest` or `npx @openspec/cli`), the CLI update **never** touches or overwrites `openspec/schemas/`, `openspec/domains.yaml`, or `openspec/config.yaml`.
- The CLI acts strictly as an execution runner that reads your repository's local schema definitions.
- Customizations to `intent-driven` templates, prompts, and rules are tracked in version control (`git`) and remain permanent.


---
[[Home|← Back to Home]] | [[Guides/OpenSpec-Governance|← OpenSpec Governance]]
