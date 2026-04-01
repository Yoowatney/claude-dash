import { useState, useEffect, useMemo, useRef } from "react";
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
import { resumeSession, type ResumeMode } from "./lib/launcher.js";
import { toggleBookmark, getBookmarkedIds, setBookmarkLabel, getBookmarkLabels } from "./lib/bookmarks.js";
import { getFooterText } from "./lib/keybindings.js";
import {
  demoSessions,
  demoProjects,
  demoBookmarkedIds,
  demoPreviewData,
} from "./lib/demo.js";
import { getSubtitle } from "./lib/demoSubtitles.js";
import type { Session, ProjectSummary } from "./lib/scanner.js";

type View = "sessions" | "projects" | "bookmarks";
type SortOrder = "recent" | "messages";

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
  const [launchingSession, setLaunchingSession] = useState<Session | null>(null);
  const [launchMode, setLaunchMode] = useState<ResumeMode>("just-dive");
  const [showResumeMenu, setShowResumeMenu] = useState(false);
  const [resumeMenuCursor, setResumeMenuCursor] = useState(0);
  const [animFrame, setAnimFrame] = useState(0);
  const [sortOrder, setSortOrder] = useState<SortOrder>("recent");
  const [bookmarkLabels, setBookmarkLabels] = useState<Record<string, string>>({});
  const [labelInput, setLabelInput] = useState(false);
  const [labelText, setLabelText] = useState("");
  const [demoSubtitle, setDemoSubtitle] = useState<string | null>(null);
  const demoStartRef = useRef(Date.now());
  const suppressInputRef = useRef(false);

  useEffect(() => {
    if (demo) {
      setTimeout(() => {
        setSessions(demoSessions);
        setProjects(demoProjects);
        setBookmarkedIds(demoBookmarkedIds);
        setLoading(false);
        setSelectedSession(demoSessions[0]);
      }, 1000);
      return;
    }
    setBookmarkedIds(getBookmarkedIds());
    setBookmarkLabels(getBookmarkLabels());
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

    if (sortOrder === "messages") {
      result = [...result].sort((a, b) => b.messageCount - a.messageCount);
    }

    return result;
  }, [sessions, projectFilter, filter, contentMatchIds, sortOrder]);

  const bookmarkedSessions = useMemo(() => {
    let result = sessions.filter((s) => bookmarkedIds.has(s.id));
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
    if (sortOrder === "messages") {
      result.sort((a, b) => b.messageCount - a.messageCount);
    }
    return result;
  }, [sessions, bookmarkedIds, filter, contentMatchIds, sortOrder]);

  const currentViewSessions = view === "bookmarks" ? bookmarkedSessions : filteredSessions;

  const resumeOptions: { mode: ResumeMode; label: string; desc: string }[] = [
    { mode: "just-dive", label: "Just dive", desc: "--resume" },
    { mode: "yolo-dive", label: "Yolo dive", desc: "--dangerously-skip-permissions" },
    { mode: "fork-dive", label: "Fork & dive", desc: "--fork-session" },
  ];

  useInput((input, key) => {
    if (labelInput) {
      if (key.return) {
        if (selectedSession && !demo) {
          setBookmarkLabel(selectedSession.id, labelText);
          setBookmarkLabels(getBookmarkLabels());
        }
        setLabelInput(false);
        setLabelText("");
      }
      if (key.escape) {
        setLabelInput(false);
        setLabelText("");
      }
      return;
    }

    if (showResumeMenu) {
      if (key.escape) {
        setShowResumeMenu(false);
        return;
      }
      if (key.upArrow || input === "k") {
        setResumeMenuCursor((c) => Math.max(0, c - 1));
        return;
      }
      if (key.downArrow || input === "j") {
        setResumeMenuCursor((c) => Math.min(resumeOptions.length - 1, c + 1));
        return;
      }
      if (key.return && selectedSession) {
        setLaunchMode(resumeOptions[resumeMenuCursor].mode);
        setShowResumeMenu(false);
        setLaunchingSession(selectedSession);
        return;
      }
      return;
    }

    if (searchMode) {
      if (key.tab) {
        setSearchMode(false);
        // Keep filter active — user can browse results with j/k and p
        return;
      }
      if (key.escape) {
        setSearchMode(false);
        setFilter("");
        setContentMatchIds(null);
      }
      // Block ctrl key combos in search mode (e.g. ctrl+u from cmd+backspace)
      if (key.ctrl) {
        if (input === "u") {
          setFilter("");
          suppressInputRef.current = true;
          setTimeout(() => { suppressInputRef.current = false; }, 100);
        }
        return;
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
      if (filter) {
        setFilter("");
        setContentMatchIds(null);
      } else if (projectFilter && view === "sessions") {
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
      currentViewSessions.length > 0 &&
      (view === "sessions" || view === "bookmarks")
    ) {
      setShowPreview(true);
    }
    if (
      input === "b" &&
      selectedSession &&
      currentViewSessions.length > 0 &&
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
        const wasBookmarked = bookmarkedIds.has(selectedSession.id);
        toggleBookmark(selectedSession.id);
        const newIds = getBookmarkedIds();
        setBookmarkedIds(newIds);
        setBookmarkLabels(getBookmarkLabels());
        if (!wasBookmarked) {
          // Just bookmarked — prompt for label
          setLabelInput(true);
          setLabelText("");
        }
        if (view === "bookmarks" && wasBookmarked) {
          // Unbookmarked in bookmarks view — update cursor
          const newList = sessions.filter((s) => newIds.has(s.id));
          const newIdx = Math.min(sessionCursor, newList.length - 1);
          if (newIdx >= 0) {
            setSessionCursor(newIdx);
            setSelectedSession(newList[newIdx]);
          } else {
            setSelectedSession(null);
          }
        }
      }
    }
    if (
      input === "d" &&
      selectedSession &&
      currentViewSessions.length > 0 &&
      (view === "sessions" || view === "bookmarks")
    ) {
      setConfirmDelete(true);
    }
    if (input === "o" && (view === "sessions" || view === "bookmarks")) {
      setSortOrder((s) => (s === "recent" ? "messages" : "recent"));
      setSessionCursor(0);
    }
    if (input === "s" && !searchMode) {
      setShowSettings(true);
    }
    if (input === "?" && !searchMode) {
      setShowHelp(true);
    }
  });

  const waveFrames = [
    "~~~~~~~",
    "~~≈~~~~",
    "~≈~~≈~~",
    "≈~~≈~~≈",
    "~≈~~≈~~",
    "~~≈~~~~",
  ];

  // Demo subtitle timer — starts when loading finishes
  useEffect(() => {
    if (!demo || loading) return;
    demoStartRef.current = Date.now();
    const timer = setInterval(() => {
      setDemoSubtitle(getSubtitle(Date.now() - demoStartRef.current));
    }, 200);
    return () => clearInterval(timer);
  }, [demo, loading]);

  // Wave animation for loading and launching
  useEffect(() => {
    if (!loading && !launchingSession) return;
    const spin = setInterval(() => {
      setAnimFrame((f) => (f + 1) % waveFrames.length);
    }, 150);
    return () => clearInterval(spin);
  }, [loading, launchingSession]);

  // Delayed launch after spinner shows
  useEffect(() => {
    if (!launchingSession) return;
    const launch = setTimeout(() => {
      exit();
      setTimeout(() => {
        if (demo) {
          const shortId = launchingSession.id.slice(0, 8);
          process.stdout.write(`\x1b[2J\x1b[H`);
          process.stdout.write(`\n\x1b[1m  Claude Code\x1b[0m\n\n`);
          process.stdout.write(`  \x1b[36m~≈~ Diving into session ${shortId}...\x1b[0m\n`);
          process.stdout.write(`  \x1b[2m${launchingSession.projectPath}\x1b[0m\n\n`);
          process.stdout.write(`  \x1b[33m>\x1b[0m ${launchingSession.firstMessage}\n\n`);
          process.stdout.write(`  \x1b[2mClaude is thinking...\x1b[0m\n`);
          setTimeout(() => process.exit(0), 3000);
        } else {
          resumeSession(launchingSession.id, launchingSession.projectPath, launchMode);
        }
      }, 100);
    }, 500);
    return () => clearTimeout(launch);
  }, [launchingSession]);

  const handleSelect = (session: Session) => {
    if (!launchingSession && !showResumeMenu) {
      setSelectedSession(session);
      setShowResumeMenu(true);
      setResumeMenuCursor(0);
    }
  };

  const handleCursorChange = (cursorIdx: number, session: Session) => {
    setSessionCursor(cursorIdx);
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
      <Box flexDirection="column" paddingTop={1}>
        <Box>
          <Text color="cyan">{waveFrames[animFrame].repeat(4)}</Text>
        </Box>
        <Box marginTop={1}>
          <Text> 🫧 </Text>
          <Text color="cyan">Scanning sessions...</Text>
        </Box>
        {demo && (
          <Box marginTop={1} justifyContent="center">
            <Text color="yellow" bold>claude + dive = claudive</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (showSettings) {
    return <Settings onClose={() => setShowSettings(false)} />;
  }

  if (showHelp) {
    return <Help onClose={() => setShowHelp(false)} demoSubtitle={demo ? demoSubtitle : undefined} />;
  }

  if (showResumeMenu && selectedSession) {
    return (
      <Box flexDirection="column" paddingTop={1}>
        <Box>
          <Text bold color="cyan">Dive options</Text>
          <Text dimColor>  {selectedSession.project} {selectedSession.id.slice(0, 8)}</Text>
        </Box>
        <Box marginTop={1} flexDirection="column">
          {resumeOptions.map((opt, i) => (
            <Box key={opt.mode}>
              <Text color={i === resumeMenuCursor ? "cyan" : "gray"} bold={i === resumeMenuCursor}>
                {i === resumeMenuCursor ? " ▶ " : "   "}
              </Text>
              <Text color={i === resumeMenuCursor ? "white" : "gray"} bold={i === resumeMenuCursor}>
                {opt.label}
              </Text>
              <Text dimColor>  ({opt.desc})</Text>
            </Box>
          ))}
        </Box>
        <Box marginTop={1}>
          <Text dimColor>[j/k] select  [Enter] confirm  [Esc] cancel</Text>
        </Box>
        {demo && demoSubtitle && (
          <Box marginTop={1} justifyContent="center">
            <Text color="yellow" bold>{demoSubtitle}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (launchingSession) {
    return (
      <Box flexDirection="column" paddingTop={1}>
        <Text color="cyan">{waveFrames[animFrame].repeat(4)}</Text>
        <Box marginTop={1}>
          <Text> 🤿 </Text>
          <Text color="cyan" bold>Diving into session...</Text>
        </Box>
        <Box>
          <Text>    </Text>
          <Text dimColor>{launchingSession.project} {launchingSession.id.slice(0, 8)}</Text>
        </Box>
        <Box marginTop={1}>
          <Text color="cyan">{waveFrames[animFrame].repeat(4)}</Text>
        </Box>
        {demo && demoSubtitle && (
          <Box marginTop={1} justifyContent="center">
            <Text color="yellow" bold>{demoSubtitle}</Text>
          </Box>
        )}
      </Box>
    );
  }

  if (showPreview && selectedSession) {
    return (
      <Preview
        session={selectedSession}
        onClose={() => setShowPreview(false)}
        onSelect={handleSelect}
        demoData={demo ? demoPreviewData[selectedSession.id] : undefined}
        demoSubtitle={demo ? demoSubtitle : undefined}
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
          [Bookmarks{bookmarkedSessions.length > 0 ? ` ${bookmarkedSessions.length}` : ""}]
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
          searchMode={searchMode}
          bookmarkedIds={bookmarkedIds}
          bookmarkLabels={bookmarkLabels}
          sortOrder={sortOrder}
        />
      )}

      {/* Bookmarks view */}
      {view === "bookmarks" && (
        <SessionList
          sessions={bookmarkedSessions}
          cursor={sessionCursor}
          onCursorChange={handleCursorChange}
          onSelect={handleSelect}
          searchMode={searchMode}
          bookmarkedIds={bookmarkedIds}
          bookmarkLabels={bookmarkLabels}
          sortOrder={sortOrder}
        />
      )}

      {/* Search bar */}
      {searchMode && (
        <Box marginTop={1}>
          <Text color="yellow">/</Text>
          <TextInput value={filter} onChange={(val) => {
            if (!suppressInputRef.current) {
              setFilter(val);
            }
          }} />
          {searching && <Text color="gray"> searching...</Text>}
        </Box>
      )}

      {/* Bookmark label input */}
      {labelInput && selectedSession && (
        <Box marginTop={1}>
          <Text color="yellow">Label: </Text>
          <TextInput value={labelText} onChange={setLabelText} placeholder="optional — Enter to skip" />
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
              ? "[Tab] browse results  [Esc] cancel"
              : filter
                ? `/${filter}  [/] edit  [Esc] clear  [p] preview  [Enter] resume`
                : getFooterText(view as "sessions" | "projects" | "bookmarks")}
        </Text>
      </Box>

      {/* Demo subtitle */}
      {demo && demoSubtitle && (
        <Box marginTop={1} justifyContent="center">
          <Text color="yellow" bold>{demoSubtitle}</Text>
        </Box>
      )}
    </Box>
  );
}
