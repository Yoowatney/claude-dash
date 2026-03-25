import { useState, useEffect } from "react";
import { Box, Text, useApp, useInput } from "ink";
import TextInput from "ink-text-input";
import SessionList from "./components/SessionList.js";
import ProjectList from "./components/ProjectList.js";
import Preview from "./components/Preview.js";
import { scanSessions, groupByProject } from "./lib/scanner.js";
import { resumeSession } from "./lib/launcher.js";
import type { Session, ProjectSummary } from "./lib/scanner.js";

type View = "sessions" | "projects";

export default function App() {
  const { exit } = useApp();
  const [sessions, setSessions] = useState<Session[]>([]);
  const [projects, setProjects] = useState<ProjectSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const [view, setView] = useState<View>("sessions");
  const [searchMode, setSearchMode] = useState(false);
  const [filter, setFilter] = useState("");
  const [selectedSession, setSelectedSession] = useState<Session | null>(null);
  const [showPreview, setShowPreview] = useState(false);
  const [projectFilter, setProjectFilter] = useState<string | null>(null);

  useEffect(() => {
    scanSessions().then((result) => {
      setSessions(result);
      setProjects(groupByProject(result));
      setLoading(false);
      if (result.length > 0) setSelectedSession(result[0]);
    });
  }, []);

  const filteredSessions = projectFilter
    ? sessions.filter((s) => s.project === projectFilter)
    : sessions;

  useInput((input, key) => {
    if (searchMode) {
      if (key.escape) {
        setSearchMode(false);
        setFilter("");
      }
      return;
    }

    if (showPreview) {
      if (key.escape || input === "q" || input === "p") {
        setShowPreview(false);
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
    if (key.tab) {
      setView((v) => (v === "sessions" ? "projects" : "sessions"));
    }
    if (input === "p" && selectedSession && view === "sessions") {
      setShowPreview(true);
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
      // Already filtered — clear filter
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
          {projectFilter ? `/${sessions.length}` : ""} sessions,{" "}
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
        {projectFilter && (
          <Text color="yellow"> ~ {projectFilter}</Text>
        )}
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
        />
      )}

      {/* Search bar */}
      {searchMode && (
        <Box marginTop={1}>
          <Text color="yellow">/</Text>
          <TextInput value={filter} onChange={setFilter} />
        </Box>
      )}

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {searchMode
            ? "[Esc] cancel search"
            : view === "sessions"
              ? projectFilter
                ? "[Enter] resume  [p] preview  [/] search  [Tab] projects  [q] clear filter"
                : "[Enter] resume  [p] preview  [/] search  [Tab] projects  [j/k] navigate  [q] quit"
              : "[Enter] filter  [Tab] sessions  [j/k] navigate  [q] quit"}
        </Text>
      </Box>
    </Box>
  );
}
