import { Box, Text, useInput } from "ink";
import { getKeybindingsForView } from "../lib/keybindings.js";

interface Props {
  onClose: () => void;
}

const VIEWS = ["sessions", "projects", "bookmarks", "preview"] as const;
const VIEW_LABELS: Record<(typeof VIEWS)[number], string> = {
  sessions: "Sessions",
  projects: "Projects",
  bookmarks: "Bookmarks",
  preview: "Preview",
};

export default function Help({ onClose }: Props) {
  useInput((input, key) => {
    if (key.escape || input === "?" || input === "q") {
      onClose();
    }
  });

  return (
    <Box flexDirection="column">
      <Box marginBottom={1}>
        <Text bold color="cyan">
          Help
        </Text>
        <Text dimColor> — Keybindings</Text>
      </Box>

      {VIEWS.map((view) => {
        const bindings = getKeybindingsForView(view).filter(
          (k) => k.views.includes(view),
        );
        if (bindings.length === 0) return null;

        return (
          <Box key={view} flexDirection="column" marginBottom={1}>
            <Text bold color="green">
              {VIEW_LABELS[view]}
            </Text>
            {bindings.map((k) => (
              <Box key={`${view}-${k.key}-${k.action}`}>
                <Text color="cyan">{`  ${k.key.padEnd(16)}`}</Text>
                <Text>{k.action}</Text>
              </Box>
            ))}
          </Box>
        );
      })}

      <Box flexDirection="column" marginBottom={1}>
        <Text bold color="green">
          Global
        </Text>
        {getKeybindingsForView("sessions")
          .filter((k) => k.views.includes("global"))
          .map((k) => (
            <Box key={`global-${k.key}`}>
              <Text color="cyan">{`  ${k.key.padEnd(16)}`}</Text>
              <Text>{k.action}</Text>
            </Box>
          ))}
      </Box>

      <Box marginTop={1}>
        <Text dimColor>[?/Esc] close help</Text>
      </Box>
    </Box>
  );
}
