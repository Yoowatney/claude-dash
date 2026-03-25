import { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { ProjectSummary } from "../lib/scanner.js";

interface Props {
  projects: ProjectSummary[];
  onSelect: (project: ProjectSummary) => void;
  onSelectAll: () => void;
  selectedProject: string | null;
}

export default function ProjectList({
  projects,
  onSelect,
  onSelectAll,
  selectedProject,
}: Props) {
  const [cursor, setCursor] = useState(0);
  // cursor 0 = "All", cursor 1..N = projects
  const totalItems = projects.length + 1;

  useInput((input, key) => {
    if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(totalItems - 1, c + 1));
    }
    if (key.return) {
      if (cursor === 0) {
        onSelectAll();
      } else {
        const project = projects[cursor - 1];
        if (project) onSelect(project);
      }
    }
  });

  return (
    <Box flexDirection="column">
      {/* "All" option */}
      <Box>
        <Text color={cursor === 0 ? "white" : "gray"} bold={cursor === 0}>
          {cursor === 0 ? "▶ " : "  "}
        </Text>
        <Text
          color={!selectedProject ? "cyan" : cursor === 0 ? "white" : "gray"}
          bold={!selectedProject}
        >
          {"All".padEnd(18)}
        </Text>
        <Text>
          {String(
            projects.reduce((a, p) => a + p.sessionCount, 0),
          ).padStart(5)}{" "}
          sessions
        </Text>
      </Box>

      {projects.map((p, i) => {
        const isCursor = i + 1 === cursor;
        const isFiltered = selectedProject === p.name;

        return (
          <Box key={p.name}>
            <Text color={isCursor ? "white" : "gray"} bold={isCursor}>
              {isCursor ? "▶ " : isFiltered ? "● " : "  "}
            </Text>
            <Text
              color={isFiltered ? "cyan" : isCursor ? "white" : "green"}
              bold={isFiltered || isCursor}
            >
              {p.name.padEnd(18)}
            </Text>
            <Text>{String(p.sessionCount).padStart(5)} sessions</Text>
            <Text dimColor>
              {"  "}last: {p.lastActive.toLocaleDateString()}
            </Text>
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          {cursor + 1}/{totalItems}
          {selectedProject ? ` | filtered: ${selectedProject}` : ""}
        </Text>
      </Box>
    </Box>
  );
}
