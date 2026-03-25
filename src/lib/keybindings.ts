export interface Keybinding {
  key: string;
  action: string;
  views: ("sessions" | "projects" | "bookmarks" | "preview" | "global")[];
}

const keybindings: Keybinding[] = [
  { key: "j/k/↑/↓", action: "Navigate", views: ["sessions", "projects", "bookmarks", "preview"] },
  { key: "Enter", action: "Resume session", views: ["sessions", "bookmarks"] },
  { key: "Enter", action: "Filter by project", views: ["projects"] },
  { key: "Enter", action: "Select", views: ["global"] },
  { key: "p", action: "Preview conversation", views: ["sessions", "bookmarks"] },
  { key: "p/Esc", action: "Back to list", views: ["preview"] },
  { key: "b", action: "Toggle bookmark", views: ["sessions", "bookmarks"] },
  { key: "d", action: "Delete session", views: ["sessions", "bookmarks"] },
  { key: "/", action: "Search (titles + content)", views: ["sessions"] },
  { key: "u/d", action: "Page up/down", views: ["preview"] },
  { key: "g/G", action: "Top/bottom", views: ["preview"] },
  { key: "Tab", action: "Next view", views: ["global"] },
  { key: "Shift+Tab", action: "Previous view", views: ["global"] },
  { key: "s", action: "Settings", views: ["global"] },
  { key: "?", action: "Help", views: ["global"] },
  { key: "q/Esc", action: "Quit (or clear filter)", views: ["global"] },
];

export function getKeybindings(): Keybinding[] {
  return keybindings;
}

export function getKeybindingsForView(
  view: "sessions" | "projects" | "bookmarks" | "preview",
): Keybinding[] {
  return keybindings.filter(
    (k) => k.views.includes(view) || k.views.includes("global"),
  );
}

export function getFooterText(
  view: "sessions" | "projects" | "bookmarks",
  extra?: string,
): string {
  const bindings = keybindings
    .filter((k) => k.views.includes(view) || k.views.includes("global"))
    .map((k) => `[${k.key}] ${k.action.toLowerCase()}`);

  if (extra) bindings.unshift(extra);
  return bindings.join("  ");
}
