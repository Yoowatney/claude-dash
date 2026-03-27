# claudive — Architecture & Planning

> Dive into your Claude Code sessions.

## 프로젝트 개요

Claude Code 세션을 터미널에서 검색, 미리보기, 재개할 수 있는 TUI 도구.

- **npm**: `claudive`
- **GitHub**: https://github.com/Yoowatney/claudive
- **스택**: TypeScript + Ink (React for CLI)
- **라이선스**: MIT

## 핵심 가치

**세션 찾기 → 내용 확인 → 바로 재개**

Readout 같은 웹 대시보드와 차별점:
- TUI (터미널 안에서 동작)
- 세션 재개 (Enter 한 번)
- 전체 대화 내용 검색
- 어디서든 모든 프로젝트 세션 조회

## 현재 기능 (v0.1.0)

### 핵심 기능
- [x] 모든 프로젝트의 세션 목록 조회
- [x] 전체 대화 내용 검색 (제목 + 본문, 300ms 디바운스)
- [x] 대화 미리보기 (word wrap, vim 스타일 스크롤)
- [x] 세션 재개 (inline, tmux, iTerm2, Terminal.app)
- [x] 세션 북마크 (별표, Bookmarks 탭)
- [x] 프로젝트별 필터링
- [x] 세션 삭제 (확인 후)
- [x] Settings 화면 (launch mode 변경)
- [x] Help 화면 (`?` 키)
- [x] 키바인딩 중앙 관리 (`lib/keybindings.ts`)
- [x] 에러 핸들러 (GitHub Issues 링크)
- [x] 업데이트 알림 (update-notifier)

### 뷰 구조
- **Sessions** — 전체 세션 목록 (기본)
- **Projects** — 프로젝트별 그룹, Enter로 필터링
- **Bookmarks** — 북마크된 세션만
- **Preview** — 대화 내용 전체보기
- **Settings** — launch mode 설정
- **Help** — 키바인딩 목록

### 키바인딩
`src/lib/keybindings.ts`에서 중앙 관리.
새 기능 추가 시 여기에 한 줄 추가하면 footer + help에 자동 반영.

## 파일 구조

```
src/
├── index.tsx              # 진입점, 업데이트 체크, 에러 핸들러
├── app.tsx                # 메인 App 컴포넌트 (상태 관리)
├── types.d.ts             # update-notifier 타입
├── components/
│   ├── SessionList.tsx    # 세션 목록 (커서는 부모 관리)
│   ├── ProjectList.tsx    # 프로젝트 목록 + 필터링
│   ├── Preview.tsx        # 대화 미리보기 (word wrap)
│   ├── Settings.tsx       # launch mode 설정
│   ├── Help.tsx           # 키바인딩 도움말
│   └── ErrorBoundary.tsx  # React 에러 바운더리
└── lib/
    ├── scanner.ts         # ~/.claude/ 스캐너, JSONL 파서
    ├── launcher.ts        # 세션 재개 (inline/tmux/iTerm2/Terminal.app)
    ├── bookmarks.ts       # 북마크 관리 (~/.config/claudash/)
    └── keybindings.ts     # 키바인딩 중앙 레지스트리
```

## 데이터 경로

| 데이터 | 경로 | 형식 |
|--------|------|------|
| 세션 데이터 (Claude Code) | `~/.claude/projects/<project>/<session-id>.jsonl` | JSONL |
| 세션 환경 | `~/.claude/session-env/<session-id>/` | sh 파일 |
| 북마크 | `~/.config/claudash/bookmarks.json` | JSON |
| 설정 | `~/.config/claudash/config.json` | JSON |

### JSONL 메시지 구조
```json
{
  "type": "user",
  "message": { "role": "user", "content": "텍스트" },
  "timestamp": "2026-03-24T14:36:09.782Z",
  "sessionId": "uuid",
  "cwd": "/Users/..."
}
```
- `type`: `user`, `assistant`, `progress`, `system`, `file-history-snapshot` 등
- 세션 스캐너에서는 `user`와 `assistant`만 파싱

## 배포

### npm
- 패키지명: `claudive`
- 이전 패키지: `@yoyoyoyoo/claude-dash` (deprecated → claudive로 이동)
- 배포: `npm version patch --no-git-tag-version && npm publish`

### 버전 관리
- `update-notifier`로 유저에게 새 버전 알림
- `index.tsx`에서 `package.json` 버전을 읽어 헤더에 표시
- fetchInfo()를 await해서 첫 실행에서도 체크됨

### launch mode 자동 감지
`launcher.ts`의 `detectMode()`:
- 기본값: `inline` (같은 터미널에서 실행)
- 설정 파일에 저장 후 재사용

## TODO (GitHub Issues)

### 기능
- [ ] Skills/Hooks 뷰어 (#2)
- [ ] 세션 통계 (#3)
- [ ] 자동 배포 GitHub Actions (#5)

### 플랫폼
- [ ] Windows (WSL/native) 지원 (#4)
  - `mkdir -p` → `fs.mkdirSync({ recursive: true })`
  - 경로 구분자 처리
  - Windows Terminal launch mode

### 배포 확장
- [ ] standalone 바이너리 (bun build --compile)
  - Node.js 없이 실행 가능
  - GitHub Releases에 macOS/Linux 바이너리
  - 주의: update-notifier가 바이너리에서 동작하는지 검증 필요
- [ ] Homebrew tap

### 개선
- [ ] 데모 모드 (--demo) — 가짜 데이터로 스크린샷용
- [ ] 프로젝트별 색상 자동 할당 (현재 하드코딩)
- [ ] 세션 export (markdown)

## 기술 결정 기록

### Ink (React for CLI) 선택
- 이유: TypeScript 주력 스택, React 패턴 활용
- 대안: Go (Bubble Tea), Rust (Ratatui), Python (Textual)
- 결론: 빠른 개발 속도 우선

### 커서 상태를 부모에서 관리
- 이유: Preview 보고 돌아오면 커서 위치 리셋되는 버그
- 해결: SessionList의 cursor를 app.tsx에서 관리

### 검색 통합 (/ 하나로)
- 제목 필터: 즉시 (동기)
- 대화 내용 검색: 비동기 (300ms 디바운스)
- 499MB, 171개 파일 전체 검색 0.5초

### inline이 기본 launch mode
- 이유: 어떤 터미널이든 동작, 새 창/탭 안 열림
- tmux/iTerm2는 Settings에서 변경 가능
