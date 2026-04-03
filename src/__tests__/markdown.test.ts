import { describe, it, expect } from "vitest";

// Test the markdown parsing helpers directly
// These are the same functions used in Preview.tsx

function isTableSeparator(line: string): boolean {
  return /^\|[\s-:|]+\|$/.test(line.trim());
}

function isTableRow(line: string): boolean {
  return /^\|.*\|$/.test(line.trim());
}

function parseTableCells(line: string): string[] {
  return line
    .trim()
    .replace(/^\||\|$/g, "")
    .split("|")
    .map((c) => c.trim());
}

function stripInlineMarkdown(text: string): string {
  text = text.replace(/\*\*([^*]+)\*\*/g, "$1");
  return text;
}

describe("stripInlineMarkdown", () => {
  it("removes **bold**", () => {
    expect(stripInlineMarkdown("hello **world**")).toBe("hello world");
  });

  it("removes multiple **bold** segments", () => {
    expect(stripInlineMarkdown("**a** and **b**")).toBe("a and b");
  });

  it("leaves normal text untouched", () => {
    expect(stripInlineMarkdown("no markdown here")).toBe("no markdown here");
  });

  it("handles **bold** inside table cells", () => {
    expect(stripInlineMarkdown("| **np (로컬)** | 로컬 CLI |")).toBe(
      "| np (로컬) | 로컬 CLI |",
    );
  });

  it("preserves single asterisks", () => {
    expect(stripInlineMarkdown("v* 태그")).toBe("v* 태그");
  });
});

describe("isTableRow", () => {
  it("detects table rows", () => {
    expect(isTableRow("| a | b | c |")).toBe(true);
    expect(isTableRow("| 패턴 | 트리거 | Provenance |")).toBe(true);
  });

  it("rejects non-table lines", () => {
    expect(isTableRow("not a table")).toBe(false);
    expect(isTableRow("| only one side")).toBe(false);
    expect(isTableRow("")).toBe(false);
  });

  it("handles whitespace", () => {
    expect(isTableRow("  | a | b |  ")).toBe(true);
  });
});

describe("isTableSeparator", () => {
  it("detects separator rows", () => {
    expect(isTableSeparator("|---|---|")).toBe(true);
    expect(isTableSeparator("| --- | --- |")).toBe(true);
    expect(isTableSeparator("|:---:|---:|")).toBe(true);
    expect(isTableSeparator("|---------|----------|")).toBe(true);
  });

  it("rejects data rows", () => {
    expect(isTableSeparator("| hello | world |")).toBe(false);
    expect(isTableSeparator("| 패턴 | 트리거 |")).toBe(false);
  });
});

describe("parseTableCells", () => {
  it("parses cells", () => {
    expect(parseTableCells("| a | b | c |")).toEqual(["a", "b", "c"]);
  });

  it("trims whitespace", () => {
    expect(parseTableCells("|  hello  |  world  |")).toEqual([
      "hello",
      "world",
    ]);
  });

  it("handles Korean text", () => {
    expect(parseTableCells("| 패턴 | 트리거 | Provenance |")).toEqual([
      "패턴",
      "트리거",
      "Provenance",
    ]);
  });

  it("handles empty cells", () => {
    expect(parseTableCells("| a | | c |")).toEqual(["a", "", "c"]);
  });
});

describe("heading detection", () => {
  it("matches h1-h6", () => {
    const re = /^(#{1,6})\s+(.*)/;
    expect("# Title".match(re)?.[2]).toBe("Title");
    expect("## Subtitle".match(re)?.[2]).toBe("Subtitle");
    expect("### H3".match(re)?.[2]).toBe("H3");
    expect("###### H6".match(re)?.[2]).toBe("H6");
  });

  it("rejects non-headings", () => {
    const re = /^(#{1,6})\s+(.*)/;
    expect("##NoSpace".match(re)).toBeNull();
    expect("not a heading".match(re)).toBeNull();
    expect("#".match(re)).toBeNull();
  });
});

describe("code fence detection", () => {
  it("detects code fences", () => {
    expect("```".trimStart().startsWith("```")).toBe(true);
    expect("```js".trimStart().startsWith("```")).toBe(true);
    expect("  ```".trimStart().startsWith("```")).toBe(true);
  });

  it("rejects non-fences", () => {
    expect("`` not a fence".trimStart().startsWith("```")).toBe(false);
    expect("normal text".trimStart().startsWith("```")).toBe(false);
  });
});
