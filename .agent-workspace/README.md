# Agent Workspace

This directory is an isolated **scratchpad and session state area for AI agents** operating in this repository.

---

## Directory Architecture

Agent workspaces are organized per agent persona to prevent cross-agent interference and maintain clean task boundaries:

```
.agent-workspace/
├── architect/
│   ├── active-task.md        # Per-agent resume token & active scratchpad (gitignored)
│   └── history/              # Completed task session archives (gitignored)
│       └── .keep             # Tracks directory in version control
├── ux-expert/
│   ├── active-task.md
│   └── history/
│       └── .keep
├── devops-expert/
│   ├── active-task.md
│   └── history/
│       └── .keep
└── docs-keeper/
    ├── active-task.md
    └── history/
        └── .keep
```

---

## Resume Protocol (`active-task.md`)

When an agent begins a task, it writes or updates `.agent-workspace/<agent-name>/active-task.md`. This token tracks in-flight progress, decisions, modified files, and precise next steps.

### Active Task Schema

```yaml
---
started: "2026-10-06T14:30:00Z"
status: in-progress        # idle | in-progress | paused | completed
agent: architect
task-id: module-boundaries-core
---
## Task
Clear summary of the user's prompt or architectural request.

## Progress
- [x] Analyzed existing dependency paths across apps/ and libs/
- [ ] Draft ADR for core library extraction
- [ ] Update domain catalog in openspec/domains.yaml

## Files Modified
- libs/core/package.json — defined public package entrypoints
- docs/adrs/0004-core-library-extraction.md — initial draft

## Key Decisions
- Document constraints, tradeoffs, or rationale established during this session.

## Resume Here
Exact next command or step to execute upon session resumption.
```

### Lifecycle & Startup Check

1. **Session Startup**:
   Whenever an agent persona is invoked, it checks `.agent-workspace/<agent-name>/active-task.md`:
   - If `status: in-progress` or `status: paused`: The agent detects interrupted work and prompts the developer:
     > *"I have an unfinished task: [task-id]. Would you like to resume or start fresh?"*
   - If `status: idle` or file is absent: Proceed directly with the requested task.
2. **Task Completion**:
   When a task is finalized:
   - Archive the session log to `.agent-workspace/<agent-name>/history/YYYY-MM-DD-<task-id>.md`.
   - Update `active-task.md` to set `status: idle` or reset the file.

---

## Version Control & Gitignore Policy

| Path                                        | Tracked? | Purpose                                                              |
| ------------------------------------------- | -------- | -------------------------------------------------------------------- |
| `.agent-workspace/README.md`                | ✅ Yes   | Workspace architecture and resume protocol documentation             |
| `.agent-workspace/*/.keep`                  | ✅ Yes   | Sentinel files ensuring directory structure persists in git checkouts |
| `.agent-workspace/*/active-task.md`         | ❌ No    | Ephemeral scratch state; gitignored to avoid commit noise and leaks   |
| `.agent-workspace/*/history/*`              | ❌ No    | Local developer task archives; gitignored to keep repository clean   |

---

## Workspace Hygiene

- **Do Not Pollute Application Code**: Never leave temporary agent notes, scratch files, or unreviewed drafts in source code directories (`apps/`, `libs/`, `docs/`).
- **Single Source of Truth**: Persistent system specifications belong in `openspec/`, architectural records in `docs/adrs/`, and ubiquitous language in `glossary/`. Scratchpads in `.agent-workspace/` are disposable.
