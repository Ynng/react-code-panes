import { CSSProperties } from "react";
import { DRAG_TYPE, Tab } from "../types";
import { scheduleClearDragTab, setDragTab } from "../utils/dragStore";
import { FileIcon, getStatusColor, getStatusLetter } from "./FileIcon";

export interface ChangedFileItem {
  path: string;
  additions: number;
  deletions: number;
  status?: "added" | "deleted" | "modified" | "renamed";
}

interface ChangedFilesListProps {
  files: ChangedFileItem[];
  selectedPath?: string | null;
  onSelectFile?: (file: ChangedFileItem) => void;
  getDragTab?: (file: ChangedFileItem) => Tab | null;
  style?: CSSProperties;
}

function basename(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function dirname(path: string) {
  const parts = path.split("/").filter(Boolean);
  if (parts.length <= 1) return "";
  return parts.slice(0, -1).join("/");
}

export function ChangedFilesList({
  files,
  selectedPath,
  onSelectFile,
  getDragTab,
  style,
}: ChangedFilesListProps) {
  return (
    <div style={style}>
      <div
        style={{
          padding: "6px 10px 4px",
          fontSize: 11,
          textTransform: "uppercase",
          letterSpacing: "0.06em",
          color: "#858585",
        }}
      >
        {files.length} files changed
      </div>
      {files.map((file) => {
        const isSelected = file.path === selectedPath;
        const name = basename(file.path);
        const parent = dirname(file.path);
        return (
          <div
            key={file.path}
            draggable={!!getDragTab}
            onClick={() => onSelectFile?.(file)}
            onDragStart={(event) => {
              if (!getDragTab) return;
              const tab = getDragTab(file);
              if (!tab) return;
              setDragTab(tab);
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData("text/plain", tab.id);
              event.dataTransfer.setData(
                DRAG_TYPE,
                JSON.stringify({ type: "sidebar-file", tabId: tab.id }),
              );
            }}
            onDragEnd={() => {
              scheduleClearDragTab();
            }}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              height: 22,
              padding: "0 10px",
              cursor: "pointer",
              background: isSelected ? "rgba(9, 71, 113, 0.55)" : "transparent",
              color: isSelected ? "#ffffff" : "#cccccc",
              fontSize: 12,
              userSelect: "none",
            }}
          >
            <FileIcon filename={name} />
            <div
              style={{
                minWidth: 0,
                flex: 1,
                display: "flex",
                alignItems: "baseline",
                gap: 6,
              }}
            >
              <span
                title={file.path}
                style={{
                  minWidth: 0,
                  overflow: "hidden",
                  textOverflow: "ellipsis",
                  whiteSpace: "nowrap",
                  flexShrink: 1,
                }}
              >
                {name}
              </span>
              {parent && (
                <span
                  title={parent}
                  style={{
                    minWidth: 0,
                    overflow: "hidden",
                    textOverflow: "ellipsis",
                    whiteSpace: "nowrap",
                    flex: 1,
                    color: isSelected ? "rgba(255,255,255,0.72)" : "#8b949e",
                    fontSize: 11,
                  }}
                >
                  {parent}
                </span>
              )}
            </div>
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--mosaic-font-family-mono)",
                flexShrink: 0,
              }}
            >
              {file.additions > 0 && <span style={{ color: "#4ec9b0" }}>+{file.additions}</span>}
              {file.deletions > 0 && <span style={{ color: "#f14c4c", marginLeft: 4 }}>-{file.deletions}</span>}
            </span>
            {file.status && (
              <span
                style={{
                  color: getStatusColor(file.status),
                  fontSize: 11,
                  fontWeight: 600,
                  width: 12,
                  textAlign: "center",
                  flexShrink: 0,
                }}
              >
                {getStatusLetter(file.status)}
              </span>
            )}
          </div>
        );
      })}
    </div>
  );
}
