export interface ParsedUnifiedDiffLine {
  type: "hunk" | "context" | "add" | "delete";
  text: string;
  oldLine: number | null;
  newLine: number | null;
}

export interface ParsedUnifiedDiffFile {
  name: string;
  additions: number;
  deletions: number;
  patch: string;
  lines: ParsedUnifiedDiffLine[];
}

export function parseUnifiedDiffFiles(diff: string): ParsedUnifiedDiffFile[] {
  const parts = diff.split(/(?=^diff --git )/m).filter((part) => part.trim().length > 0);

  return parts.map((part) => {
    const headerMatch = part.match(/^diff --git a\/(.+?) b\/(.+)$/m);
    const name = headerMatch?.[2] ?? "unknown";
    let additions = 0;
    let deletions = 0;
    const lines: ParsedUnifiedDiffLine[] = [];
    let oldLine = 0;
    let newLine = 0;
    let inHunk = false;

    for (const rawLine of part.split("\n")) {
      if (rawLine.startsWith("@@")) {
        const hunkMatch = rawLine.match(/^@@ -(\d+)(?:,\d+)? \+(\d+)(?:,\d+)? @@/);
        oldLine = hunkMatch ? Number(hunkMatch[1]) : oldLine;
        newLine = hunkMatch ? Number(hunkMatch[2]) : newLine;
        lines.push({ type: "hunk", text: rawLine, oldLine: null, newLine: null });
        inHunk = true;
        continue;
      }

      if (!inHunk) continue;
      if (rawLine.startsWith("+++ ") || rawLine.startsWith("--- ")) continue;

      if (rawLine.startsWith("+")) {
        additions += 1;
        lines.push({ type: "add", text: rawLine.slice(1), oldLine: null, newLine });
        newLine += 1;
        continue;
      }

      if (rawLine.startsWith("-")) {
        deletions += 1;
        lines.push({ type: "delete", text: rawLine.slice(1), oldLine, newLine: null });
        oldLine += 1;
        continue;
      }

      const text = rawLine.startsWith(" ") ? rawLine.slice(1) : rawLine;
      lines.push({ type: "context", text, oldLine, newLine });
      oldLine += 1;
      newLine += 1;
    }

    return { name, additions, deletions, patch: part, lines };
  });
}
