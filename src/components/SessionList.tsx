import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import type { Session } from "../lib/scanner.js";

interface Props {
  sessions: Session[];
  onSelect: (session: Session) => void;
  onCursorChange: (session: Session) => void;
  filter: string;
}

function timeAgo(date: Date): string {
  const now = Date.now();
  const diff = now - date.getTime();
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);

  if (minutes < 1) return "just now";
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 30) return `${days}d ago`;
  return date.toLocaleDateString();
}

export default function SessionList({
  sessions,
  onSelect,
  onCursorChange,
  filter,
}: Props) {
  const [cursor, setCursor] = useState(0);

  // Reset cursor when sessions change (e.g. filter applied)
  useEffect(() => {
    setCursor(0);
    if (sessions[0]) onCursorChange(sessions[0]);
  }, [sessions.length]);

  useInput((input, key) => {
    if (key.upArrow || (input === "k" && !filter)) {
      setCursor((c) => {
        const next = Math.max(0, c - 1);
        if (sessions[next]) onCursorChange(sessions[next]);
        return next;
      });
    }
    if (key.downArrow || (input === "j" && !filter)) {
      setCursor((c) => {
        const next = Math.min(sessions.length - 1, c + 1);
        if (sessions[next]) onCursorChange(sessions[next]);
        return next;
      });
    }
    if (key.return && sessions[cursor]) {
      onSelect(sessions[cursor]);
    }
  });

  const maxVisible = process.stdout.rows ? process.stdout.rows - 8 : 20;
  const start = Math.max(0, cursor - Math.floor(maxVisible / 2));
  const visible = sessions.slice(start, start + maxVisible);

  if (sessions.length === 0) {
    return (
      <Box>
        <Text dimColor>No sessions found.</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {visible.map((session, i) => {
        const idx = start + i;
        const selected = idx === cursor;
        const projectColor =
          session.project === "work"
            ? "blue"
            : session.project === "munice"
              ? "green"
              : session.project === "gomgom"
                ? "yellow"
                : "cyan";

        return (
          <Box key={session.id}>
            <Text color={selected ? "white" : "gray"} bold={selected}>
              {selected ? "▶ " : "  "}
            </Text>
            <Text color={projectColor} bold>
              {session.project.padEnd(14)}
            </Text>
            <Text color={selected ? "white" : "gray"}>
              {" "}
              {session.firstMessage.slice(0, 50).padEnd(50)}
            </Text>
            <Text dimColor> {timeAgo(session.lastModified).padStart(10)}</Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          {sessions.length} sessions | {cursor + 1}/{sessions.length}
        </Text>
      </Box>
    </Box>
  );
}
