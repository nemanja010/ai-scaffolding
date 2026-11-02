---
title: "System Architecture"
type: architecture
project: "ai-scaffolding"
last_synced: "2026-11-02T22:51:46.030Z"
tags:
  - architecture
  - system-design
---

# System Architecture: ai-scaffolding

## 🏛️ The "HOW": Architectural Philosophy & Design
The codebase operates under a **Multi-Harness AI Engineering Monorepo** architectural model. It decouples system specifications from implementation code, using a hub-and-spoke configuration model:
- **Canonical Instruction Anchor**: `AGENTS.md` defines universal discipline, testing invariants, and anti-fabrication rules.
- **Harness Projection**: Domain rules, skills, and prompts project outwards into AI harness directories (`.github/`, `.opencode/`, `.claude/`, `.gemini/`).
- **Living Specification Engine**: System requirements reside as living behavior contracts in `openspec/specs/`, modified only through formal change proposals.
- **Dynamic Documentation Vault**: Product documentation compiles automatically from codebase state, living specs, and ADRs into `Documentation/`.

---

## 🗺️ Component Architecture & System Context

```mermaid
flowchart TD
    subgraph UsersAndHarnesses [Developers & AI Coding Assistants]
        Dev([Developer])
        Copilot["GitHub Copilot (.github/)"]
        OpenCode["OpenCode (.opencode/)"]
        Claude["Claude Code (.claude/)"]
        Antigravity["Antigravity CLI & IDE (.gemini/)"]
    end

    subgraph CoreEngine [Governance & Living Knowledge]
        AgentsAnchor["AGENTS.md\n(Canonical Rules & Discipline)"]
        OpenSpec["OpenSpec Engine\n(specs/, changes/, domains.yaml)"]
        ADR["Architecture Decisions\n(adr/)"]
    end

    subgraph CodebaseContext [Codebase & Intelligence Hub]
        Apps["apps/ (Applications & Services)"]
        Libs["libs/ (Shared Domain Modules)"]
        MCPHub["MCP Hub (Dockerized Language Servers & Graphs)"]
        Repomix["AST Symbol Snapshot (.agent-workspace/)"]
    end

    subgraph KnowledgeVault [Obsidian Documentation Vault]
        VaultMOC["Documentation/Home.md (MOC)"]
        Overview["Overview/ (Product & Architecture)"]
        Features["Features/ (Living Spec Notes)"]
        Guides["Guides/ (Governance & Schemas)"]
    end

    Dev --> Copilot & OpenCode & Claude & Antigravity
    Copilot & OpenCode & Claude & Antigravity --> AgentsAnchor
    AgentsAnchor --> OpenSpec
    OpenSpec --> Apps & Libs
    Repomix --> OpenSpec
    OpenSpec & ADR & Repomix --> KnowledgeVault
```

---

## 🔁 End-to-End Execution Flow (Data & Control Lifecycle)

```mermaid
sequenceDiagram
    autonumber
    actor Dev as Developer
    participant Harness as AI Harness (Copilot / Claude / OpenCode / AGY)
    participant OpenSpec as OpenSpec Engine
    participant Code as Source Code (apps / libs / src)
    participant Sync as Docs Sync (AST Engine)
    participant Vault as Obsidian Vault (Documentation/)

    Dev->>Harness: 1. Request feature or behavioral change
    Harness->>OpenSpec: 2. Scaffold proposal (/opsx-propose)
    Harness->>Code: 3. Implement tasks & tests (/opsx-apply)
    Harness->>OpenSpec: 4. Verify contracts (/opsx-verify)
    Dev->>Harness: 5. Approve git commit (Commit Gate)
    Harness->>OpenSpec: 6. Archive change (/opsx-archive)
    Harness->>Sync: 7. Run sync (/opsx-sync-docs)
    Sync->>Sync: 8. Grasp codebase snapshot & AST symbols
    Sync->>Vault: 9. Refresh Product Overview, Specs & Changelog
    Vault-->>Dev: 10. Up-to-date human-readable knowledge graph
```

---

## 🧩 Subsystem & Directory Responsibilities

### 1. Applications & Host Services (`apps/`)
- **Role**: Deployment-level binaries, services, and web clients.
- **Responsibilities**: Entry-point bootstrapping, framework wiring, HTTP routing, and environment runtime initialization.
- **Boundaries**: Business logic belongs in `libs/`; `apps/` only orchestrates presentation and hosting.

### 2. Shared Libraries & Domain Modules (`libs/`)
- **Role**: Reusable, pure domain logic, data-access repositories, and UI components.
- **Responsibilities**: Enforcing domain invariants, entity validation, and data persistence contracts.
- **Boundaries**: Independent of application shells; testable in complete isolation.

### 3. Living Specifications (`openspec/specs/`)
- **Role**: The single source of truth for all system behavioral contracts.
- **Responsibilities**: Documents requirements and Gherkin scenarios grouped by architectural domain and capability.

### 4. Product Documentation Vault (`Documentation/`)
- **Role**: Local, Obsidian-compatible markdown documentation for humans and agents.
- **Structure**:
  - `Documentation/Home.md`: Master Map of Content (MOC).
  - `Documentation/Overview/`: High-level product vision and system architecture.
  - `Documentation/Features/`: Behavioral contracts compiled from living specs.
  - `Documentation/Guides/`: Developer onboarding, OpenSpec Governance, and Schema reference.
  - `Documentation/Reference/`: Configuration reference and Domain Catalog.
  - `Documentation/Decisions/`: Synced Architecture Decision Records (ADRs).
  - `Documentation/Changelog/`: Historical changes compiled from archived proposals.

---

## ⚖️ The "WHY": Design Rationale & Trade-offs

### Architectural Invariants
1. **Spec-First Intent**: Code is an ephemeral manifestation of living specifications. Changing system behavior requires updating living specs.
2. **Anti-Fabrication Mandate**: Agents never invent benchmark numbers, performance statistics, or test counts. Empirical evidence is mandatory.
3. **Strict Commit Approval Gate**: Agents never execute git commits or pushes without explicit confirmation from the human developer.
4. **Clock Injection**: Time-dependent domain services always inject clock abstractions (`Clock`, `TimeProvider`) to guarantee test determinism.

### Architectural Trade-offs
| Decision | Chosen Approach | Alternative Considered | Rationale / Why |
| :--- | :--- | :--- | :--- |
| **Documentation Format** | Obsidian-compatible local Markdown | Cloud SaaS (Confluence, Notion) | Zero external dependencies, offline-first, git-tracked, versioned alongside code. |
| **Codebase Grasping** | Tree-sitter AST compression + Native AST fallback | Full-repo re-indexing on each turn | Extracts AST symbol signatures in <2s and hashing avoids redundant re-processing. |
| **Specification Syntax** | OpenSpec Gherkin callouts in Markdown | Cucumber feature files only | Human-readable markdown with clear scenario blocks is natively parsed by LLMs and Obsidian. |
| **Harness Architecture** | Centralized canonical rules (`AGENTS.md`) | Separate rules per harness | Single source of truth eliminates rule drift across Copilot, Claude, OpenCode, and Antigravity. |

---

## 📐 Alignment with OpenSpec Domains
System architecture aligns with the architectural domains declared in `openspec/domains.yaml`:

- **[[Reference/Domain-Catalog#Core Platform|Core Platform]]**: Foundational infrastructure, storage abstractions, configuration, and security services
- **[[Reference/Domain-Catalog#Api Services|API & Backend Services]]**: RESTful endpoints, external API gateways, and asynchronous event messaging pipelines
- **[[Reference/Domain-Catalog#Web Client|Web Client Applications]]**: Frontend single-page applications, UI component libraries, and client-side state

---
[[Home|← Back to Home]] | [[Overview/Product-Overview|← Product Overview]]
