import { CSSProperties } from "react";
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
  style?: CSSProperties;
}

function basename(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

export function ChangedFilesList({
  files,
  selectedPath,
  onSelectFile,
  style,
}: ChangedFilesListProps) {
  return (
    <div style={style}>
      <div
        style={{
          padding: "8px 10px",
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
        return (
          <div
            key={file.path}
            onClick={() => onSelectFile?.(file)}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              padding: "4px 10px",
              cursor: "pointer",
              background: isSelected ? "rgba(9, 71, 113, 0.55)" : "transparent",
              color: isSelected ? "#ffffff" : "#cccccc",
              fontSize: 12,
            }}
          >
            <FileIcon filename={basename(file.path)} />
            <span
              title={file.path}
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
                fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
              }}
            >
              {file.path}
            </span>
            {file.status && (
              <span style={{ color: getStatusColor(file.status), fontSize: 11, fontWeight: 600 }}>
                {getStatusLetter(file.status)}
              </span>
            )}
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
  );
}
