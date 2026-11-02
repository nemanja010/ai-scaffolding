---
name: "OPSX: Sync Docs"
description: "Synchronize OpenSpec specifications, ADRs, codebase snapshots, and archived changes into comprehensive Obsidian documentation"
allowed-tools: Bash(node:*)
category: "Workflow"
tags: ["workflow", "documentation", "obsidian", "sync"]
---

Synchronize living behavior specifications, domain catalogs, architectural decisions, archived changes, and codebase source code into the Obsidian documentation vault under `Documentation/`.

**Steps**

1. **Execute documentation synchronization**
   Run the synchronization script from the repository root:
   ```bash
   node .agents/skills/documentation-sync/scripts/sync-docs.cjs $ARGUMENTS
   ```
   To force a complete vault rebuild regardless of cache:
   ```bash
   node .agents/skills/documentation-sync/scripts/sync-docs.cjs --force
   ```
   *Note: The script automatically runs Tree-sitter AST compression via Repomix (with native language AST parser fallback), compiles `.agent-workspace/ast-symbols.json`, and compares SHA-256 AST hashes to determine if changes exist.*

2. **Grasp codebase via AST symbols & verify comprehensive "WHAT", "HOW", and "WHY"**
   - Read `.agent-workspace/ast-symbols.json` (or `.agent-workspace/codebase-summary.xml`) and query MCP tools (`agent-lsp`, `codespelunker`) to gain an immediate, compiler-grade grasp of the repository structure, entities, routines, endpoints, and contracts.
   - Inspect `Documentation/Overview/Product-Overview.md` and `Documentation/Overview/System-Architecture.md`.
   - The documentation must not merely list endpoints or files; it must thoroughly familiarize any newcomer with the product:
     - **The "WHAT" (`Product-Overview.md`)**: Explains the problem statement, value proposition, target personas, core capabilities, and user workflows with Mermaid flowcharts.
     - **The "HOW" & "WHY" (`System-Architecture.md`)**: Explains the architectural model, component context diagram, end-to-end execution lifecycle with Mermaid sequence diagram, subsystem responsibilities, design invariants, and trade-offs.
   - If the codebase contains specialized domain logic, enrich the overview notes with domain-specific depth.

3. **Display completion summary**
   - Link the user to `Documentation/Home.md` (Map of Content).
   - Summarize which feature, reference, decision, or changelog notes were created or updated.
