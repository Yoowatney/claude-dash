# Claudive

Ink(React) 기반 TUI — Claude Code 세션을 탐색, 검색, 프리뷰, 재개하는 CLI 도구.
npm 패키지로 배포 (`npx claudive`).

## Commands

| Command | Purpose |
|---------|---------|
| `npm run build` | TypeScript 컴파일 (`tsc`) |
| `npm run dev` | Watch 모드 (`tsc --watch`) |
| `node dist/index.js` | 빌드된 앱 실행 |
| `node dist/index.js --demo` | 데모 모드 실행 |
| `npx tsc --noEmit` | 타입 체크만 (빌드 없이) |

## Conventions

- **Ink 컴포넌트**: React 19 + Ink 6 — `<Box>`, `<Text>`, `useInput()`, `useApp()`
- **키바인딩**: vim 스타일 (j/k 이동, u/d 페이지, g/G 처음/끝)
- **상태 관리**: React useState만 사용 (외부 상태관리 없음)
- **데이터 소스**: `~/.claude/projects/` JSONL 파일 직접 파싱
- **설정 저장**: `~/.config/claudash/config.json`

## Task Tracking

할 일은 GitHub Issues에서 관리: `gh issue list --repo Yoowatney/claudive`
새 작업 시작 전 이슈 목록을 확인하고, 관련 이슈가 있으면 PR에 연결할 것.

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
