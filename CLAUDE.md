# Claudive

Ink(React)-based TUI for browsing, searching, previewing, and resuming Claude Code sessions.
Published as npm package (`npx claudive`).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | TypeScript compile (`tsc`) |
| `npm run dev` | Watch mode (`tsc --watch`) |
| `node dist/index.js` | Run built app |
| `node dist/index.js --demo` | Run in demo mode |
| `npx tsc --noEmit` | Type check only (no build) |

## Conventions

- **Ink components**: React 19 + Ink 6 — `<Box>`, `<Text>`, `useInput()`, `useApp()`
- **Keybindings**: vim-style (j/k navigate, u/d page, g/G top/bottom)
- **State management**: React useState only (no external state libs)
- **Data source**: `~/.claude/projects/` JSONL files parsed directly
- **Config storage**: `~/.config/claudash/config.json`

## Task Tracking

Tasks are tracked in GitHub Issues: `gh issue list --repo Yoowatney/claudive`
Check the issue list before starting new work. Link related issues to PRs.

## Superpowers Process Gates

Claude MUST auto-size every task before starting work. Announce the size and required gates in the first response.

| Size | Criteria | Required Skills (cannot skip) |
|------|----------|-------------------------------|
| S | Bug fix, config change, 1-2 files | verification-before-completion |
| M | Feature modification, 3-5 files | brainstorming → verification-before-completion |
| L | New feature/module, 6+ files | brainstorming → writing-plans → requesting-code-review → verification-before-completion |

### Format

Start every task response with a one-line size declaration:

```
📐 M — brainstorming → verification-before-completion
```

### Prohibitions

1. Do NOT declare work as "done/complete/finished" without running `verification-before-completion`
2. Do NOT start implementing 6+ file changes without `writing-plans`
3. Do NOT create a PR without `requesting-code-review`
4. "Looks simple, skip the process" is NOT an acceptable reason to skip any required gate
5. Do NOT start work without announcing the task size first

## Parallel Agent Role Separation

| Phase | subagent_type | Can do | Cannot do |
|-------|--------------|--------|-----------|
| Investigate | `Explore` | Read, Grep, Glob | Edit, Write, Bash |
| Design | `Plan` | Read, Grep, Glob | Edit, Write, Bash |
| Implement | `general-purpose` | Everything | — |
| Review | `code-reviewer` | Read, Grep, Glob | Edit, Write, Bash |
