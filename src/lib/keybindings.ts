export interface Keybinding {
  key: string;
  action: string;
  views: ("sessions" | "projects" | "bookmarks" | "preview" | "global")[];
  showInFooter?: boolean;
}

const keybindings: Keybinding[] = [
  { key: "j/k", action: "Navigate", views: ["sessions", "projects", "bookmarks", "preview"] },
  { key: "Enter", action: "Resume", views: ["sessions", "bookmarks"], showInFooter: true },
  { key: "Enter", action: "Select", views: ["projects"], showInFooter: true },
  { key: "p", action: "Preview", views: ["sessions", "bookmarks"], showInFooter: true },
  { key: "p/Esc", action: "Back", views: ["preview"], showInFooter: true },
  { key: "o", action: "Sort", views: ["sessions", "bookmarks"], showInFooter: true },
  { key: "b", action: "Bookmark", views: ["sessions", "bookmarks"] },
  { key: "d", action: "Delete", views: ["sessions", "bookmarks"] },
  { key: "/", action: "Search", views: ["sessions"], showInFooter: true },
  { key: "u/d", action: "Page up/down", views: ["preview"] },
  { key: "g/G", action: "Top/bottom", views: ["preview"] },
  { key: "Tab", action: "Next view", views: ["global"], showInFooter: true },
  { key: "Shift+Tab", action: "Prev view", views: ["global"] },
  { key: "s", action: "Settings", views: ["global"] },
  { key: "?", action: "Help", views: ["global"], showInFooter: true },
  { key: "q", action: "Quit", views: ["global"], showInFooter: true },
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
): string {
  return keybindings
    .filter(
      (k) =>
        k.showInFooter &&
        (k.views.includes(view) || k.views.includes("global")),
    )
    .map((k) => `[${k.key}] ${k.action}`)
    .join("  ");
}
