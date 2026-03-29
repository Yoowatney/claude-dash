import { useState } from "react";
import { useInput } from "ink";

interface ScrollableOptions {
  totalLines: number;
  maxVisible: number;
  onClose: () => void;
  onSelect?: () => void;
  active?: boolean;
}

export function useScrollable({ totalLines, maxVisible, onClose, onSelect, active = true }: ScrollableOptions) {
  const [scroll, setScroll] = useState(0);

  const maxScroll = Math.max(0, totalLines - maxVisible);

  useInput((input, key) => {
    if (!active) return;
    if (key.escape || input === "p" || input === "q") {
      onClose();
    }
    if (key.upArrow || input === "k") {
      setScroll((s) => Math.max(0, s - 1));
    }
    if (key.downArrow || input === "j") {
      setScroll((s) => Math.min(maxScroll, s + 1));
    }
    if (key.pageUp || input === "u") {
      setScroll((s) => Math.max(0, s - maxVisible));
    }
    if (key.pageDown || input === "d") {
      setScroll((s) => Math.min(maxScroll, s + maxVisible));
    }
    if (input === "g") {
      setScroll(0);
    }
    if (input === "G") {
      setScroll(maxScroll);
    }
    if (key.return && onSelect) {
      onSelect();
    }
  });

  const scrollPct =
    totalLines <= maxVisible
      ? 100
      : Math.round((scroll / maxScroll) * 100);

  return { scroll, scrollPct, resetScroll: () => setScroll(0) };
}
