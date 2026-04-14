import { useMemo, useRef, useState } from "react";
import { FileIcon } from "./FileIcon";
import {
  parseUnifiedDiffFiles,
  type ParsedUnifiedDiffLine,
} from "../utils/unifiedDiff";

function rowColors(type: ParsedUnifiedDiffLine["type"]) {
  switch (type) {
    case "add":
      return { bg: "rgba(46, 160, 67, 0.16)", gutter: "#4ec9b0", sign: "+" };
    case "delete":
      return { bg: "rgba(248, 81, 73, 0.16)", gutter: "#f14c4c", sign: "-" };
    case "hunk":
      return { bg: "#252526", gutter: "#7f8ea3", sign: "@" };
    default:
      return { bg: "transparent", gutter: "#6b7280", sign: " " };
  }
}

interface UnifiedDiffPreviewProps {
  diff: string | null;
}

export function UnifiedDiffPreview({ diff }: UnifiedDiffPreviewProps) {
  const [collapsedFiles, setCollapsedFiles] = useState<Set<string>>(new Set());
  const fileRefs = useRef<Map<string, HTMLDivElement>>(new Map());
  const files = useMemo(() => (diff ? parseUnifiedDiffFiles(diff) : []), [diff]);

  if (!diff) {
    return <div style={{ padding: 16, color: "#858585", fontSize: 13 }}>No diff available</div>;
  }

  function toggleCollapse(name: string) {
    setCollapsedFiles((prev) => {
      const next = new Set(prev);
      if (next.has(name)) next.delete(name);
      else next.add(name);
      return next;
    });
  }

  function scrollToFile(name: string) {
    fileRefs.current.get(name)?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  return (
    <div style={{ display: "flex", height: "100%", minHeight: 0 }}>
      <div
        style={{
          width: 240,
          flexShrink: 0,
          borderRight: "1px solid #3c3c3c",
          background: "#252526",
          overflowY: "auto",
        }}
      >
        <div style={{ padding: "8px 10px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.06em", color: "#858585" }}>
          {files.length} files changed
        </div>
        {files.map((file) => {
          const isCollapsed = collapsedFiles.has(file.name);
          return (
            <div
              key={file.name}
              onClick={() => scrollToFile(file.name)}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                padding: "5px 10px",
                cursor: "pointer",
                color: "#cccccc",
                background: "transparent",
              }}
            >
              <button
                onClick={(event) => {
                  event.stopPropagation();
                  toggleCollapse(file.name);
                }}
                style={{
                  border: "none",
                  background: "transparent",
                  color: "#858585",
                  width: 14,
                  padding: 0,
                  cursor: "pointer",
                  flexShrink: 0,
                }}
              >
                {isCollapsed ? "▶" : "▼"}
              </button>
              <FileIcon filename={file.name.split("/").pop() ?? file.name} />
              <span
                title={file.name}
                style={{
                  flex: 1,
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  fontSize: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  textDecoration: isCollapsed ? "line-through" : "none",
                  opacity: isCollapsed ? 0.7 : 1,
                }}
              >
                {file.name}
              </span>
              <span
                style={{
                  fontSize: 11,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                  flexShrink: 0,
                }}
              >
                {file.additions > 0 && <span style={{ color: "#4ec9b0" }}>+{file.additions}</span>}
                {file.deletions > 0 && <span style={{ color: "#f14c4c", marginLeft: 4 }}>-{file.deletions}</span>}
              </span>
            </div>
          );
        })}
      </div>

      <div style={{ flex: 1, minWidth: 0, overflow: "auto", background: "#1e1e1e" }}>
        {files.map((file) => {
          const isCollapsed = collapsedFiles.has(file.name);
          return (
            <div
              key={file.name}
              ref={(element) => {
                if (element) fileRefs.current.set(file.name, element);
              }}
              style={{ borderBottom: "1px solid #3c3c3c" }}
            >
              <div
                onClick={() => toggleCollapse(file.name)}
                style={{
                  display: "flex",
                  alignItems: "center",
                  gap: 8,
                  padding: "7px 12px",
                  background: "#252526",
                  color: "#cccccc",
                  cursor: "pointer",
                  borderBottom: "1px solid #3c3c3c",
                  fontSize: 12,
                  fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                }}
              >
                <span style={{ color: "#858585", width: 10 }}>{isCollapsed ? "▶" : "▼"}</span>
                <FileIcon filename={file.name.split("/").pop() ?? file.name} />
                <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</span>
              </div>
              {!isCollapsed && (
                <div>
                  {file.lines.map((line, index) => {
                    const colors = rowColors(line.type);
                    const lineNumberStyle = {
                      width: 48,
                      flexShrink: 0,
                      padding: "0 10px",
                      textAlign: "right" as const,
                      color: colors.gutter,
                      fontVariantNumeric: "tabular-nums",
                    };

                    return (
                      <div
                        key={`${file.name}-${index}`}
                        style={{
                          display: "flex",
                          alignItems: "stretch",
                          minHeight: 20,
                          background: colors.bg,
                          fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
                          fontSize: 12,
                          color: line.type === "hunk" ? "#9fb1c9" : "#d4d4d4",
                        }}
                      >
                        <span style={lineNumberStyle}>{line.type === "hunk" ? "" : line.oldLine ?? ""}</span>
                        <span style={lineNumberStyle}>{line.type === "hunk" ? "" : line.newLine ?? ""}</span>
                        <span style={{ width: 20, flexShrink: 0, color: colors.gutter, textAlign: "center" }}>{colors.sign}</span>
                        <code style={{ margin: 0, padding: "2px 12px 2px 0", whiteSpace: "pre-wrap", wordBreak: "break-word", flex: 1 }}>
                          {line.text || " "}
                        </code>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
