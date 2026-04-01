# claudive 🤿

> **claude + dive = claudive**

Dive into your [Claude Code](https://claude.ai/claude-code) sessions.

Browse, search, preview, and resume your Claude Code sessions across **all projects** from a single terminal.

[English](README.md) | [한국어](README.ko.md)

<img src="demo/demo.gif" alt="claudive demo" width="600">

## Features

- **All sessions, one view** — See every session across all projects
- **Full-text search** — Search through conversation content, then browse results with preview
- **Conversation preview** — Read full conversations with vim-style scrolling, resume directly with Enter
- **Dive options** — Resume with different modes: Just dive, Yolo dive (skip permissions), Fork & dive
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

## Keybindings

| Key | Action |
|-----|--------|
| `j` / `k` / `↑` / `↓` | Navigate sessions |
| `Enter` | Dive options menu |
| `p` | Preview conversation |
| `o` | Sort: recent ↔ messages |
| `b` | Toggle bookmark |
| `d` | Delete session (with confirmation) |
| `/` | Search (titles + conversation content) |
| `Tab` | In search: browse results / In list: next view |
| `Shift+Tab` | Previous view |
| `Esc` | Clear filter / back / quit |
| `s` | Settings |
| `?` | Help |

#### Preview

| Key | Action |
|-----|--------|
| `j` / `k` | Scroll line by line |
| `u` / `d` | Page up / down |
| `g` / `G` | Jump to top / bottom |
| `Enter` | Resume this session |
| `p` / `Esc` | Back to session list |

## Session Resume

Pressing `Enter` shows dive options:

| Option | Flag | Description |
|--------|------|-------------|
| Just dive | `--resume` | Resume normally |
| Yolo dive | `--dangerously-skip-permissions` | Skip all permission checks |
| Fork & dive | `--fork-session` | Resume as a new forked session |

Launch mode auto-detects your terminal, or configure in `~/.config/claudive/config.json`:

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
- Bookmarks: `~/.config/claudive/bookmarks.json`
- Config: `~/.config/claudive/config.json`

## Requirements

- Node.js >= 18
- [Claude Code](https://claude.ai/claude-code) installed

## License

MIT
