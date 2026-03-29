import { useState, useEffect, useMemo } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import SessionList from "./components/SessionList.js";
import ProjectList from "./components/ProjectList.js";
import Preview from "./components/Preview.js";
import Settings from "./components/Settings.js";
import Help from "./components/Help.js";
import {
  scanSessions,
  groupByProject,
  searchSessionContent,
  deleteSession,
} from "./lib/scanner.js";
import { resumeSession } from "./lib/launcher.js";
import { toggleBookmark, getBookmarkedIds } from "./lib/bookmarks.js";
import { getFooterText } from "./lib/keybindings.js";
import {
  demoSessions,
  demoProjects,
  demoBookmarkedIds,
  demoPreviewData,
} from "./lib/demo.js";
import type { Session, ProjectSummary } from "./lib/scanner.js";

type View = "sessions" | "projects" | "bookmarks";

interface AppProps {
  version: string;
  updateInfo: { current: string; latest: string } | null;
  demo?: boolean;
}

export default function App({ version, updateInfo, demo }: AppProps) {
  const { exit } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("sessions");
  const [searchMode, setSearchMode] = useState(false);
  const [filter, setFilter] = useState("");
  const [contentMatchIds, setContentMatchIds] = useState<Set<string> | null>(
    null,
  );
  const [searching, setSearching] = useState(false);
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);
  const [bookmarkedIds, setBookmarkedIds] = useState<Set<string>>(new Set());
  const [confirmDelete, setConfirmDelete] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showHelp, setShowHelp] = useState(false);
  const [sessionCursor, setSessionCursor] = useState(0);

  useEffect(() => {
    if (demo) {
      setSessions(demoSessions);
      setProjects(demoProjects);
      setBookmarkedIds(demoBookmarkedIds);
      setLoading(false);
      setSelectedSession(demoSessions[0]);
      return;
    }
    setBookmarkedIds(getBookmarkedIds());
    scanSessions().then((result) => {
      setSessions(result);
      setProjects(groupByProject(result));
      setLoading(false);
      if (result.length > 0) setSelectedSession(result[0]);
    });
  }, [demo]);

  // Debounced content search
  useEffect(() => {
    if (!filter.trim()) {
      setContentMatchIds(null);
      setSearching(false);
      return;
    }

    if (demo) {
      // Demo: search only by title (no file access)
      setContentMatchIds(new Set());
      setSearching(false);
      return;
    }

    setSearching(true);
    const timer = setTimeout(() => {
      searchSessionContent(filter).then((ids) => {
        setContentMatchIds(ids);
        setSearching(false);
      });
    }, 300);

    return () => clearTimeout(timer);
  }, [filter, demo]);

  // Filter sessions: project filter + text search (title OR content)
  const filteredSessions = useMemo(() => {
    let result = projectFilter
      ? sessions.filter((s) => s.project === projectFilter)
      : sessions;

    if (filter.trim()) {
      const q = filter.toLowerCase();
      result = result.filter((s) => {
        if (
          s.project.toLowerCase().includes(q) ||
          s.firstMessage.toLowerCase().includes(q)
        ) {
          return true;
        }
        if (contentMatchIds?.has(s.id)) {
          return true;
        }
        return false;
      });
    }

    return result;
  }, [sessions, projectFilter, filter, contentMatchIds]);

  useInput((input, key) => {
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setFilter("");
        setContentMatchIds(null);
      }
      return;
    }

    if (showPreview) {
      if (key.escape || input === "q" || input === "p") {
        setShowPreview(false);
      }
      return;
    }

    if (showSettings || showHelp) {
      return;
    }

    if (confirmDelete && selectedSession) {
      if (input === "y" || input === "Y") {
        if (demo) {
          setSessions((prev) =>
            prev.filter((s) => s.id !== selectedSession.id),
          );
          setConfirmDelete(false);
        } else {
          deleteSession(selectedSession).then((ok) => {
            if (ok) {
              setSessions((prev) =>
                prev.filter((s) => s.id !== selectedSession.id),
              );
              setProjects(
                groupByProject(
                  sessions.filter((s) => s.id !== selectedSession.id),
                ),
              );
            }
            setConfirmDelete(false);
          });
        }
      } else {
        setConfirmDelete(false);
      }
      return;
    }

    if (input === "q" || key.escape) {
      if (projectFilter && view === "sessions") {
        setProjectFilter(null);
      } else {
        exit();
      }
    }
    if (input === "/") {
      setSearchMode(true);
    }
    if (key.tab && key.shift) {
      setView((v) =>
        v === "sessions"
          ? "bookmarks"
          : v === "bookmarks"
            ? "projects"
            : "sessions",
      );
    } else if (key.tab) {
      setView((v) =>
        v === "sessions"
          ? "projects"
          : v === "projects"
            ? "bookmarks"
            : "sessions",
      );
    }
    if (
      input === "p" &&
      selectedSession &&
      (view === "sessions" || view === "bookmarks")
    ) {
      setShowPreview(true);
    }
    if (
      input === "b" &&
      selectedSession &&
      (view === "sessions" || view === "bookmarks")
    ) {
      if (demo) {
        setBookmarkedIds((prev) => {
          const next = new Set(prev);
          if (next.has(selectedSession.id)) next.delete(selectedSession.id);
          else next.add(selectedSession.id);
          return next;
        });
      } else {
        toggleBookmark(selectedSession.id);
        setBookmarkedIds(getBookmarkedIds());
      }
    }
    if (
      input === "d" &&
      selectedSession &&
      (view === "sessions" || view === "bookmarks")
    ) {
      setConfirmDelete(true);
    }
    if (input === "s" && !searchMode) {
      setShowSettings(true);
    }
    if (input === "?" && !searchMode) {
      setShowHelp(true);
    }
  });

  const handleSelect = (session: Session) => {
    if (demo) {
      exit();
      setTimeout(() => {
        const shortId = session.id.slice(0, 8);
        process.stdout.write(`\x1b[2J\x1b[H`); // clear screen
        process.stdout.write(`\n\x1b[1m  Claude Code\x1b[0m\n\n`);
        process.stdout.write(`  \x1b[36mResuming session ${shortId}...\x1b[0m\n`);
        process.stdout.write(`  \x1b[2m${session.projectPath}\x1b[0m\n\n`);
        process.stdout.write(`  \x1b[33m>\x1b[0m ${session.firstMessage}\n\n`);
        process.stdout.write(`  \x1b[2mClaude is thinking...\x1b[0m\n`);
        setTimeout(() => process.exit(0), 3000);
      }, 100);
      return;
    }
    exit();
    setTimeout(() => {
      resumeSession(session.id, session.projectPath);
    }, 100);
  };

  const handleCursorChange = (cursorIdx: number) => {
    setSessionCursor(cursorIdx);
    if (filteredSessions[cursorIdx]) {
      setSelectedSession(filteredSessions[cursorIdx]);
    }
  };

  const handleProjectSelect = (project: ProjectSummary) => {
    if (projectFilter === project.name) {
      setProjectFilter(null);
    } else {
      setProjectFilter(project.name);
      setView("sessions");
    }
  };

  const handleAllSelect = () => {
    setProjectFilter(null);
    setView("sessions");
  };

  if (loading) {
    return (
      <Box>
        <Text color="cyan">Scanning sessions...</Text>
      </Box>
    );
  }

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />;
  }

  if (showHelp) {
    return <Help onClose={() => setShowHelp(false)} />;
  }

  if (showPreview && selectedSession) {
    return (
      <Preview
        session={selectedSession}
        onClose={() => setShowPreview(false)}
        onSelect={handleSelect}
        demoData={demo ? demoPreviewData[selectedSession.id] : undefined}
      />
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          claudive
        </Text>
        <Text dimColor> v{version}</Text>
        <Text dimColor>
          {"  "}({filteredSessions.length}
          {projectFilter || filter ? `/${sessions.length}` : ""} sessions,{" "}
          {projects.length} projects)
        </Text>
        {updateInfo && (
          <Text color="yellow">
            {"  "}update: {updateInfo.current} → {updateInfo.latest}
          </Text>
        )}
      </Box>

      {/* Tabs + filter indicator */}
      <Box marginBottom={1} gap={2}>
        <Text
          bold={view === "sessions"}
          color={view === "sessions" ? "cyan" : "gray"}
        >
          [Sessions]
        </Text>
        <Text
          bold={view === "projects"}
          color={view === "projects" ? "cyan" : "gray"}
        >
          [Projects]
        </Text>
        <Text
          bold={view === "bookmarks"}
          color={view === "bookmarks" ? "yellow" : "gray"}
        >
          [Bookmarks{(() => { const count = sessions.filter(s => bookmarkedIds.has(s.id)).length; return count > 0 ? ` ${count}` : ""; })()}]
        </Text>
        {projectFilter && <Text color="yellow"> ~ {projectFilter}</Text>}
      </Box>

      {/* Projects view */}
      {view === "projects" && (
        <ProjectList
          projects={projects}
          onSelect={handleProjectSelect}
          onSelectAll={handleAllSelect}
          selectedProject={projectFilter}
        />
      )}

      {/* Sessions view */}
      {view === "sessions" && (
        <SessionList
          sessions={filteredSessions}
          cursor={sessionCursor}
          onCursorChange={handleCursorChange}
          onSelect={handleSelect}
          filter={filter}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      {/* Bookmarks view */}
      {view === "bookmarks" && (
        <SessionList
          sessions={sessions.filter((s) => bookmarkedIds.has(s.id))}
          cursor={sessionCursor}
          onCursorChange={handleCursorChange}
          onSelect={handleSelect}
          filter={filter}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      {/* Search bar */}
      {searchMode && (
        <Box marginTop={1}>
          <Text color="yellow">/</Text>
          <TextInput value={filter} onChange={setFilter} />
          {searching && <Text color="gray"> searching...</Text>}
        </Box>
      )}

      {/* Delete confirmation */}
      {confirmDelete && selectedSession && (
        <Box marginTop={1}>
          <Text color="red" bold>
            Delete session "{selectedSession.firstMessage.slice(0, 40)}..."? [y/n]
          </Text>
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {confirmDelete
            ? "[y] confirm delete  [n/any] cancel"
            : searchMode
              ? "[Esc] cancel  (searches titles + conversation content)"
              : getFooterText(view as "sessions" | "projects" | "bookmarks")}
        </Text>
      </Box>
    </Box>
  );
}
