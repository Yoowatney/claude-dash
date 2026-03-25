import { useState, useEffect, useCallback } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import SessionList from "./components/SessionList.js";
import ProjectList from "./components/ProjectList.js";
import Preview from "./components/Preview.js";
import Settings from "./components/Settings.js";
import {
  scanSessions,
  groupByProject,
  searchSessionContent,
  deleteSession,
} from "./lib/scanner.js";
import { resumeSession } from "./lib/launcher.js";
import { toggleBookmark, getBookmarkedIds } from "./lib/bookmarks.js";
import type { Session, ProjectSummary } from "./lib/scanner.js";

type View = "sessions" | "projects" | "bookmarks";

export default function App() {
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

  useEffect(() => {
    setBookmarkedIds(getBookmarkedIds());
    scanSessions().then((result) => {
      setSessions(result);
      setProjects(groupByProject(result));
      setLoading(false);
      if (result.length > 0) setSelectedSession(result[0]);
    });
  }, []);

  // Debounced content search
  useEffect(() => {
    if (!filter.trim()) {
      setContentMatchIds(null);
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
  }, [filter]);

  // Filter sessions: project filter + text search (title OR content)
  const filteredSessions = useCallback(() => {
    let result = projectFilter
      ? sessions.filter((s) => s.project === projectFilter)
      : sessions;

    if (filter.trim()) {
      const q = filter.toLowerCase();
      result = result.filter((s) => {
        // Match on title
        if (
          s.project.toLowerCase().includes(q) ||
          s.firstMessage.toLowerCase().includes(q)
        ) {
          return true;
        }
        // Match on content
        if (contentMatchIds?.has(s.id)) {
          return true;
        }
        return false;
      });
    }

    return result;
  }, [sessions, projectFilter, filter, contentMatchIds])();

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

    if (showSettings) {
      return;
    }

    if (confirmDelete && selectedSession) {
      if (input === "y" || input === "Y") {
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
      toggleBookmark(selectedSession.id);
      setBookmarkedIds(getBookmarkedIds());
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
  });

  const handleSelect = (session: Session) => {
    exit();
    setTimeout(() => {
      resumeSession(session.id, session.projectPath);
    }, 100);
  };

  const handleCursorChange = (session: Session) => {
    setSelectedSession(session);
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

  if (showPreview && selectedSession) {
    return (
      <Preview
        session={selectedSession}
        onClose={() => setShowPreview(false)}
      />
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box marginBottom={1}>
        <Text bold color="cyan">
          claudash
        </Text>
        <Text dimColor> — Claude Code Session Dashboard</Text>
        <Text dimColor>
          {"  "}({filteredSessions.length}
          {projectFilter || filter ? `/${sessions.length}` : ""} sessions,{" "}
          {projects.length} projects)
        </Text>
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
          [Bookmarks{bookmarkedIds.size > 0 ? ` ${bookmarkedIds.size}` : ""}]
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
          onSelect={handleSelect}
          onCursorChange={handleCursorChange}
          filter={filter}
          bookmarkedIds={bookmarkedIds}
        />
      )}

      {/* Bookmarks view */}
      {view === "bookmarks" && (
        <SessionList
          sessions={sessions.filter((s) => bookmarkedIds.has(s.id))}
          onSelect={handleSelect}
          onCursorChange={handleCursorChange}
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
              : view === "sessions"
                ? projectFilter
                  ? "[Enter] resume  [p] preview  [b] bookmark  [d] delete  [/] search  [s] settings  [Tab] next  [q] clear filter"
                  : "[Enter] resume  [p] preview  [b] bookmark  [d] delete  [/] search  [s] settings  [Tab] next  [q] quit"
                : view === "bookmarks"
                  ? "[Enter] resume  [p] preview  [b] unbookmark  [d] delete  [s] settings  [Tab] next  [q] quit"
                  : "[Enter] filter  [s] settings  [Tab] next  [j/k] navigate  [q] quit"}
        </Text>
      </Box>
    </Box>
  );
}
