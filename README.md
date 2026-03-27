# claudive

Dive into your [Claude Code](https://claude.ai/claude-code) sessions.

Browse, search, preview, and resume your Claude Code sessions across **all projects** from a single terminal.

[English](README.md) | [한국어](README.ko.md)

![claudive demo](demo.gif)

## Features

- **All sessions, one view** — See every session across all projects
- **Full-text search** — Search through conversation content, not just titles
- **Conversation preview** — Read full conversations with word wrap and vim-style scrolling
- **Session resume** — Press Enter to resume any session in your terminal
- **Bookmarks** — Star important sessions for quick access
- **Project filtering** — Filter sessions by project
- **Session cleanup** — Delete old sessions you no longer need
- **Auto-detect terminal** — Works with tmux, iTerm2, Terminal.app, and any terminal

## Install

```bash
npx claudive
```

Or install globally:

```bash
npm install -g claudive
claudive
```

## Usage

### Sessions View

```
claudive — Dive into your Claude Code sessions  (42 sessions, 5 projects)

[Sessions]  [Projects]  [Bookmarks 3]

▶ my-app         Fix the login bug and add tests...           2m ago
★ api-server     Add rate limiting to /api/v2 endpoints...   3h ago
  docs           Update installation guide for v2...          1d ago
  my-app         Refactor auth middleware...                   2d ago
  infra          Set up CI/CD pipeline with GitHub Actions...  5d ago

42 sessions | 1/42
[Enter] Resume  [p] Preview  [b] Bookmark  [/] Search  [Tab] Next view  [?] Help  [q] Quit
```

### Preview Mode

```
Preview  my-app  a1b2c3d4...  12 messages

You:  Fix the login bug and add tests for the auth flow
──────────────────────────────────────────────────────
AI:   I'll start by looking at the auth module to understand
      the current flow, then write a failing test to
      reproduce the bug before fixing it.

You:  Good. Also check if the session token expiry is correct
──────────────────────────────────────────────────────
AI:   Found the issue - the token expiry was set to 24h
      but the refresh logic wasn't accounting for timezone...

100% [j/k] line [u/d] page [g/G] top/bottom [p/Esc] back
```

### Keybindings

| Key | Action |
|-----|--------|
| `j` / `k` / `↑` / `↓` | Navigate sessions |
| `Enter` | Resume selected session |
| `p` | Preview conversation |
| `b` | Toggle bookmark |
| `d` | Delete session (with confirmation) |
| `/` | Search (titles + conversation content) |
| `Tab` / `Shift+Tab` | Cycle views: Sessions → Projects → Bookmarks |
| `s` | Settings |
| `?` | Help |
| `q` / `Esc` | Quit (or clear filter) |

#### Preview Mode

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll line by line |
| `u` / `d` | Page up / down |
| `g` / `G` | Jump to top / bottom |
| `p` / `Esc` | Back to session list |

## Session Resume

Pressing `Enter` auto-detects your terminal environment:

| Environment | Behavior | Status |
|-------------|----------|--------|
| Any terminal (default) | Resumes in same terminal | Supported |
| Inside tmux | Opens new tmux window | Supported |
| macOS + iTerm2 | Opens new iTerm2 tab | Supported |
| macOS + Terminal.app | Opens new Terminal window | Supported |

Config is saved at `~/.config/claudash/config.json`:

```json
{
  "launchMode": "inline"
}
```

Options: `"inline"` (default), `"tmux"`, `"iterm2-tab"`, `"terminal-app"`, `"print"`

## How It Works

Reads session data from `~/.claude/projects/` — the same local data Claude Code uses. **Nothing is sent anywhere.**

- Session data: `~/.claude/projects/<project>/<session-id>.jsonl`
- Bookmarks: `~/.config/claudash/bookmarks.json`
- Config: `~/.config/claudash/config.json`

## Requirements

- Node.js >= 18
- [Claude Code](https://claude.ai/claude-code) installed

## License

MIT
