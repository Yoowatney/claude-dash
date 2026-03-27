import type { Session, ProjectSummary, PreviewMessage } from "./scanner.js";

const now = Date.now();
const hours = (h: number) => new Date(now - h * 3600000);
const days = (d: number) => new Date(now - d * 86400000);

export const demoSessions: Session[] = [
  {
    id: "a1b2c3d4-1111-4444-aaaa-111111111111",
    project: "my-saas",
    projectPath: "/Users/demo/projects/my-saas",
    firstMessage: "Fix the auth bug where users get logged out after refresh",
    messageCount: 24,
    lastModified: hours(0.5),
  },
  {
    id: "b2c3d4e5-2222-4444-bbbb-222222222222",
    project: "my-saas",
    projectPath: "/Users/demo/projects/my-saas",
    firstMessage: "Add rate limiting to the /api/v2 endpoints",
    messageCount: 18,
    lastModified: hours(3),
  },
  {
    id: "c3d4e5f6-3333-4444-cccc-333333333333",
    project: "blog",
    projectPath: "/Users/demo/projects/blog",
    firstMessage: "Migrate from MDX v1 to v2 and fix all breaking changes",
    messageCount: 42,
    lastModified: hours(8),
  },
  {
    id: "d4e5f6a7-4444-4444-dddd-444444444444",
    project: "dotfiles",
    projectPath: "/Users/demo/.dotfiles",
    firstMessage: "Set up neovim LSP config for TypeScript and Rust",
    messageCount: 15,
    lastModified: days(1),
  },
  {
    id: "e5f6a7b8-5555-4444-eeee-555555555555",
    project: "api-server",
    projectPath: "/Users/demo/projects/api-server",
    firstMessage: "Refactor the database layer to use connection pooling",
    messageCount: 31,
    lastModified: days(1),
  },
  {
    id: "f6a7b8c9-6666-4444-ffff-666666666666",
    project: "my-saas",
    projectPath: "/Users/demo/projects/my-saas",
    firstMessage: "Write E2E tests for the checkout flow with Stripe",
    messageCount: 27,
    lastModified: days(2),
  },
  {
    id: "a7b8c9d0-7777-4444-aaaa-777777777777",
    project: "infra",
    projectPath: "/Users/demo/projects/infra",
    firstMessage: "Set up GitHub Actions CI/CD pipeline with staging deploy",
    messageCount: 20,
    lastModified: days(3),
  },
  {
    id: "b8c9d0e1-8888-4444-bbbb-888888888888",
    project: "blog",
    projectPath: "/Users/demo/projects/blog",
    firstMessage: "Add dark mode support with CSS variables",
    messageCount: 12,
    lastModified: days(5),
  },
  {
    id: "c9d0e1f2-9999-4444-cccc-999999999999",
    project: "api-server",
    projectPath: "/Users/demo/projects/api-server",
    firstMessage: "Implement WebSocket support for real-time notifications",
    messageCount: 35,
    lastModified: days(7),
  },
  {
    id: "d0e1f2a3-0000-4444-dddd-000000000000",
    project: "dotfiles",
    projectPath: "/Users/demo/.dotfiles",
    firstMessage: "Configure tmux with custom keybindings and status bar",
    messageCount: 8,
    lastModified: days(14),
  },
];

export const demoProjects: ProjectSummary[] = [
  { name: "my-saas", path: "/Users/demo/projects/my-saas", sessionCount: 3, lastActive: hours(0.5) },
  { name: "blog", path: "/Users/demo/projects/blog", sessionCount: 2, lastActive: hours(8) },
  { name: "api-server", path: "/Users/demo/projects/api-server", sessionCount: 2, lastActive: days(1) },
  { name: "dotfiles", path: "/Users/demo/.dotfiles", sessionCount: 2, lastActive: days(1) },
  { name: "infra", path: "/Users/demo/projects/infra", sessionCount: 1, lastActive: days(3) },
];

export const demoBookmarkedIds = new Set<string>();

export const demoPreviewData: Record<string, PreviewMessage[]> = {
  "a1b2c3d4-1111-4444-aaaa-111111111111": [
    { role: "user", text: "Fix the auth bug where users get logged out after refresh" },
    { role: "assistant", text: "I'll investigate the auth flow. Let me start by looking at the session management code and the token refresh logic.\n\nFirst, let me check the relevant files:\n- src/auth/session.ts\n- src/auth/refresh.ts\n- src/middleware/auth.ts" },
    { role: "user", text: "The token is stored in localStorage but it seems like the refresh token rotation isn't working" },
    { role: "assistant", text: "Found the issue. In `auth/refresh.ts`, the rotation logic calls `revokeToken()` before the new token is saved. If the save fails, the user loses both tokens.\n\nHere's what's happening step by step:\n\n1. User's access token expires\n2. Client calls /api/auth/refresh with the refresh token\n3. Server generates new access + refresh tokens\n4. Server revokes the old refresh token  <-- this happens first\n5. Server sends new tokens to client\n6. Client saves to localStorage  <-- if this fails, user is locked out\n\nThe fix is to reorder steps 4 and 6:\n1. Save the new token first\n2. Then revoke the old one\n3. Add a try-catch to handle save failures gracefully\n\nLet me implement this now." },
    { role: "user", text: "That makes sense. Can you also add a test for this?" },
    { role: "assistant", text: "Done. I've updated `auth/refresh.ts` with the new order and added comprehensive tests.\n\nChanges made:\n\n**src/auth/refresh.ts**\n- Reordered token rotation: save first, revoke second\n- Added try-catch around localStorage.setItem\n- Added fallback: if save fails, keep old tokens valid\n- Added logging for debugging token rotation issues\n\n**tests/auth/refresh.test.ts** (new file)\n- Test: normal refresh flow works end-to-end\n- Test: failed localStorage save keeps old token valid\n- Test: concurrent refresh requests are serialized\n- Test: expired refresh token returns 401\n- Test: invalid refresh token returns 403\n\nAll 5 tests passing." },
    { role: "user", text: "Nice. One more thing - can we add a retry mechanism? Sometimes the network request to refresh fails transiently" },
    { role: "assistant", text: "Good idea. I'll add exponential backoff retry for the refresh request.\n\nImplementation plan:\n1. Retry up to 3 times with exponential backoff (1s, 2s, 4s)\n2. Only retry on network errors and 5xx, not on 4xx (which means the token is actually invalid)\n3. Queue concurrent refresh attempts so we don't send multiple refresh requests\n\nLet me implement this." },
    { role: "user", text: "Perfect. Also make sure the UI doesn't flash a login screen during the retry" },
    { role: "assistant", text: "Done. Added three things:\n\n1. **Retry with backoff** in `auth/refresh.ts`:\n   - 3 retries, exponential backoff (1s, 2s, 4s)\n   - Only retries network errors and 5xx\n   - Concurrent requests are queued (deduplication)\n\n2. **Auth state buffer** in `auth/provider.tsx`:\n   - New `refreshing` state prevents premature redirect to login\n   - Shows a subtle loading indicator instead of flashing login page\n   - 10-second timeout before giving up and showing login\n\n3. **New tests**:\n   - Test: retry succeeds on second attempt after network error\n   - Test: no retry on 401 (invalid token)\n   - Test: UI stays on current page during refresh retry\n   - Test: UI redirects to login after timeout\n\nAll 9 tests passing. Want me to also add monitoring/alerting for failed refreshes?" },
    { role: "user", text: "No, this is good enough for now. Let's ship it" },
    { role: "assistant", text: "Alright, here's a summary of all changes:\n\n**Files modified:**\n- src/auth/refresh.ts — Token rotation reorder + retry logic\n- src/auth/provider.tsx — Auth state buffer during refresh\n- src/auth/types.ts — New RefreshState type\n\n**Files created:**\n- tests/auth/refresh.test.ts — 9 test cases\n\n**What was fixed:**\n- Users no longer get logged out on page refresh\n- Network errors during token refresh are retried\n- No login page flash during refresh\n\nReady to commit and push." },
  ],
  "b2c3d4e5-2222-4444-bbbb-222222222222": [
    { role: "user", text: "Add rate limiting to the /api/v2 endpoints" },
    { role: "assistant", text: "I'll implement rate limiting using a sliding window algorithm. Which endpoints need it and what limits do you want?" },
    { role: "user", text: "All /api/v2/* endpoints. 100 requests per minute per API key, 1000 per hour" },
    { role: "assistant", text: "Implemented with Redis-backed sliding window. Added middleware that checks both per-minute and per-hour limits. Returns 429 with Retry-After header when exceeded." },
  ],
  "c3d4e5f6-3333-4444-cccc-333333333333": [
    { role: "user", text: "Migrate from MDX v1 to v2 and fix all breaking changes" },
    { role: "assistant", text: "MDX v2 has several breaking changes. Let me scan your content files first to understand the scope." },
    { role: "user", text: "There are about 50 blog posts. Main concern is the custom components and frontmatter" },
    { role: "assistant", text: "Scanned all 50 posts. Found 3 types of breaking changes:\n1. Import syntax changed in 12 files\n2. Custom component props API changed in 8 files\n3. Frontmatter parsing needs rehype plugin swap\n\nI'll fix them in order." },
  ],
};
