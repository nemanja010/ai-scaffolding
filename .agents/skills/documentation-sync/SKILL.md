---
name: documentation-sync
description: Synchronize OpenSpec living specifications, domain models, ADRs, and archived changes into an Obsidian-compatible product documentation vault under Documentation/. Use when updating product documentation, after archiving an OpenSpec change, or when invoked via /opsx-sync-docs or /opsx:sync-docs.
---

# Documentation Sync Skill

Synchronize living behavior specifications (`openspec/specs/`), architectural domains (`openspec/domains.yaml`), Architecture Decision Records (`adr/`), and archived changes (`openspec/changes/archive/`) into a product-oriented Obsidian markdown vault under `Documentation/`.

## When to Use

- After archiving an OpenSpec change (`/opsx-archive` or `/opsx:archive`) to update the changelog and refreshed capability notes.
- When living specifications or domain boundaries are modified.
- When an engineer or agent invokes `/opsx-sync-docs` or `/opsx:sync-docs`.
- When verifying that documentation accurately reflects current system behavior contracts.

## How it Works

1. **Intelligent Incremental Synchronization**:
   - Compares SHA-256 hashes of living specs, domains, and archived change proposals against `Documentation/.sync-state.json`.
   - Skips unchanged files entirely, completing in milliseconds with zero redundant disk writes.
   - Re-indexes only modified or new entries.
   - Supports `--force` to bypass state tracking and recompile the complete vault.

2. **Product-Centric Knowledge Graph**:
   - Organizes documentation by product and user concerns rather than raw spec folders:
     - `Documentation/Home.md`: Master Map of Content (MOC) and visual dashboard.
     - `Documentation/Overview/`: Product vision, high-level architecture, and system actors.
     - `Documentation/Features/`: Functional capabilities, user workflows, and behavioral acceptance criteria.
     - `Documentation/Guides/`: Practical developer and user guides.
     - `Documentation/Reference/`: Configuration parameters, API/CLI contracts, and the dynamic domain catalog.
     - `Documentation/Decisions/`: Architectural Decision Records (ADRs).
     - `Documentation/Changelog/`: Release history compiled from archived OpenSpec changes.

3. **Obsidian Conventions**:
   - YAML frontmatter with tags (`#category`, `#domain/<id>`, `#capability/<id>`).
   - Bidirectional wikilinks (`[[Page Name]]`).
   - Gherkin `GIVEN / WHEN / THEN` scenarios formatted as readable callout blocks (`> [!EXAMPLE] Scenario: ...`).

## Execution

Run the synchronization engine using Node.js:

```bash
# Normal incremental sync
node .agents/skills/documentation-sync/scripts/sync-docs.cjs

# Force full vault regeneration
node .agents/skills/documentation-sync/scripts/sync-docs.cjs --force

# Verbose output
node .agents/skills/documentation-sync/scripts/sync-docs.cjs --verbose
```

## AI Agent Integration

When invoked via slash command in any AI harness:
1. Run the script: `node .agents/skills/documentation-sync/scripts/sync-docs.cjs`.
2. Inspect the output summary.
3. Report the updated files and provide clickable links to `Documentation/Home.md` and the updated notes.
