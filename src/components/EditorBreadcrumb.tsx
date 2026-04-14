import { ReactNode } from "react";
import { FileIcon } from "./FileIcon";

function BreadcrumbChevron() {
  return (
    <svg width="10" height="10" viewBox="0 0 16 16" fill="#6e6e6e" style={{ flexShrink: 0 }}>
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

interface EditorBreadcrumbProps {
  filePath: string;
  children: ReactNode;
}

export function EditorBreadcrumb({ filePath, children }: EditorBreadcrumbProps) {
  const segments = filePath.split("/").filter(Boolean);
  const filename = segments[segments.length - 1] ?? filePath;
  const folders = segments.slice(0, -1);

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "100%" }}>
      <div
        style={{
          display: "flex",
          alignItems: "center",
          height: 22,
          flexShrink: 0,
          background: "var(--mosaic-editor-bg)",
          borderBottom: "1px solid rgba(60, 60, 60, 0.7)",
          padding: "0 10px",
          overflow: "hidden",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 2,
            minWidth: 0,
            overflow: "hidden",
            fontSize: 11,
            color: "#858585",
          }}
        >
          {folders.map((folder, index) => (
            <span
              key={`${folder}-${index}`}
              style={{ display: "flex", alignItems: "center", gap: 2, flexShrink: 0 }}
            >
              <span style={{ maxWidth: 120, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
                {folder}
              </span>
              <BreadcrumbChevron />
            </span>
          ))}
          <span style={{ display: "flex", alignItems: "center", gap: 6, minWidth: 0, color: "#cccccc" }}>
            <FileIcon filename={filename} />
            <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{filename}</span>
          </span>
        </div>
      </div>
      <div style={{ flex: 1, minHeight: 0 }}>{children}</div>
    </div>
  );
}
