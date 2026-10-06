# Ubiquitous Language Glossaries

This directory maintains the canonical Ubiquitous Language glossaries for the repository, implementing Domain-Driven Design (DDD) principles to ensure conceptual consistency across business discussions, living specifications, code, and architectural decisions.

---

## 1. Structure

The vocabulary is organized into two distinct catalogs:

- **`business.md`**: Business and domain terminology. Captures core domain concepts, entities, user roles, operational workflows, and business invariants understood by stakeholders and developers alike.
- **`technical.md`**: Architectural, design, and engineering terminology. Captures technical patterns, infrastructure concepts, data structures, and systemic contracts used across code and technical designs.

---

## 2. Table Format

Both glossaries follow a strict four-column tabular structure:

```markdown
| Term | Definition | Use When | Avoid |
| :--- | :--------- | :------- | :---- |
| **Active Term** | Concise, unambiguous definition of the concept. | Appropriate context and usage scenarios. | Deprecated synonyms, confusing aliases, or colloquialisms. |
```

- **Term**: The exact, standardized name for the concept (bolded).
- **Definition**: Clear, authoritative description of what the concept represents.
- **Use When**: Contexts, requirements, or documentation where this term must be used.
- **Avoid**: Discouraged synonyms, legacy terms, or colloquial phrases that lead to semantic drift.

---

## 3. Maintenance & AI Agent Guidelines

### Capturing Terms Early
- During the change proposal and technical design phases, developers and AI agents use the `grill-with-docs` skill (or `grilling`) to explore user intent, clarify requirements, and stress-test assumptions.
- When new domain concepts or architectural patterns emerge during these sessions, immediately record them in `business.md` or `technical.md`.

### Single Source of Truth
- AI coding agents and human engineers must consult `glossary/business.md` and `glossary/technical.md` before naming classes, interfaces, database entities, REST endpoints, and specification requirements.
- Never use terms listed in the **Avoid** column in code, comments, or specifications.
