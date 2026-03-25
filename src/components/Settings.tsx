import { useState } from "react";
import { Box, Text, useInput } from "ink";
import type { LaunchMode } from "../lib/launcher.js";
import { loadConfig, saveConfig } from "../lib/launcher.js";

interface Props {
  onClose: () => void;
}

const MODES: { value: LaunchMode; label: string; desc: string }[] = [
  { value: "inline", label: "inline", desc: "Resume in same terminal (default)" },
  { value: "tmux", label: "tmux", desc: "Open new tmux window" },
  { value: "iterm2-tab", label: "iterm2-tab", desc: "Open new iTerm2 tab" },
  { value: "terminal-app", label: "terminal-app", desc: "Open new Terminal.app window" },
  { value: "print", label: "print", desc: "Print command only" },
];

export default function Settings({ onClose }: Props) {
  const config = loadConfig();
  const [cursor, setCursor] = useState(
    MODES.findIndex((m) => m.value === config.launchMode) || 0,
  );

  useInput((input, key) => {
    if (key.escape || input === "s" || input === "q") {
      onClose();
    }
    if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(MODES.length - 1, c + 1));
    }
    if (key.return) {
      const selected = MODES[cursor];
      if (selected) {
        saveConfig({ launchMode: selected.value });
        onClose();
      }
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Settings
        </Text>
      </Box>

      <Box marginBottom={1}>
        <Text bold>Launch Mode</Text>
        <Text dimColor> — how sessions open when you press Enter</Text>
      </Box>

      {MODES.map((mode, i) => {
        const isCursor = i === cursor;
        const isCurrent = mode.value === config.launchMode;

        return (
          <Box key={mode.value}>
            <Text color={isCursor ? "white" : "gray"} bold={isCursor}>
              {isCursor ? "▶ " : "  "}
            </Text>
            <Text
              color={isCurrent ? "cyan" : isCursor ? "white" : "gray"}
              bold={isCurrent}
            >
              {mode.label.padEnd(16)}
            </Text>
            <Text dimColor>{mode.desc}</Text>
            {isCurrent && <Text color="cyan"> (current)</Text>}
          </Box>
        );
      })}

      <Box marginTop={1}>
        <Text dimColor>
          [Enter] select  [j/k] navigate  [s/Esc] back
        </Text>
      </Box>
    </Box>
  );
}
