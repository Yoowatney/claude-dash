import { readFileSync, writeFileSync, existsSync } from "node:fs";
import { execSync } from "node:child_process";
import { join } from "node:path";
import { homedir } from "node:os";

const BOOKMARKS_PATH = join(
  homedir(),
  ".config",
  "claudash",
  "bookmarks.json",
);

interface BookmarkData {
  [sessionId: string]: {
    label?: string;
    createdAt: string;
  };
}

function load(): BookmarkData {
  try {
    if (existsSync(BOOKMARKS_PATH)) {
      return JSON.parse(readFileSync(BOOKMARKS_PATH, "utf-8"));
    }
  } catch {
    // ignore
  }
  return {};
}

function save(data: BookmarkData): void {
  const dir = join(homedir(), ".config", "claudash");
  try {
    execSync(`mkdir -p "${dir}"`);
    writeFileSync(BOOKMARKS_PATH, JSON.stringify(data, null, 2));
  } catch {
    // ignore
  }
}

export function isBookmarked(sessionId: string): boolean {
  return sessionId in load();
}

export function toggleBookmark(sessionId: string): boolean {
  const data = load();
  if (sessionId in data) {
    delete data[sessionId];
    save(data);
    return false;
  } else {
    data[sessionId] = { createdAt: new Date().toISOString() };
    save(data);
    return true;
  }
}

export function getBookmarkedIds(): Set<string> {
  return new Set(Object.keys(load()));
}
