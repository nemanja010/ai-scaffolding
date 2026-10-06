---
name: architectural-decision-records
description: Use when documenting, drafting, reviewing, superseding, or updating architectural decisions, ADRs, decision logs, tradeoffs, rationale, consequences, alternatives, or architecture decision history, or when deciding whether a decision deserves an ADR.
---

# Architectural Decision Records

## Overview

An Architectural Decision Record captures one architecturally significant decision, its rationale, tradeoffs, and consequences. Optimize for future readers — humans and agents — reconstructing decision history. A recorded "why" stops the next engineer from "fixing" something that was deliberate, and stops agents from re-deciding settled questions.

## When to Use

Use when creating, updating, reviewing, or explaining an ADR, architecture decision, decision log, tradeoff analysis, rationale, consequences, alternatives, or status — including the `adr` step of an OpenSpec change.

Do not use ADRs for transient implementation details, meeting notes, or insignificant decisions.

## Does It Deserve an ADR?

Write one only when all three are true:

1. **Hard to reverse** — changing your mind later has meaningful cost.
2. **Surprising without context** — a future reader would wonder "why was it done this way?"
3. **A real trade-off** — genuine alternatives existed and one was chosen for specific reasons.

If any is missing, skip the ADR. If significance is unclear, ask what future maintainers will need to know.

Typical qualifying decisions:

- **Architectural shape** — monorepo, event-sourced write model, modular monolith vs. services.
- **Integration patterns between contexts** — events vs. synchronous calls, shared database vs. owned data.
- **Technology choices with lock-in** — database, message bus, auth provider, deployment target, framework. Not every library; only ones that would take serious effort to swap.
- **Data model and contract shape** — core schema, public API style (REST / GraphQL / RPC), versioning strategy.
- **Boundary and scope decisions** — which context owns which data; explicit "no"s are as valuable as "yes"es.
- **Deliberate deviations from the obvious path** — anything where a reasonable reader would assume the opposite.
- **Constraints invisible in the code** — compliance, partner contracts, latency budgets.
- **Non-obvious rejected alternatives** — record them, or someone will propose them again.

## Repository Conventions

- **Location**: `adr/` at the repository root, beside `openspec/` — never inside `openspec/`, `docs/adr/`, or `docs/decisions/`.
- **Filename**: `NNNN-kebab-title.md` (e.g. `0001-use-postgresql-for-persistence.md`). `NNNN` is a 4-digit sequence one greater than the highest existing number; the sequence is monotonic across the repo and never reused. Reference ADRs as `ADR-NNNN`.
- **Create lazily**: create `adr/` only when the first ADR is written.
- **Match what exists**: read the existing ADRs first and continue their numbering, filename pattern, and heading set. If existing ADRs conflict with each other or with these conventions, surface the conflict instead of introducing another scheme.

## Workflow

1. Identify the single decision. Split multiple decisions into multiple ADRs.
2. Apply the significance test above. If it fails, do not write an ADR.
3. Read every existing ADR in `adr/`. Build the supersession graph from `Supersedes` fields, note what is currently in force, and note the highest sequence number.
4. Check `preferences.md` for `preferred-style`. If `unset`, ask the user which style to use, then record it in `preferences.md` before drafting.
5. Use the matching file under `templates/`, plus the required metadata below.
6. Capture known facts only: context, requirements, constraints, options, rationale, decision makers, consequences.
7. If facts are missing, mark them as `Unknown` or ask a focused question; do not invent context, options, or quality attributes.
8. Write honest consequences: benefits, downsides, follow-up.
9. Preserve history: to change a decision, write a new superseding ADR (see Immutability).
10. Where code embodies a surprising decision, a short pointer comment (`// See ADR-0003`) is appropriate; do not restate the ADR in code.

## Required Metadata (All Styles)

Every ADR carries these fields regardless of template, either as frontmatter or as a list directly under the title:

```markdown
- Status: accepted
- Date: YYYY-MM-DD
- Supersedes: ADR-NNNN   <!-- only when replacing a prior ADR -->
```

Use the injected/current date from the session context; never guess a date.

## Immutability

ADRs are immutable once accepted. Never edit a prior accepted ADR — not its status, body, or date.

- To change a decision, create a new ADR with `Status: accepted, supersedes ADR-NNNN` and a `Supersedes: ADR-NNNN` field, and explain in Context why the prior decision is being revisited.
- What is currently in force is derived by walking `Supersedes` links, not by editing old files.
- Only a `proposed` ADR that has not been accepted may be edited in place.

## Template Choice

| Situation                | Template                                     |
| ------------------------ | -------------------------------------------- |
| Detailed tradeoff record | `templates/madr-full.md`                     |
| Concise tradeoff record  | `templates/madr-minimal.md`                  |
| Classic lightweight ADR  | `templates/nygard.md`                        |
| One-sentence summary     | `templates/y-statement.md`                   |
| Project-specific style   | `templates/custom.md`                        |
| Too little evidence      | ADR review notes/questions, not accepted ADR |

Length follows substance: a short ADR that records *that* a decision was made and *why* beats a long one padded to fill sections.

## Status Values

| Status                        | Use when                                               |
| ----------------------------- | ------------------------------------------------------ |
| Proposed                      | Under review; may still be edited                      |
| Accepted                      | Team committed; file is now frozen                     |
| Rejected                      | Considered and declined; kept so it is not re-proposed |
| Accepted, supersedes ADR-NNNN | Replaces a prior ADR; that ADR is no longer in force   |
| Deprecated                    | Historically relevant but no longer recommended        |

A superseded ADR's own file keeps its original status; its superseded state is visible through the newer ADR's `Supersedes` link.

## Inside an OpenSpec Change

When invoked for the `adr` artifact of an OpenSpec change, this skill governs the content of each repository-level ADR. The schema additionally requires:

- A change-local manifest at `openspec/changes/<change>/adr.md` (from the schema template) listing the in-force ADRs reviewed and every ADR created for the change, without duplicating their Context, Decision, or Consequences.
- Candidate decisions come from re-reading `design.md`: long-term commitments that affect future changes and are not already captured by an in-force ADR (or intentionally diverge from one).
- If nothing meets the bar, create no ADR and state that explicitly in the manifest.

## Preference Prompt

If no preference is recorded, ask:

> Which ADR style should I use and remember for this project: MADR full, MADR minimal, Nygard, Y-Statement, or custom?

After the user answers, update `preferences.md` with the selected `preferred-style`. Do not ask again unless the user asks to change style.

## Review Checklist

- One decision, not a bundle
- Passes the significance test: hard to reverse, surprising without context, real trade-off
- Context explains why it existed
- Rejected options/tradeoffs are explicit
- Rationale is tied to requirements, not preference
- Downsides and follow-up work are recorded
- Status, Date, and (if applicable) Supersedes are present
- No prior accepted ADR was edited
- Filename and number follow the repository convention
- Unknowns are marked, not invented

## Example

`adr/0012-use-postgresql-for-orders.md`:

```markdown
# Use PostgreSQL for Orders

- Status: accepted
- Date: 2026-01-15

## Context and Problem Statement

Orders need relational constraints, consistency, and reporting joins. The team operates PostgreSQL well.

## Considered Options

- PostgreSQL: integrity, SQL reporting, familiar operations; migrations required.
- MongoDB: flexible schema; weaker fit for consistency and joins.

## Decision Outcome

Chosen option: "PostgreSQL", because consistency, joins, and operational familiarity matter more than schema flexibility.

### Consequences

- Good, because integrity and reporting align with needs.
- Bad, because schema changes need migrations.
- Follow-up: define migration practice.
```

## Common Rationalizations

| Rationalization                       | Reality                                                                                       |
| ------------------------------------- | --------------------------------------------------------------------------------------------- |
| "ADRs are overhead"                   | A short ADR prevents re-litigating the same decision months later.                            |
| "The code is self-documenting"        | Code shows what. It does not show why, which alternatives were rejected, or what constraints apply. |
| "I'll just update the old ADR"        | Accepted ADRs are frozen. Write a superseding ADR so the history stays honest.                |
| "Every choice deserves an ADR"        | Easy-to-reverse or obvious choices dilute the log. Apply the significance test.               |

## Common Mistakes

| Mistake                              | Fix                                                     |
| ------------------------------------ | ------------------------------------------------------- |
| Several decisions in one ADR         | Split them.                                             |
| Sales pitch                          | Include rejected options and negative consequences.     |
| Invented context                     | Mark unknowns or ask.                                   |
| Treating status as decoration        | Use status to show lifecycle; link via `Supersedes`.    |
| Rewriting history                    | Keep old ADR untouched; create a superseding ADR.       |
| Omitting alternatives under pressure | Include at least the rejected option and why it lost.   |
| Restarting or reusing numbers        | Continue the highest existing `NNNN`.                   |

## Sources

adr.github.io: home, ADR templates, AD practices. See `templates/` for captured template variants. Significance test and qualifying-decision list adapted from `mattpocock/skills` (domain-modeling); convention-matching and rationalizations adapted from `addyosmani/agent-skills` (documentation-and-adrs).
