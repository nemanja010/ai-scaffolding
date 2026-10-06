# Intent-Driven OpenSpec Schema

`intent-driven` is a comprehensive change workflow designed for engineering teams where contributor intent, observable behavior, technical architecture, and durable architectural decisions must be established before implementation begins.

It maintains full compatibility with the OpenSpec CLI by generating mergeable delta specifications under `specs/<domain>/<capability>/spec.md`. The Markdown headers provide the OpenSpec structure, while the requirements and scenarios are authored in Gherkin BDD format (`GIVEN`, `WHEN`, `THEN`).

- **Best fit**: Non-trivial features, system enhancements, cross-cutting architectural changes, data model modifications, and security-critical refactors.
- **Not intended for**: Minor cosmetic fixes, standalone documentation updates, or simple dependency bumps.

---

## Activating the Schema

Configure `intent-driven` in `openspec/config.yaml`:

```yaml
schema: intent-driven
```

---

## Workflow Stages & Dependency Graph

The change lifecycle progresses through five distinct artifacts:

```text
proposal ──► specs ──┐
   │                  ├──► tasks ──► apply
   └──► design ──► adr ─┘
```

1. **`proposal` (`proposal.md`)**: Defines the problem motivation (*Why*), bulleted changes (*What Changes*), impacted architectural capabilities mapped to `openspec/domains.yaml` (*Capabilities*), and systemic dependencies (*Impact*).
2. **`specs` (`specs/<domain>/<capability>/spec.md`)**: Creates one OpenSpec delta specification per impacted capability using Gherkin behavior scenarios.
3. **`design` (`design.md`)**: Elaborates technical implementation choices, C4 architecture diagrams, trade-offs, and migration strategies.
4. **`adr` (`adr.md`)**: Change-local manifest recording the architecture decision review. When a major durable decision is introduced, a new immutable record is created under `<repo>/adr/`.
5. **`tasks` (`tasks.md`)**: Dependency-ordered implementation checklist with trackable `- [ ]` markdown checkboxes.
6. **`apply`**: Implementation phase where automated subagents work through tasks using Test-Driven Development (TDD) and verification gates.

---

## Specification Format

Specifications use standard OpenSpec delta headers to ensure clean merging when running `openspec archive`:

```markdown
## ADDED Requirements

### Requirement: Dynamic Profile Resolution

Feature: Environment Profiles
Rule: Active profile overrides baseline configuration settings

#### Scenario: Staging profile overrides default host
- **GIVEN** an active environment profile configured as "staging"
- **WHEN** the application configuration provider initializes
- **THEN** endpoint host is resolved from the staging configuration profile
```

### Delta Operation Types
- `## ADDED Requirements`: New capabilities or rules being introduced.
- `## MODIFIED Requirements`: Changed behavior. **Must include the entire updated requirement block** (not a partial diff) to ensure archive preserves the complete state.
- `## REMOVED Requirements`: Deprecated behavior. Must state **Reason** and **Migration**.
- `## RENAMED Requirements`: Name updates using `FROM: <old name>` and `TO: <new name>`.

---

## Architectural Decision Records (ADRs)

The `adr` artifact enforces architectural hygiene:
- The completion signal for the change is the manifest at `openspec/changes/<change>/adr.md`.
- Durable, repository-level decisions persist outside OpenSpec in `<repo>/adr/NNNN-kebab-title.md`.
- **Immutability rule**: Accepted ADRs are never edited in place. To change a past decision, record a new ADR whose status indicates it supersedes the previous record.

---

## Schema Validation

Validate the schema locally with the OpenSpec CLI:

```bash
openspec schema validate intent-driven
```

For alternative workflows and community schemas, see:
- [Community Schemas Catalog](https://github.com/Fission-AI/OpenSpec/blob/main/docs/customization.md#community-schemas)
- [Editing Your Schema Fork](https://openspec.dev/docs/customize-schemas#editing-your-fork)
- [OpenSpec Schemas Architecture Guide](../../SCHEMAS.md)
- [Intent-Driven Dev Schemas Hub](https://github.com/intent-driven-dev/openspec-schemas)
