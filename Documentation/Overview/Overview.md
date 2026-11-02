---
title: "System Overview & Architecture Guide"
description: "Architectural landing page and orientation guide — core mental model, reading paths for engineers and product managers, subsystem decomposition, and foundational invariants."
type: overview
project: "ai-scaffolding"
tags:
  - overview
  - architecture
  - index
  - reading-guide
---

# System Overview & Architecture Guide: ai-scaffolding

> **Target Audience**: Software Engineers, System Architects, DevOps Leads, and Product Managers seeking an authoritative, unified mental model of **ai-scaffolding** (Software Application).

Welcome to the architectural nerve center of the knowledge vault. This section breaks down the system from high-level operational context (C1) down to container topologies (C2) and internal execution models (C3).

---

## 🗺️ Architectural Reading Paths

Choose the reading order tailored to your role:

```mermaid
flowchart TD
    Start(["👋 Joining the Project"])

    subgraph Roles ["Select Your Focus"]
        DevRole["Software Engineers & Contributors"]
        AiRole["AI Coding Assistants & Harness Authors"]
        ArchRole["System Architects & Tech Leads"]
        ProductRole["Product Managers & Domain Leads"]
    end

    subgraph Docs ["Recommended Reading Trajectory"]
        DocProduct["1. [[Overview/Product-Overview|Product-Overview]]<br/><i>Mission, problem/solution, personas, workflows</i>"]
        DocSystem["2. [[Overview/System-Architecture|System-Architecture]]<br/><i>Multi-harness projection, execution flow, subsystems</i>"]
        DocOnboarding["3. [[Guides/Developer-Onboarding|Developer-Onboarding]]<br/><i>Harness setup, workflow cycle, discipline</i>"]
        DocGovernance["4. [[Guides/OpenSpec-Governance|OpenSpec-Governance]]<br/><i>Domains, capabilities, living spec contracts</i>"]
        DocFeatures["5. [[Features/Overview|Features-Overview]]<br/><i>Product capability catalog & workflow notes</i>"]
        DocDecisions["6. [[Decisions/Overview|Decisions-Overview]]<br/><i>Architectural Decision Records (ADRs)</i>"]
    end

    Start --> DevRole
    Start --> AiRole
    Start --> ArchRole
    Start --> ProductRole

    DevRole --> DocProduct --> DocSystem --> DocOnboarding --> DocFeatures
    AiRole --> DocSystem --> DocGovernance --> DocFeatures
    ArchRole --> DocProduct --> DocSystem --> DocDecisions
    ProductRole --> DocProduct --> DocFeatures
```

---

## 📚 Overview Document Catalog

| Document | Architectural Level | Core Questions Answered | Primary Models & Diagrams |
| :--- | :--- | :--- | :--- |
| **[[Overview/Product-Overview|Product-Overview]]** | **C1 — System Context** | Why does the system exist? What operational problem does it solve? Who are the actors and what is the end-to-end lifecycle? | C1 System Context diagram, Operational Persona Workspaces, Lifecycle Timeline. |
| **[[Overview/System-Architecture|System-Architecture]]** | **C2 — Container Topology** | What physical containers run in production? How do hosts, services, and storage interact? What are the network ports and protocols? | Full C2 Container Topology diagram, Subsystem Component Index, System Communication Matrix. |

---

## 🏛️ Foundational Architectural Invariants

1. **Living Spec-Driven Development**: All non-trivial modifications, bug fixes, and feature additions originate as OpenSpec change proposals with verifiable behavior contracts before code is written.
2. **Deterministic Time Management**: Never invoke system clock methods directly in domain logic. Always inject a clock or time provider abstraction to guarantee determinism in automated test suites.
3. **Anti-Fabrication Mandate**: Never fabricate metrics, benchmark percentages, performance claims, or test counts without empirical measurement in source code or execution logs.
4. **Git Commit Approval Gate**: Code modifications and commits require explicit developer confirmation. Agents never commit without developer consent.
5. **Clean Architectural Boundaries**: Dependencies flow strictly inward from presentation and entry points to core domain logic and contracts.

---
[[Home|← Back to Home]] | [[Overview/Product-Overview|Product Overview →]]
