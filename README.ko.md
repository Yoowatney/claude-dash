# claudive 🤿

> **claude + dive = claudive**

[Claude Code](https://claude.ai/claude-code) 세션 속으로 다이브.

모든 프로젝트의 Claude Code 세션을 하나의 터미널에서 검색, 미리보기, 재개할 수 있습니다.

[English](README.md) | [한국어](README.ko.md)

![claudive demo](demo.gif)

## 기능

- **모든 세션을 한 화면에** — 프로젝트 구분 없이 전체 세션 조회
- **전체 대화 내용 검색** — 제목뿐 아니라 대화 내용까지 검색
- **대화 미리보기** — vim 스타일 스크롤로 전체 대화 확인, Enter로 바로 재개
- **세션 재개** — Enter 한 번으로 바로 세션 이어서 작업 (스피너로 상태 표시)
- **북마크** — 중요한 세션에 별표 표시
- **정렬** — 최근순 또는 메시지 많은 순으로 정렬
- **프로젝트 필터링** — 특정 프로젝트 세션만 필터링
- **세션 정리** — 불필요한 세션 삭제
- **터미널 자동 감지** — tmux, iTerm2, Terminal.app 등 지원

## 설치

```bash
npx claudive
```

또는 글로벌 설치:

```bash
npm install -g claudive
claudive
```

## 사용법

### 세션 목록

```
claudive — Dive into your Claude Code sessions  (42 sessions, 5 projects)

[Sessions]  [Projects]  [Bookmarks 3]

▶ my-app         로그인 버그 수정하고 테스트 추가해줘...        2m ago
★ api-server     /api/v2 엔드포인트에 rate limiting 추가...   3h ago
  docs           v2 설치 가이드 업데이트...                     1d ago
  my-app         auth 미들웨어 리팩토링...                      2d ago
  infra          GitHub Actions으로 CI/CD 파이프라인 구축...    5d ago

42 sessions | 1/42 | ↓recent
[Enter] Resume  [p] Preview  [o] Sort  [/] Search  [Tab] Next view  [?] Help  [q] Quit
```

### 미리보기 모드

```
Preview  my-app  a1b2c3d4...  12 messages

You:  로그인 버그 수정하고 auth 플로우 테스트 추가해줘
──────────────────────────────────────────────────────
AI:   auth 모듈을 먼저 살펴보고 현재 플로우를 이해한 다음,
      버그를 재현하는 실패 테스트를 작성하고 수정하겠습니다.

You:  좋아. 세션 토큰 만료 시간도 확인해봐
──────────────────────────────────────────────────────
AI:   문제를 찾았습니다. 토큰 만료가 24시간으로 설정되어
      있는데 갱신 로직에서 타임존을 고려하지 않고 있었습니다...

100% [j/k] line [u/d] page [g/G] top/bottom [Enter] resume [p/Esc] back
```

### 키바인딩

| 키 | 동작 |
|----|------|
| `j` / `k` / `↑` / `↓` | 세션 탐색 |
| `Enter` | 선택한 세션 재개 |
| `p` | 대화 미리보기 |
| `o` | 정렬: 최근순 ↔ 메시지순 |
| `b` | 북마크 토글 |
| `d` | 세션 삭제 (확인 후) |
| `/` | 검색 (제목 + 대화 내용) |
| `Tab` / `Shift+Tab` | 뷰 전환: Sessions → Projects → Bookmarks |
| `s` | 설정 |
| `?` | 도움말 |
| `q` / `Esc` | 종료 (또는 필터 해제) |

#### 미리보기 모드

| 키 | 동작 |
|----|------|
| `j` / `k` | 한 줄씩 스크롤 |
| `u` / `d` | 페이지 위/아래 |
| `g` / `G` | 맨 위/아래로 이동 |
| `Enter` | 이 세션 재개 |
| `p` / `Esc` | 목록으로 돌아가기 |

## 세션 재개

`Enter`를 누르면 터미널 환경을 자동 감지합니다:

| 환경 | 동작 | 상태 |
|------|------|------|
| 모든 터미널 (기본) | 같은 터미널에서 재개 | 지원 |
| tmux 안 | tmux 새 윈도우로 열기 | 지원 |
| macOS + iTerm2 | iTerm2 새 탭으로 열기 | 지원 |
| macOS + Terminal.app | Terminal 새 윈도우로 열기 | 지원 |

설정(`s` 키) 또는 `~/.config/claudash/config.json`에서 launch mode를 변경할 수 있습니다:

```json
{
  "launchMode": "inline"
}
```

| 모드 | 동작 |
|------|------|
| `inline` | 같은 터미널에서 재개 (기본) |
| `tmux` | tmux 새 윈도우로 열기 |
| `iterm2-tab` | iTerm2 새 탭으로 열기 |
| `terminal-app` | Terminal.app 새 윈도우로 열기 |
| `print` | 재개 명령어만 출력 |

옵션: `"inline"` (기본), `"tmux"`, `"iterm2-tab"`, `"terminal-app"`, `"print"`

## 작동 방식

`~/.claude/projects/`의 로컬 세션 데이터를 읽습니다. **어디에도 데이터를 전송하지 않습니다.**

- 세션 데이터: `~/.claude/projects/<project>/<session-id>.jsonl`
- 북마크: `~/.config/claudash/bookmarks.json`
- 설정: `~/.config/claudash/config.json`

## 요구 사항

- Node.js >= 18
- [Claude Code](https://claude.ai/claude-code) 설치

## 라이선스

MIT
