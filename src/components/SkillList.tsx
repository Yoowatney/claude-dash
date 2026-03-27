import { useState, useEffect } from "react";
import { Box, Text, useInput } from "ink";
import { scanSkills, getSkillContent, editSkill } from "../lib/skills.js";
import type { Skill } from "../lib/skills.js";

interface Props {
  onExit: () => void;
}

export default function SkillList({ onExit }: Props) {
  const [skills, setSkills] = useState<Skill[]>([]);
  const [cursor, setCursor] = useState(0);
  const [preview, setPreview] = useState<string[] | null>(null);
  const [previewScroll, setPreviewScroll] = useState(0);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    scanSkills().then((result) => {
      setSkills(result);
      setLoading(false);
    });
  }, []);

  const termHeight = process.stdout.rows || 24;
  const maxVisible = termHeight - 7;

  useInput((input, key) => {
    if (preview) {
      if (key.escape || input === "p" || input === "q") {
        setPreview(null);
        setPreviewScroll(0);
      }
      if (key.upArrow || input === "k") {
        setPreviewScroll((s) => Math.max(0, s - 1));
      }
      if (key.downArrow || input === "j") {
        setPreviewScroll((s) =>
          Math.min(Math.max(0, preview.length - maxVisible), s + 1),
        );
      }
      if (key.pageUp || input === "u") {
        setPreviewScroll((s) => Math.max(0, s - maxVisible));
      }
      if (key.pageDown || input === "d") {
        setPreviewScroll((s) =>
          Math.min(Math.max(0, preview.length - maxVisible), s + maxVisible),
        );
      }
      if (input === "g") {
        setPreviewScroll(0);
      }
      if (input === "G") {
        setPreviewScroll(Math.max(0, preview.length - maxVisible));
      }
      return;
    }

    if (key.upArrow || input === "k") {
      setCursor((c) => Math.max(0, c - 1));
    }
    if (key.downArrow || input === "j") {
      setCursor((c) => Math.min(skills.length - 1, c + 1));
    }
    if (input === "p" && skills[cursor]) {
      getSkillContent(skills[cursor]).then((content) => {
        setPreview(content.split("\n"));
        setPreviewScroll(0);
      });
    }
    if (input === "e" && skills[cursor]) {
      editSkill(skills[cursor]);
      scanSkills().then(setSkills);
    }
  });

  if (loading) {
    return <Text dimColor>Scanning skills...</Text>;
  }

  if (skills.length === 0) {
    return (
      <Box flexDirection="column">
        <Text dimColor>No skills found in ~/.claude/skills/</Text>
      </Box>
    );
  }

  if (preview) {
    const visible = preview.slice(previewScroll, previewScroll + maxVisible);
    const scrollPct =
      preview.length <= maxVisible
        ? 100
        : Math.round(
            (previewScroll / (preview.length - maxVisible)) * 100,
          );

    return (
      <Box flexDirection="column">
        <Box marginBottom={1}>
          <Text bold color="cyan">
            Skill Preview
          </Text>
          <Text color="green"> {skills[cursor]?.name}</Text>
          <Text dimColor>  {preview.length} lines</Text>
        </Box>

        <Box flexDirection="column">
          {visible.map((line, i) => (
            <Text key={`${previewScroll + i}`} wrap="wrap">
              {line}
            </Text>
          ))}
        </Box>

        <Box marginTop={1}>
          <Text dimColor>
            {scrollPct}% [j/k] line [u/d] page [g/G] top/bottom [p/Esc] back
          </Text>
        </Box>
      </Box>
    );
  }

  return (
    <Box flexDirection="column">
      {skills.map((skill, i) => {
        const selected = i === cursor;
        return (
          <Box key={skill.path}>
            <Text color={selected ? "white" : "gray"} bold={selected}>
              {selected ? "▶ " : "  "}
            </Text>
            <Text color={selected ? "cyan" : "green"} bold={selected}>
              {skill.name.padEnd(24)}
            </Text>
            <Text dimColor>{skill.description.slice(0, 50)}</Text>
          </Box>
        );
      })}
      <Box marginTop={1}>
        <Text dimColor>
          {skills.length} skills | {cursor + 1}/{skills.length}
        </Text>
      </Box>
    </Box>
  );
}
