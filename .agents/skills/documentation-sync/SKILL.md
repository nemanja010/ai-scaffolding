---
name: documentation-sync
description: Synchronize OpenSpec living specifications, domain models, ADRs, and archived changes into an Obsidian-compatible product documentation vault under Documentation/. Use when updating product documentation, after archiving an OpenSpec change, or when asked to 'update docs from specs', 'sync the vault', 'update documentation', or running /opsx-sync-docs, /opsx:sync-docs, /sync-docs, or /vault-sync.
user-invocable: true
---

# Documentation Sync Skill

Synchronize living behavior specifications (`openspec/specs/`), architectural domains (`openspec/domains.yaml`), Architecture Decision Records (`adr/`), archived changes (`openspec/changes/archive/`), and codebase AST symbols into a product-oriented Obsidian markdown vault under `Documentation/`.

## When to Use

- After archiving an OpenSpec change (`/opsx-archive` or `/opsx:archive`) to update the changelog, refreshed capability notes, and ADR graphs.
- When living specifications, domain boundaries, or application codebases are modified.
- When an engineer or agent invokes `/opsx-sync-docs`, `/opsx:sync-docs`, `/sync-docs`, or `/vault-sync`.
- When onboarding to a project (e.g. a newly cloned template, starter app, or mature codebase) to ensure documentation comprehensively familiarizes the reader with the product.

---

## 💡 Tone & Readability Principle: Human-Friendly Knowledge Over Formal Spec

The vault is the accessible, high-level knowledge hub for the entire engineering and product team:

1. **No Raw Gherkin Dumps**: Never paste raw `GIVEN / WHEN / THEN` blocks directly into vault documents. Translate formal acceptance scenarios into natural, present-tense operational narratives explaining real-world behavior (e.g. *"When a user dispatches a task..."*, *"Under condition X, the system validates that..."*).
2. **Proportional Technicality**: Explain architectural concepts, operational workflows, and key constraints without getting bogged down in low-level helper names, regexes, or framework trivia.
3. **Intuitive Mental Models**: Use clean visual diagrams (Mermaid flowcharts, sequence lifecycles, and container topologies) so an engineer or product manager can absorb the architecture in 5 minutes.
4. **Interactive Graph & Reachability**: All documents must be connected via valid Obsidian `[[wikilinks]]` with zero broken links and 100% index reachability.

---

## How it Works

1. **AST Symbol Detection & Codebase Grasping**:
   - **Dual-Engine Grasping**: Uses Tree-sitter AST compression via Repomix (`repomix --compress`) when available, paired with a native zero-dependency language AST symbol extractor across TypeScript, JavaScript, Python, Rust, Go, Java, C#, and C++.
   - **Structured Symbol Catalog**: Compiles all classes, interfaces, structs, routines, HTTP endpoints, and entrypoints into `.agent-workspace/ast-symbols.json` and `.agent-workspace/codebase-summary.xml`.
   - **Compiler-Grade Change Detection**: Computes a canonical SHA-256 fingerprint of all AST signatures (`state.astHash`). If code formatting or comments change without altering AST symbols or living specs, sync skips redundant rebuilds in milliseconds.

2. **The "WHAT", "HOW", and "WHY" Documentation Contract**:
   - **The Landing Page (`Documentation/Overview/Overview.md`)**:
     - **Role-Tailored Reading Paths**: Interactive Mermaid flowcharts directing Backend Engineers, Frontend Engineers, Architects, and Product Managers along optimized reading trajectories.
     - **Subsystem & Overview Document Catalog**: Quick reference index linking all architectural levels (C1 Context, C2 Containers, C3 Components).
     - **Foundational Architectural Invariants**: Core rules (spec-driven changes, deterministic time, anti-fabrication, git commit gates, clean inward dependencies).
   - **The "WHAT" (`Documentation/Overview/Product-Overview.md`)**:
     - **Problem Statement & Value Proposition**: What real-world user or business pain point does this system solve? What value does it deliver?
     - **Target Personas & Consumers**: Who or what interacts with the system?
     - **Core Capabilities & Feature Tour**: Deep-dive into what the product does, organized by detected AST domain entities, endpoints, and operations.
     - **Key Workflows & User Journeys**: Step-by-step walkthrough of primary journeys with Mermaid flowcharts.
   - **The "HOW" & "WHY" (`Documentation/Overview/System-Architecture.md`)**:
     - **Architectural Philosophy & Model**: How the codebase is architected (monorepo, web service, CLI, modular application).
     - **Component Architecture Context**: Mermaid C4-style diagram showing actors, entry points, core subsystems, and output destinations.
     - **End-to-End Execution Flow (Data & Control Lifecycle)**: Mermaid sequence diagram showing the step-by-step path of an invocation from ingestion to processing to response.
     - **Subsystem & Module Responsibilities**: Clear delineation of what each module does and does not do.
     - **The "WHY": Design Rationale & Invariants**: Architectural principles, rejected alternatives, and trade-off matrix.

3. **Domain Capability Catalog & Living Feature Standards**:
   - `Documentation/Features/Overview.md`: Master catalog mapping capabilities directly to architectural domains declared in `openspec/domains.yaml`.
   - `Documentation/Features/Feature-Template.md`: Living layout reference showing operational purpose, domain model flowchart, narrative workflows, and key decisions/gotchas.

4. **Interactive Decisions & Chronological Changelog**:
   - `Documentation/Decisions/Overview.md`: Dynamic Mermaid ADR supersession graph (`ADR-0001 --> ADR-0002`) and authoritative ADR catalog table.
   - `Documentation/Changelog/Overview.md`: Chronological release notes synthesizing Why, What Changed, and Operational Impact from OpenSpec proposals.

5. **Automated Vault Integrity & Expressiveness Quality Gate**:
   - `verify-vault.cjs` (and `verify-vault-integrity.ps1`) automatically verifies:
     - **Canonical Vault Structure**: Strictly enforces the 6 canonical directories (`Overview/`, `Features/`, `Guides/`, `Reference/`, `Decisions/`, `Changelog/`) with zero out-of-place files or non-canonical directories.
     - **Frontmatter**: 100% of documents have valid YAML frontmatter (`title`, `description`, `tags`).
     - **Wikilinks**: 100% of Obsidian `[[wikilinks]]` resolve cleanly (0 broken links).
     - **Mermaid Diagram Validation**: All Mermaid diagrams pass both zero-dependency syntax heuristics (edge labels, sequence notes, node text, brackets) and AST engine parsing via `validate-mermaid.mjs`.
     - **Architectural Expressiveness**: `Documentation/Overview/Overview.md` exists and every document in `Documentation/Overview/*.md` has a substantive Mermaid diagram.
     - **Index Reachability**: 100% of topic pages are indexed in `Home.md` or section `Overview.md`.

---

## 📁 Vault Directory Structure

```text
Documentation/
├── Home.md                       # Master Map of Content (Vault Dashboard & Executive Scorecard)
├── README.md                     # Reading guide for Obsidian & VS Code Foam users
├── Overview/                     # Product vision, system actors, C1-C3 architecture & diagrams
│   ├── Overview.md               # Section landing page & tailored reading trajectories
│   ├── Product-Overview.md       # C1 System context, operational personas, shift/workflow lifecycle
│   └── System-Architecture.md    # C2 Container topology, communication matrix, subsystem catalog
├── Features/                     # End-to-end product capabilities & user workflows
│   ├── Overview.md               # Domain-organized index of all product capabilities
│   ├── Feature-Template.md       # Human-readable feature standard & template
│   └── [Feature-Name].md         # Living current-state feature documentation
├── Guides/                       # Practical developer onboarding & operational runbooks
│   ├── Developer-Onboarding.md   # Multi-harness developer onboarding & discipline
│   ├── OpenSpec-Governance.md    # Domain & capability governance from GOVERNANCE.md
│   └── OpenSpec-Schemas.md       # OpenSpec artifact schemas from SCHEMAS.md
├── Reference/                    # Authoritative technical contracts & catalogs
│   ├── Overview.md               # Technical reference landing page
│   ├── Domain-Catalog.md         # Canonical workflow domains & capabilities from domains.yaml
│   └── Configuration-Guide.md    # Centralized runtime settings, precedence & secrets
├── Decisions/                    # Architectural Decision Records (ADRs) with supersession graph
│   ├── Overview.md               # Mermaid supersession graph & status index
│   └── ADR-NNNN-[Title].md       # Obsidian-formatted mirrors of repo ADRs
└── Changelog/                    # Human-readable release & change history
    ├── Overview.md               # Chronological change index
    └── [YYYY-MM-DD]-[Change].md  # Synthesized human summaries from OpenSpec changes
```

---

## Step-by-Step Workflow

### Step 1 — Check Delta & Synchronization Status
Run the automated synchronizer in check mode or normal execution:
```bash
node .agents/skills/documentation-sync/scripts/sync-docs.cjs
```
*(or via PowerShell: `powershell -ExecutionPolicy Bypass -File .\.agents\skills\documentation-sync\scripts\verify-vault-integrity.ps1`)*

### Step 2 — Synthesize Changes
1. **Uncovered Codebase Assets**:
   If new apps, libraries, services, or modules were introduced, update `Documentation/Overview/System-Architecture.md` and feature pages.
2. **Pending OpenSpec Changes**:
   - Ingest `proposal.md` -> Generate `Documentation/Changelog/[YYYY-MM-DD]-[Change].md` and index in `Changelog/Overview.md`.
   - Ingest `specs/<domain>/<capability>/spec.md` -> Update feature narrative in `Documentation/Features/` (no raw Gherkin).
   - Ingest `design.md` -> Update `Overview/System-Architecture.md` and `Reference/`.
   - Ingest `adr.md` -> Create `Documentation/Decisions/ADR-NNNN-[Title].md` and update `Decisions/Overview.md`.
3. **Out-of-Place Files & Non-Canonical Folders**:
   Relocate any loose root files or non-canonical folders into the 6 canonical directories.

### Step 3 — Verify Vault Integrity & Expressiveness
Run the verification engine:
```bash
node .agents/skills/documentation-sync/scripts/verify-vault.cjs
```
Verifies canonical structure, frontmatter, wikilinks, Mermaid diagrams, expressiveness, and index reachability.

### Step 4 — Report Synchronized State
Inform the developer of:
- Which feature and reference documents were updated.
- Which ADRs and changelog entries were synchronized.
- Confirmation that vault integrity and Mermaid validation passed cleanly.
