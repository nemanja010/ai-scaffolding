---
name: documentation-sync
description: Synchronize OpenSpec living specifications, domain models, ADRs, and archived changes into an Obsidian-compatible product documentation vault under Documentation/. Use when updating product documentation, after archiving an OpenSpec change, or when invoked via /opsx-sync-docs or /opsx:sync-docs.
---

# Documentation Sync Skill

Synchronize living behavior specifications (`openspec/specs/`), architectural domains (`openspec/domains.yaml`), Architecture Decision Records (`adr/`), archived changes (`openspec/changes/archive/`), and codebase AST symbols into a product-oriented Obsidian markdown vault under `Documentation/`.

## When to Use

- After archiving an OpenSpec change (`/opsx-archive` or `/opsx:archive`) to update the changelog and refreshed capability notes.
- When living specifications, domain boundaries, or application codebases are modified.
- When an engineer or agent invokes `/opsx-sync-docs` or `/opsx:sync-docs`.
- When reviewing a project (e.g. a newly cloned template, starter app, or mature codebase) to ensure documentation comprehensively familiarizes the reader with the product.

## How it Works

1. **AST Symbol Detection & Codebase Grasping**:
   - **Dual-Engine Grasping**: Uses Tree-sitter AST compression via Repomix (`repomix --compress`) when available, paired with a native zero-dependency language AST symbol extractor across TypeScript, JavaScript, Python, Rust, Go, Java, C#, and C++.
   - **Structured Symbol Catalog**: Compiles all classes, interfaces, structs, routines, HTTP endpoints, and entrypoints into `.agent-workspace/ast-symbols.json` and `.agent-workspace/codebase-summary.xml`.
   - **Compiler-Grade Change Detection**: Computes a canonical SHA-256 fingerprint of all AST signatures (`state.astHash`). If code formatting or comments change without altering AST symbols or living specs, sync skips redundant rebuilds in milliseconds.

2. **The "WHAT", "HOW", and "WHY" Documentation Contract**:
   - The synchronizer never just lists endpoints, files, and controllers. It generates documentation that makes the system easy to learn for anyone unfamiliar with it:
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

3. **Intelligent Incremental Synchronization**:
   - Tracks hashes of living specs, domains, ADRs, and the AST symbol snapshot in `Documentation/.sync-state.json`.
   - Bypasses disk writes when all sources are unchanged, completing in milliseconds.
   - Re-indexes only modified or new entries. Use `--force` to bypass state tracking and recompile the complete vault.

4. **Product-Centric Knowledge Graph**:
   - `Documentation/Home.md`: Master Map of Content (MOC) and dashboard.
   - `Documentation/Overview/`: Product vision, architecture, and system actors.
   - `Documentation/Features/`: Functional capabilities and Gherkin acceptance criteria.
   - `Documentation/Guides/`: Practical onboarding, OpenSpec Governance, and Schema reference.
   - `Documentation/Reference/`: Configuration parameters and Domain Catalog.
   - `Documentation/Decisions/`: Synced Architecture Decision Records (ADRs).
   - `Documentation/Changelog/`: Release history compiled from archived OpenSpec changes.

## Execution

Run the synchronization engine using Node.js:

```bash
# Normal incremental sync (uses AST symbol fingerprinting & Repomix snapshot)
node .agents/skills/documentation-sync/scripts/sync-docs.cjs

# Force full vault regeneration
node .agents/skills/documentation-sync/scripts/sync-docs.cjs --force

# Verbose output (displays discovered symbols, AST hash, and snapshot engine)
node .agents/skills/documentation-sync/scripts/sync-docs.cjs --verbose
```

## AI Agent Integration

When invoked via slash command in any AI harness (`/opsx-sync-docs` or `/opsx:sync-docs`):
1. **Execute the synchronizer**:
   Run `node .agents/skills/documentation-sync/scripts/sync-docs.cjs`.
2. **Grasp the entire codebase via AST symbols**:
   Read `.agent-workspace/ast-symbols.json` (or `.agent-workspace/codebase-summary.xml`) and query MCP tools (`agent-lsp`, `codespelunker`) to gain an immediate, holistic understanding of all symbols, contracts, and entrypoints.
3. **Verify Comprehensive Documentation (WHAT, HOW, and WHY)**:
   - Inspect `Documentation/Overview/Product-Overview.md` and `Documentation/Overview/System-Architecture.md`.
   - Ensure the documentation thoroughly familiarizes the reader with the product:
     - Is the "WHAT" clear (problem, value, personas, capabilities, workflows)?
     - Is the "HOW" clear (architectural style, component diagram, execution sequence diagram)?
     - Is the "WHY" clear (design rationale, invariants, trade-off matrix)?
   - If the codebase has unique domain nuances or specialized workflows, enrich the Overview notes so anyone unfamiliar with the product learns everything needed.
4. **Report Status**:
   Report the updated files and provide clickable links to `Documentation/Home.md` and the updated notes.
