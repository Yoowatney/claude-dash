# claudive 🤿

> **claude + dive = claudive**

[Claude Code](https://claude.ai/claude-code) 세션 속으로 다이브.

모든 프로젝트의 Claude Code 세션을 하나의 터미널에서 검색, 미리보기, 재개할 수 있습니다.

[English](README.md) | [한국어](README.ko.md)

<img src="demo/demo.gif" alt="claudive demo" width="600">

## 기능

- **모든 세션을 한 화면에** — 프로젝트 구분 없이 전체 세션 조회
- **전체 대화 내용 검색** — 제목뿐 아니라 대화 내용까지 검색, 결과 탐색 + 미리보기
- **대화 미리보기** — vim 스타일 스크롤로 전체 대화 확인, Enter로 바로 재개
- **다이브 옵션** — Just dive, Yolo dive (권한 스킵), Fork & dive 선택 가능
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

## 키바인딩

| 키 | 동작 |
|----|------|
| `j` / `k` / `↑` / `↓` | 세션 탐색 |
| `Enter` | 다이브 옵션 메뉴 |
| `p` | 대화 미리보기 |
| `o` | 정렬: 최근순 ↔ 메시지순 |
| `b` | 북마크 토글 |
| `d` | 세션 삭제 (확인 후) |
| `/` | 검색 (제목 + 대화 내용) |
| `Tab` | 검색 중: 결과 탐색 / 목록: 다음 뷰 |
| `Shift+Tab` | 이전 뷰 |
| `Esc` | 필터 해제 / 뒤로 / 종료 |
| `s` | 설정 |
| `?` | 도움말 |

#### 미리보기

| 키 | 동작 |
|----|------|
| `j` / `k` | 한 줄씩 스크롤 |
| `u` / `d` | 페이지 위/아래 |
| `g` / `G` | 맨 위/아래로 이동 |
| `Enter` | 이 세션 재개 |
| `p` / `Esc` | 목록으로 돌아가기 |

## 세션 재개

`Enter`를 누르면 다이브 옵션을 선택합니다:

| 옵션 | 플래그 | 설명 |
|------|--------|------|
| Just dive | `--resume` | 일반 재개 |
| Yolo dive | `--dangerously-skip-permissions` | 권한 체크 스킵 |
| Fork & dive | `--fork-session` | 새 세션으로 분기하여 재개 |

터미널 환경을 자동 감지하며, `~/.config/claudive/config.json`에서 설정 변경 가능:

| 모드 | 동작 |
|------|------|
| `inline` | 같은 터미널에서 재개 (기본) |
| `tmux` | tmux 새 윈도우로 열기 |
| `iterm2-tab` | iTerm2 새 탭으로 열기 |
| `terminal-app` | Terminal.app 새 윈도우로 열기 |
| `print` | 재개 명령어만 출력 |

## 작동 방식

`~/.claude/projects/`의 로컬 세션 데이터를 읽습니다. **어디에도 데이터를 전송하지 않습니다.**

- 세션 데이터: `~/.claude/projects/<project>/<session-id>.jsonl`
- 북마크: `~/.config/claudive/bookmarks.json`
- 설정: `~/.config/claudive/config.json`

## 요구 사항

- Node.js >= 18
- [Claude Code](https://claude.ai/claude-code) 설치

## 라이선스

MIT
