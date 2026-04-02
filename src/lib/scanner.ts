import { readdir, readFile, stat, unlink, rm } from "node:fs/promises";
import { statSync } from "node:fs";
import { join, basename } from "node:path";
import { homedir } from "node:os";

export interface Session {
  id: string;
  project: string;
  projectPath: string;
  firstMessage: string;
  messageCount: number;
  lastModified: Date;
}

export interface ProjectSummary {
  name: string;
  path: string;
  sessionCount: number;
  lastActive: Date;
}

const CLAUDE_DIR = join(homedir(), ".claude");
const PROJECTS_DIR = join(CLAUDE_DIR, "projects");

function decodeProjectPath(encoded: string): string {
  // Claude Code encodes paths by replacing / with -
  // Problem: directory names can contain dashes (e.g. "my-project")
  // Solution: walk the filesystem to find the real path
  const parts = encoded.replace(/^-/, "").split("-");
  let resolved = "/";
  let i = 0;

  while (i < parts.length) {
    // Try progressively longer segments joined with dashes
    let found = false;
    for (let j = parts.length; j > i; j--) {
      const candidate = parts.slice(i, j).join("-");
      const testPath = join(resolved, candidate);
      try {
        const s = statSync(testPath);
        if (s.isDirectory()) {
          resolved = testPath;
          i = j;
          found = true;
          break;
        }
      } catch {
        // not found, try shorter
      }
    }
    if (!found) {
      // Fallback: treat remaining parts as slash-separated
      resolved = join(resolved, ...parts.slice(i));
      break;
    }
  }
  return resolved;
}

function projectDisplayName(encoded: string): string {
  const decoded = decodeProjectPath(encoded);
  const parts = decoded.split("/").filter(Boolean);
  return parts[parts.length - 1] || encoded;
}

function extractText(content: unknown): string {
  if (content == null) return "";
  if (typeof content === "string") return content;
  if (Array.isArray(content)) {
    return content
      .map((c: { type?: string; text?: string }) => {
        if (c.type === "text" && c.text) return c.text;
        return "";
      })
      .filter(Boolean)
      .join(" ");
  }
  return String(content);
}

async function parseFirstUserMessage(filePath: string): Promise<string> {
  try {
    const content = await readFile(filePath, "utf-8");
    const lines = content.trim().split("\n");

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        // Claude Code format: type === "user" with message.content
        if (msg.type === "user" && msg.message?.content) {
          const text = extractText(msg.message.content);
          const cleaned = text.replace(/\s+/g, " ").trim();
          if (cleaned) {
            return cleaned.length > 100
              ? cleaned.slice(0, 100) + "..."
              : cleaned;
          }
        }
      } catch {
        continue;
      }
    }
    return "(empty session)";
  } catch {
    return "(unreadable)";
  }
}

async function countMessages(filePath: string): Promise<number> {
  try {
    const content = await readFile(filePath, "utf-8");
    let count = 0;
    for (const line of content.trim().split("\n")) {
      if (!line.trim()) continue;
      try {
        const msg = JSON.parse(line);
        if (msg.type === "user" || msg.type === "assistant") count++;
      } catch {
        continue;
      }
    }
    return count;
  } catch {
    return 0;
  }
}

export interface PreviewMessage {
  role: "user" | "assistant";
  text: string;
}

export async function getSessionPreview(
  sessionId: string,
  project: string,
): Promise<PreviewMessage[]> {
  const messages: PreviewMessage[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await readdir(PROJECTS_DIR);
  } catch {
    return [];
  }

  for (const projDir of projectDirs) {
    if (projectDisplayName(projDir) !== project) continue;
    const filePath = join(PROJECTS_DIR, projDir, `${sessionId}.jsonl`);
    try {
      const content = await readFile(filePath, "utf-8");
      for (const line of content.trim().split("\n")) {
        if (!line.trim()) continue;
        try {
          const msg = JSON.parse(line);
          if (msg.type === "user" && msg.message?.content) {
            const text = extractText(msg.message.content).trim();
            if (text) messages.push({ role: "user", text });
          } else if (msg.type === "assistant" && msg.message?.content) {
            const text = extractText(msg.message.content).trim();
            if (text) messages.push({ role: "assistant", text });
          }
        } catch {
          continue;
        }
      }
    } catch {
      return [];
    }
  }
  return messages;
}

export async function searchSessionContent(
  query: string,
): Promise<Set<string>> {
  const matchingIds = new Set<string>();
  if (!query.trim()) return matchingIds;

  const q = query.toLowerCase();

  let projectDirs: string[];
  try {
    projectDirs = await readdir(PROJECTS_DIR);
  } catch {
    return matchingIds;
  }

  const searchPromises: Promise<void>[] = [];

  for (const projDir of projectDirs) {
    const projPath = join(PROJECTS_DIR, projDir);

    searchPromises.push(
      (async () => {
        const projStat = await stat(projPath).catch(() => null);
        if (!projStat?.isDirectory()) return;

        let files: string[];
        try {
          files = await readdir(projPath);
        } catch {
          return;
        }

        for (const file of files.filter((f) => f.endsWith(".jsonl"))) {
          const sessionId = basename(file, ".jsonl");
          const filePath = join(projPath, file);
          try {
            const content = await readFile(filePath, "utf-8");
            for (const line of content.split("\n")) {
              if (!line.trim()) continue;
              try {
                const msg = JSON.parse(line);
                if (
                  (msg.type === "user" || msg.type === "assistant") &&
                  msg.message?.content
                ) {
                  const text = extractText(msg.message.content).toLowerCase();
                  if (text.includes(q)) {
                    matchingIds.add(sessionId);
                    break;
                  }
                }
              } catch {
                continue;
              }
            }
          } catch {
            continue;
          }
        }
      })(),
    );
  }

  await Promise.all(searchPromises);
  return matchingIds;
}

export async function scanSessions(): Promise<Session[]> {
  const sessions: Session[] = [];

  let projectDirs: string[];
  try {
    projectDirs = await readdir(PROJECTS_DIR);
  } catch {
    return [];
  }

  for (const projDir of projectDirs) {
    const projPath = join(PROJECTS_DIR, projDir);
    const projStat = await stat(projPath).catch(() => null);
    if (!projStat?.isDirectory()) continue;

    let files: string[];
    try {
      files = await readdir(projPath);
    } catch {
      continue;
    }

    const jsonlFiles = files.filter((f) => f.endsWith(".jsonl"));

    for (const file of jsonlFiles) {
      const filePath = join(projPath, file);
      const sessionId = basename(file, ".jsonl");

      const [firstMessage, messageCount, fileStat] = await Promise.all([
        parseFirstUserMessage(filePath),
        countMessages(filePath),
        stat(filePath).catch(() => null),
      ]);

      if (messageCount === 0) continue;

      sessions.push({
        id: sessionId,
        project: projectDisplayName(projDir),
        projectPath: decodeProjectPath(projDir),
        firstMessage,
        messageCount,
        lastModified: fileStat?.mtime ?? new Date(0),
      });
    }
  }

  sessions.sort((a, b) => b.lastModified.getTime() - a.lastModified.getTime());
  return sessions;
}

export function groupByProject(sessions: Session[]): ProjectSummary[] {
  const groups = new Map<string, { path: string; sessions: Session[] }>();

  for (const s of sessions) {
    const existing = groups.get(s.project);
    if (existing) {
      existing.sessions.push(s);
    } else {
      groups.set(s.project, { path: s.projectPath, sessions: [s] });
    }
  }

  return Array.from(groups.entries())
    .map(([name, { path, sessions: projectSessions }]) => ({
      name,
      path,
      sessionCount: projectSessions.length,
      lastActive: projectSessions[0]?.lastModified ?? new Date(0),
    }))
    .sort((a, b) => b.sessionCount - a.sessionCount);
}

export async function deleteSession(session: Session): Promise<boolean> {
  let projectDirs: string[];
  try {
    projectDirs = await readdir(PROJECTS_DIR);
  } catch {
    return false;
  }

  let deleted = false;

  for (const projDir of projectDirs) {
    if (projectDisplayName(projDir) !== session.project) continue;

    // Delete .jsonl file
    const jsonlPath = join(PROJECTS_DIR, projDir, `${session.id}.jsonl`);
    try {
      await unlink(jsonlPath);
      deleted = true;
    } catch {
      // file might not exist
    }

    // Delete session-env directory if exists
    const sessionEnvPath = join(
      homedir(),
      ".claude",
      "session-env",
      session.id,
    );
    try {
      await rm(sessionEnvPath, { recursive: true });
    } catch {
      // directory might not exist
    }
  }

  return deleted;
}
