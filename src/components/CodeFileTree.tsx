import { CSSProperties, ReactNode, useMemo, useState } from "react";
import { DRAG_TYPE, Tab } from "../types";
import { scheduleClearDragTab, setDragTab } from "../utils/dragStore";
import { FileIcon, FolderIcon, getStatusColor, getStatusLetter } from "./FileIcon";

export interface CodeFileTreeItem {
  path: string;
  type: "file" | "folder";
  children?: CodeFileTreeItem[];
  iconFilename?: string;
  title?: string;
  status?: "added" | "deleted" | "modified" | "renamed";
  trailing?: ReactNode;
}

interface CodeFileTreeProps {
  items: CodeFileTreeItem[];
  selectedPath?: string | null;
  defaultExpandedPaths?: string[];
  /** Single-click: open as preview tab. */
  onOpenFile?: (item: CodeFileTreeItem) => void;
  /** Double-click: open as pinned (non-preview) tab. */
  onPinFile?: (item: CodeFileTreeItem) => void;
  getDragTab?: (item: CodeFileTreeItem) => Tab | null;
  style?: CSSProperties;
}

function basename(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function Chevron({ open }: { open: boolean }) {
  return (
    <svg width="16" height="16" viewBox="0 0 16 16" fill="none" aria-hidden="true">
      <path
        d={open ? "M4 6l4 4 4-4" : "M6 4l4 4-4 4"}
        stroke="currentColor"
        strokeWidth="1.35"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function collectDefaultExpanded(items: CodeFileTreeItem[], expanded: Set<string>) {
  for (const item of items) {
    if (item.type === "folder" && item.children?.length) {
      expanded.add(item.path);
      collectDefaultExpanded(item.children, expanded);
    }
  }
}

export function CodeFileTree({
  items,
  selectedPath,
  defaultExpandedPaths,
  onOpenFile,
  onPinFile,
  getDragTab,
  style,
}: CodeFileTreeProps) {
  const initialExpanded = useMemo(() => {
    if (defaultExpandedPaths?.length) return new Set(defaultExpandedPaths);
    const expanded = new Set<string>();
    collectDefaultExpanded(items, expanded);
    return expanded;
  }, [defaultExpandedPaths, items]);
  const [expandedPaths, setExpandedPaths] = useState(initialExpanded);

  function toggleFolder(path: string) {
    setExpandedPaths((prev) => {
      const next = new Set(prev);
      if (next.has(path)) next.delete(path);
      else next.add(path);
      return next;
    });
  }

  function renderItems(nodes: CodeFileTreeItem[], depth: number): ReactNode {
    return nodes.map((item) => {
      const isFolder = item.type === "folder";
      const isExpanded = expandedPaths.has(item.path);
      const isSelected = item.path === selectedPath;
      const paddingLeft = 8 + depth * 8;

      return (
        <div key={item.path}>
          <div
            draggable={!isFolder && !!getDragTab}
            onClick={() => {
              if (isFolder) toggleFolder(item.path);
              else onOpenFile?.(item);
            }}
            onDoubleClick={() => {
              if (!isFolder) onPinFile?.(item);
            }}
            onDragStart={(event) => {
              if (!getDragTab || isFolder) return;
              const tab = getDragTab(item);
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
              padding: `0 10px 0 ${paddingLeft}px`,
              cursor: "pointer",
              userSelect: "none",
              background: isSelected ? "rgba(9, 71, 113, 0.55)" : "transparent",
              color: isSelected ? "#ffffff" : "#cccccc",
              fontSize: 12,
            }}
          >
            <span
              style={{
                width: 16,
                color: "#858585",
                display: "inline-flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              {isFolder ? <Chevron open={isExpanded} /> : null}
            </span>
            {isFolder ? (
              <FolderIcon open={isExpanded} name={item.title ?? basename(item.path)} />
            ) : (
              <FileIcon filename={item.iconFilename ?? basename(item.path)} />
            )}
            <span
              title={item.path}
              style={{
                minWidth: 0,
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
                flex: 1,
              }}
            >
              {item.title ?? basename(item.path)}
            </span>
            {item.status && (
              <span
                style={{
                  color: getStatusColor(item.status),
                  fontSize: 11,
                  fontWeight: 600,
                  flexShrink: 0,
                }}
              >
                {getStatusLetter(item.status)}
              </span>
            )}
            {item.trailing}
          </div>
          {isFolder && isExpanded && item.children && renderItems(item.children, depth + 1)}
        </div>
      );
    });
  }

  return <div style={style}>{renderItems(items, 0)}</div>;
}
