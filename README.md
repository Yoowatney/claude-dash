# claudive

Dive into your [Claude Code](https://claude.ai/claude-code) sessions.

Browse, search, preview, and resume your Claude Code sessions across **all projects** from a single terminal.

[English](README.md) | [한국어](README.ko.md)

![claudive demo](demo.gif)

## Features

- **All sessions, one view** — See every session across all projects
- **Full-text search** — Search through conversation content, not just titles
- **Conversation preview** — Read full conversations with vim-style scrolling, resume directly with Enter
- **Session resume** — Press Enter to resume any session, with visual spinner feedback
- **Bookmarks** — Star important sessions for quick access
- **Sort** — Sort by recent activity or message count
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

42 sessions | 1/42 | ↓recent
[Enter] Resume  [p] Preview  [o] Sort  [/] Search  [Tab] Next view  [?] Help  [q] Quit
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

100% [j/k] line [u/d] page [g/G] top/bottom [Enter] resume [p/Esc] back
```

### Keybindings

| Key | Action |
|-----|--------|
| `j` / `k` / `↑` / `↓` | Navigate sessions |
| `Enter` | Resume selected session |
| `p` | Preview conversation |
| `o` | Sort: recent ↔ messages |
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
| `Enter` | Resume this session |
| `p` / `Esc` | Back to session list |

## Session Resume

Pressing `Enter` auto-detects your terminal environment:

| Environment | Behavior | Status |
|-------------|----------|--------|
| Any terminal (default) | Resumes in same terminal | Supported |
| Inside tmux | Opens new tmux window | Supported |
| macOS + iTerm2 | Opens new iTerm2 tab | Supported |
| macOS + Terminal.app | Opens new Terminal window | Supported |

You can change the launch mode in Settings (`s` key) or by editing `~/.config/claudash/config.json`:

```json
{
  "launchMode": "inline"
}
```

| Mode | Behavior |
|------|----------|
| `inline` | Resume in same terminal (default) |
| `tmux` | Open new tmux window |
| `iterm2-tab` | Open new iTerm2 tab |
| `terminal-app` | Open new Terminal.app window |
| `print` | Print the resume command only |

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
