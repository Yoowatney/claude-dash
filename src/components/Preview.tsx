import { useState, useEffect, useMemo } from "react";
import { Box, Text } from "ink";
import { getSessionPreview } from "../lib/scanner.js";
import { useScrollable } from "../hooks/useScrollable.js";
import type { Session, PreviewMessage } from "../lib/scanner.js";

interface Props {
  session: Session;
  onClose: () => void;
  onSelect?: (session: Session) => void;
  demoData?: PreviewMessage[];
}

function wrapText(text: string, width: number): string[] {
  const result: string[] = [];
  for (const paragraph of text.split("\n")) {
    if (paragraph.length <= width) {
      result.push(paragraph);
      continue;
    }
    let remaining = paragraph;
    while (remaining.length > width) {
      let breakAt = remaining.lastIndexOf(" ", width);
      if (breakAt <= 0) breakAt = width;
      result.push(remaining.slice(0, breakAt));
      remaining = remaining.slice(breakAt).trimStart();
    }
    if (remaining) result.push(remaining);
  }
  return result;
}

interface DisplayLine {
  role: "user" | "assistant" | "separator";
  text: string;
  isFirstLine: boolean;
}

function buildDisplayLines(
  messages: PreviewMessage[],
  width: number,
): DisplayLine[] {
  const lines: DisplayLine[] = [];
  const contentWidth = width - 6; // padding for "You: " / "AI:  "

  for (let i = 0; i < messages.length; i++) {
    const msg = messages[i];
    const wrapped = wrapText(msg.text, Math.max(contentWidth, 40));

    wrapped.forEach((line, j) => {
      lines.push({
        role: msg.role,
        text: line,
        isFirstLine: j === 0,
      });
    });

    if (i < messages.length - 1) {
      lines.push({ role: "separator", text: "", isFirstLine: false });
    }
  }
  return lines;
}

export default function Preview({ session, onClose, onSelect, demoData }: Props) {
  const [messages, setMessages] = useState<PreviewMessage[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (demoData) {
      setMessages(demoData);
      setLoading(false);
      return;
    }
    setLoading(true);
    getSessionPreview(session.id, session.project).then((result) => {
      setMessages(result);
      setLoading(false);
    });
  }, [session.id, session.project, demoData]);

  const termWidth = process.stdout.columns || 80;
  const termHeight = process.stdout.rows || 24;
  const maxVisible = termHeight - 7;

  const displayLines = useMemo(
    () => buildDisplayLines(messages, termWidth - 4),
    [messages, termWidth],
  );

  const { scroll, scrollPct } = useScrollable({
    totalLines: displayLines.length,
    maxVisible,
    onClose,
    onSelect: onSelect ? () => onSelect(session) : undefined,
  });

  const visible = displayLines.slice(scroll, scroll + maxVisible);

  if (loading) {
    return (
      <Box flexDirection="column">
        <Text color="cyan">Loading preview...</Text>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {/* Header */}
      <Box>
        <Text bold color="cyan">
          Preview
        </Text>
        <Text color="green"> {session.project}</Text>
        <Text dimColor> {session.id.slice(0, 8)}...</Text>
        <Text dimColor>
          {"  "}{messages.length} messages
        </Text>
      </Box>

      <Box marginTop={1} flexDirection="column">
        {visible.map((line, i) => {
          if (line.role === "separator") {
            return (
              <Text key={`sep-${scroll + i}`} dimColor>
                {"─".repeat(Math.min(termWidth - 4, 60))}
              </Text>
            );
          }

          const prefix = line.isFirstLine
            ? line.role === "user"
              ? "You: "
              : "AI:  "
            : "     ";

          return (
            <Box key={`${scroll + i}`}>
              <Text
                color={line.role === "user" ? "green" : "white"}
                bold={line.role === "user" && line.isFirstLine}
                dimColor={line.role === "assistant"}
              >
                {prefix}
              </Text>
              <Text
                color={line.role === "user" ? "green" : "white"}
                wrap="wrap"
              >
                {line.text}
              </Text>
            </Box>
          );
        })}
      </Box>

      {/* Footer */}
      <Box marginTop={1}>
        <Text dimColor>
          {scrollPct}% [j/k] line [u/d] page [g/G] top/bottom [Enter] resume [p/Esc] back
        </Text>
      </Box>
    </Box>
  );
}
