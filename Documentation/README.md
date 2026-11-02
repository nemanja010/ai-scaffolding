---
title: "Developer Documentation Vault Guide"
description: "Reading guide and orientation for exploring this documentation vault in Obsidian or VS Code Foam."
type: guide
tags:
  - documentation
  - vault
  - obsidian
  - guide
---

# Developer Documentation Vault

Welcome to the **Obsidian-compatible developer knowledge vault** for this repository.

## Opening in Obsidian
1. Open [Obsidian](https://obsidian.md).
2. Select **Open folder as vault**.
3. Choose the `Documentation/` folder of this repository.

## Navigating the Vault
- **Start at [[Home]]**: The central Map of Content (MOC), Executive Architecture Scorecard, and system overview.
- **Explore Architecture in [[Overview/Overview]]**: Master architectural mental model, role-tailored reading paths, and container topologies.
- **Explore Capabilities in [[Features/Overview]]**: Living product capabilities, core workflows, and business invariants.
- **Inspect Decisions in [[Decisions/Overview]]**: Architectural Decision Records (ADRs) with an interactive Mermaid supersession graph.
- **Track Changes in [[Changelog/Overview]]**: Chronological release history synthesized from OpenSpec change proposals.

## Automatic Synchronization
This vault is dynamically maintained by the OpenSpec documentation sync engine. Whenever you complete a feature or change, run:
```bash
/opsx-sync-docs
```
*(or run `node .agents/skills/documentation-sync/scripts/sync-docs.cjs`)*.
