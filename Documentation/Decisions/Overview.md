---
title: "Architectural Decision Records (ADRs)"
description: "Master index and Mermaid supersession graph of all repository architectural decision records."
type: overview
tags:
  - decisions
  - adr
  - architecture
  - supersession-graph
---

# Architectural Decision Records (ADRs)

Architectural decisions govern non-trivial engineering commitments, trade-offs, and invariants. They are authored under `adr/` and synchronized into this vault.

## 🕸️ ADR Supersession Graph

```mermaid
flowchart TD
    ADR0001["ADR-0001<br/>Baseline Architecture Decision"] -.->|superseded by| ADR0002["ADR-0002<br/>Evolutionary Decision"]
    style ADR0001 stroke-dasharray: 5 5
    style ADR0002 stroke-dasharray: 5 5
```

## 📋 ADR Catalog

| ADR | Title | Status | Date | Core Commitment |
| :--- | :--- | :--- | :--- | :--- |
| *(No ADRs recorded yet)* | Initial architectural decisions will be cataloged here | Pending | - | Author with `architectural-decision-records` skill |

---
[[Home|← Back to Home]] | [[Overview/Overview|Architecture Overview →]]
