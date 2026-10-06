# Technical & Architectural Glossary

Canonical ubiquitous vocabulary for architectural patterns, system components, and engineering practices across the repository.

| Term | Definition | Use When | Avoid |
| :--- | :--------- | :------- | :---- |
| **Bounded Context** | An explicit boundary within which a specific domain model applies, providing clear meaning to ubiquitous language terms and preventing conceptual collision. | Documenting system architecture, service partitions, and domain boundaries. | Module boundary, Subsystem, Component boundary |
| **Living Specification** | A long-term behavioral specification kept synchronized with production code under `openspec/specs/<domain>/<capability>/spec.md`. | Referring to durable system specifications rather than transient change proposals. | Spec doc, Feature spec, PR description |
| **Delta Specification** | A change-scoped document within `openspec/changes/<change>/specs/` describing incremental requirements (`ADDED`, `MODIFIED`, `REMOVED`) to be merged at archive time. | Authoring or reviewing behavioral changes for an active OpenSpec change proposal. | Spec diff, Proposed spec, Draft spec |
| **Architecture Decision Record (ADR)** | An immutable document capturing an important architectural decision, including its context, alternatives considered, and consequences. | Recording durable, long-term technical commitments under `<repo>/adr/`. | Decision note, RFC, Design doc (for single decisions) |
| **Idempotency** | The property of an operation whereby performing it multiple times yields the same result and system state as performing it once. | Designing message consumers, distributed API mutations, and background tasks. | Re-runnability, Repeatability |
| **Outbox Pattern** | An architectural pattern where messages or domain events are written to an atomic database table within the local transaction before asynchronous dispatch. | Ensuring reliable message delivery across asynchronous messaging channels without dual-write hazards. | Dual write, Direct publish |
