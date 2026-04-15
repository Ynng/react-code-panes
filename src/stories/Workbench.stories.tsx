import type { Meta, StoryObj } from "@storybook/react";
import { CSSProperties, ReactNode, useMemo, useState } from "react";
import "@vscode/codicons/dist/codicon.css";
import "./tailwind-story.css";
import type { ActivityBarItem } from "../components/ActivityBar";
import {
  AgentTraceViewer,
  ChangedFilesList,
  CodeFileTree,
  CodeFileTreeItem,
  EditorBreadcrumb,
  FileIcon,
  getStatusColor,
  getStatusLetter,
  DRAG_TYPE,
  MonacoCodeViewer,
  MonacoDiffViewer,
  PanelTab,
  SidebarSection,
  Tab,
  UnifiedDiffPreview,
  Workbench,
  WorkbenchState,
  TabFactory,
  createBranch,
  createLeaf,
  useWorkbench,
  useActiveWorkbenchGroupId,
  useWorkbenchActions,
} from "../index";
import { clearDragTab, setDragTab } from "../utils/dragStore";
import {
  exampleDiffFiles,
  exampleFileTree,
  exampleFiles,
  getExampleDiffFile,
  getExampleFileById,
  getExampleFileByPath,
  getTraceSampleById,
  getTraceSampleByPath,
  traceFileTree,
  traceSamples,
  workspaceUnifiedDiff,
} from "./exampleData";

const stageStyle: CSSProperties = {
  minHeight: "100vh",
  padding: 16,
  boxSizing: "border-box",
  background: "#111111",
};

const frameStyle: CSSProperties = {
  width: "min(1480px, calc(100vw - 32px))",
  height: 860,
  margin: "0 auto",
  border: "1px solid #2d2d30",
  overflow: "hidden",
  background: "#1e1e1e",
  boxShadow: "0 22px 54px rgba(0, 0, 0, 0.34)",
};

function basename(path: string) {
  const parts = path.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function ExplorerIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M3 7V17C3 18.1 3.9 19 5 19H19C20.1 19 21 18.1 21 17V9C21 7.9 20.1 7 19 7H11L9 5H5C3.9 5 3 5.9 3 7Z" />
    </svg>
  );
}

function SearchIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="11" cy="11" r="7" />
      <path d="M16 16L21 21" />
    </svg>
  );
}

function GitIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <circle cx="12" cy="6" r="2" />
      <circle cx="12" cy="18" r="2" />
      <circle cx="18" cy="12" r="2" />
      <path d="M12 8V16" />
      <path d="M12 8C12 10 14 12 16 12" />
    </svg>
  );
}

function TraceIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <path d="M4 6H20" />
      <path d="M4 12H12" />
      <path d="M4 18H16" />
      <circle cx="17" cy="18" r="3" />
    </svg>
  );
}

function SectionActionLabel({ children }: { children: ReactNode }) {
  return (
    <span
      style={{
        fontSize: 10,
        letterSpacing: "0.04em",
        textTransform: "uppercase",
        color: "var(--mosaic-sidebar-header-fg)",
      }}
    >
      {children}
    </span>
  );
}

function HeaderIconButton({
  active,
  title,
  onClick,
  iconClass,
}: {
  active?: boolean;
  title: string;
  onClick: () => void;
  iconClass: string;
}) {
  return (
    <button
      type="button"
      title={title}
      aria-label={title}
      onClick={onClick}
      draggable={false}
      onMouseDown={(event) => event.stopPropagation()}
      onPointerDown={(event) => event.stopPropagation()}
      onDragStart={(event) => event.preventDefault()}
      style={{
        width: 22,
        height: 22,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        border: "none",
        background: active ? "rgba(255, 255, 255, 0.08)" : "transparent",
        color: active ? "var(--mosaic-sidebar-fg)" : "var(--mosaic-sidebar-header-fg)",
        cursor: "pointer",
        padding: 0,
      }}
    >
      <span className={`codicon ${iconClass}`} style={{ fontSize: 14, lineHeight: 1 }} />
    </button>
  );
}

function getChangedStatusColor(status?: "added" | "deleted" | "modified" | "renamed") {
  return status ? getStatusColor(status) : undefined;
}

function getChangedFileDiffTitle(path: string, status?: "added" | "deleted" | "modified" | "renamed") {
  const name = basename(path);
  const letter = status ? getStatusLetter(status) : "";
  return letter ? `${letter} ${name} (Diff)` : `${name} (Diff)`;
}

function createCodeTab(
  fileId: string,
  options?: {
    title?: string;
    labelColor?: string;
  },
): Tab {
  const file = getExampleFileById(fileId);
  if (!file) {
    return {
      id: fileId,
      title: options?.title ?? fileId,
      content: <div style={{ padding: 16 }}>Missing example file: {fileId}</div>,
    };
  }

  return {
    id: file.id,
    title: options?.title ?? file.id,
    icon: <FileIcon filename={file.id} />,
    labelColor: options?.labelColor,
    content: (
      <EditorBreadcrumb filePath={file.path}>
        <MonacoCodeViewer value={file.content} language={file.language} path={file.path} />
      </EditorBreadcrumb>
    ),
  };
}

function createDiffOverviewTab(): Tab {
  return {
    id: "workspace.diff",
    title: "changes.patch",
    icon: <FileIcon filename="changes.patch" />,
    content: (
      <EditorBreadcrumb filePath="workspace/changes.patch">
        <UnifiedDiffPreview diff={workspaceUnifiedDiff} />
      </EditorBreadcrumb>
    ),
  };
}

function createDiffFileTab(path: string): Tab {
  const diffFile = getExampleDiffFile(path);
  const title = basename(path);
  if (!diffFile) {
    return {
      id: `${path}.diff`,
      title,
      icon: <FileIcon filename={title} />,
      content: <div style={{ padding: 16 }}>Missing diff fixture: {path}</div>,
    };
  }

  return {
    id: `${path}.diff`,
    title: getChangedFileDiffTitle(path, diffFile.status),
    icon: <FileIcon filename={title} />,
    labelColor: getChangedStatusColor(diffFile.status),
    content: (
      <EditorBreadcrumb filePath={path}>
        <MonacoDiffViewer
          original={diffFile.original}
          modified={diffFile.modified}
          language={diffFile.language}
          path={path}
        />
      </EditorBreadcrumb>
    ),
  };
}

function createTraceTab(id: string): Tab {
  const sample = getTraceSampleById(id);
  if (!sample) {
    return {
      id,
      title: id,
      content: <div style={{ padding: 16 }}>Missing trace fixture: {id}</div>,
    };
  }

  return {
    id: sample.id,
    title: sample.id,
    icon: <FileIcon filename={sample.id} />,
    content: <AgentTraceViewer turns={sample.turns} label={sample.title} />,
  };
}

const outlineByFileId: Record<string, string[]> = {
  "App.tsx": ["App()", "app-shell", "app-header", "TaskList", "StatusBar"],
  "index.ts": ["App", "TaskList", "StatusBar", "buildNavTabs"],
  "TaskList.tsx": ["rows", "TaskList()", "task-card", "task-row"],
  "StatusBar.tsx": ["Props", "StatusBar()", "StatusToolbar", "StatusRow"],
  "FileTree.tsx": ["FileTree()", "file-tree-row", "file-tree-label", "file-tree-status"],
  "server.py": ["TaskRequest", "create_task(request)"],
  "app.css": [".status-bar", ".status-toolbar", ".file-tree-row"],
  "workspace.diff": [
    "StatusBar.tsx",
    "FileTree.tsx",
    "app.css",
  ],
};

function findActiveTabId(state: WorkbenchState) {
  const activeGroupId = state.activeGroupId;
  if (!activeGroupId) return null;
  return state.groups[activeGroupId]?.activeTabId ?? null;
}

function ExplorerSection() {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = state.activeGroupId ?? Object.keys(state.groups)[0];
  const activeTabId = findActiveTabId(state);
  const activeFile = activeTabId ? getExampleFileById(activeTabId) : undefined;

  return (
    <CodeFileTree
      items={exampleFileTree}
      selectedPath={activeFile?.path}
      onOpenFile={(item) => {
        if (item.type !== "file" || !activeGroupId) return;
        const file = getExampleFileByPath(item.path);
        if (!file) return;
        actions.activateOrOpenTab(activeGroupId, createCodeTab(file.id));
      }}
      onPinFile={(item) => {
        if (item.type !== "file" || !activeGroupId) return;
        const file = getExampleFileByPath(item.path);
        if (!file) return;
        actions.activateOrOpenTab(activeGroupId, { ...createCodeTab(file.id), isPreview: false });
      }}
      getDragTab={(item) => {
        if (item.type !== "file") return null;
        const file = getExampleFileByPath(item.path);
        return file ? createCodeTab(file.id) : null;
      }}
    />
  );
}

function SourceControlSection({ viewMode }: { viewMode: "list" | "tree" }) {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = state.activeGroupId ?? Object.keys(state.groups)[0];
  const activeTabId = findActiveTabId(state);
  const selectedPath = activeTabId?.endsWith(".diff")
    ? activeTabId.slice(0, -5)
    : getExampleFileById(activeTabId ?? "")?.path ?? null;

  const treeItems = useMemo(() => {
    type Node = CodeFileTreeItem & { childrenMap?: Map<string, Node> };
    const roots = new Map<string, Node>();

    function upsert(map: Map<string, Node>, path: string, type: "folder" | "file"): Node {
      const existing = map.get(path);
      if (existing) return existing;
      const node: Node = {
        path,
        type,
        children: type === "folder" ? [] : undefined,
        childrenMap: type === "folder" ? new Map<string, Node>() : undefined,
      };
      map.set(path, node);
      return node;
    }

    for (const file of exampleDiffFiles) {
      const parts = file.path.split("/");
      let currentMap = roots;
      let currentPath = "";

      parts.forEach((part, index) => {
        currentPath = currentPath ? `${currentPath}/${part}` : part;
        const isLeaf = index === parts.length - 1;
        const node = upsert(currentMap, currentPath, isLeaf ? "file" : "folder");
        if (isLeaf) {
          node.status = file.status;
          node.trailing = (
            <span
              style={{
                fontSize: 11,
                fontFamily: "var(--mosaic-font-family-mono)",
                color: "#8b949e",
                flexShrink: 0,
              }}
            >
              {file.additions > 0 && <span style={{ color: "#4ec9b0" }}>+{file.additions}</span>}
              {file.deletions > 0 && <span style={{ color: "#f14c4c", marginLeft: 4 }}>-{file.deletions}</span>}
            </span>
          );
        } else if (node.childrenMap) {
          currentMap = node.childrenMap;
        }
      });
    }

    function finalize(nodes: Map<string, Node>): CodeFileTreeItem[] {
      return [...nodes.values()].map((node) => ({
        path: node.path,
        type: node.type,
        status: node.status,
        trailing: node.trailing,
        children: node.childrenMap ? finalize(node.childrenMap) : undefined,
      }));
    }

    return finalize(roots);
  }, []);

  return (
    <div style={{ flex: 1, minHeight: 0, overflow: "auto" }}>
      {viewMode === "list" ? (
        <ChangedFilesList
          files={exampleDiffFiles}
          selectedPath={selectedPath}
          onSelectFile={(file) => {
            if (!activeGroupId) return;
            actions.activateOrOpenTab(activeGroupId, createDiffFileTab(file.path));
          }}
          getDragTab={(file) => {
            const sourceFile = getExampleFileByPath(file.path);
            if (!sourceFile) return null;
            return createCodeTab(sourceFile.id, {
              title: basename(file.path),
              labelColor: getChangedStatusColor(file.status),
            });
          }}
        />
      ) : (
        <CodeFileTree
          items={treeItems}
          selectedPath={selectedPath}
          onOpenFile={(item) => {
            if (item.type !== "file" || !activeGroupId) return;
            actions.activateOrOpenTab(activeGroupId, createDiffFileTab(item.path));
          }}
          onPinFile={(item) => {
            if (item.type !== "file" || !activeGroupId) return;
            actions.activateOrOpenTab(activeGroupId, { ...createDiffFileTab(item.path), isPreview: false });
          }}
          getDragTab={(item) => {
            if (item.type !== "file") return null;
            return createDiffFileTab(item.path);
          }}
        />
      )}
    </div>
  );
}

function TraceFilesSection() {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = state.activeGroupId ?? Object.keys(state.groups)[0];
  const activeTabId = findActiveTabId(state);
  const activeTracePath = activeTabId ? getTraceSampleById(activeTabId)?.path : null;

  return (
    <CodeFileTree
      items={traceFileTree}
      selectedPath={activeTracePath}
      onOpenFile={(item) => {
        if (item.type !== "file" || !activeGroupId) return;
        const sample = getTraceSampleByPath(item.path);
        if (!sample) return;
        actions.activateOrOpenTab(activeGroupId, createTraceTab(sample.id));
      }}
      onPinFile={(item) => {
        if (item.type !== "file" || !activeGroupId) return;
        const sample = getTraceSampleByPath(item.path);
        if (!sample) return;
        actions.activateOrOpenTab(activeGroupId, { ...createTraceTab(sample.id), isPreview: false });
      }}
      getDragTab={(item) => {
        if (item.type !== "file") return null;
        const sample = getTraceSampleByPath(item.path);
        return sample ? createTraceTab(sample.id) : null;
      }}
    />
  );
}

function OutlineSection() {
  const { state } = useWorkbench();
  const activeTabId = findActiveTabId(state) ?? "App.tsx";
  const activeTrace = getTraceSampleById(activeTabId);
  const symbols = activeTrace
    ? [
        activeTrace.title,
        `${activeTrace.turns.length} turns`,
        `${activeTrace.turns.filter((turn) => turn.type === "assistant").length} assistant turns`,
        `${activeTrace.turns.reduce((count, turn) => count + (turn.toolCalls?.length ?? 0), 0)} tool calls`,
      ]
    : outlineByFileId[activeTabId] ?? ["No outline available"];

  return (
    <div>
      {symbols.map((symbol) => (
        <div
          key={symbol}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            color: "var(--mosaic-sidebar-fg)",
            whiteSpace: "nowrap",
            overflow: "hidden",
            textOverflow: "ellipsis",
          }}
        >
          {symbol}
        </div>
      ))}
    </div>
  );
}

function ProblemsPanel() {
  return (
    <div style={{ padding: 12, color: "#e5e7eb", fontSize: 12, display: "grid", gap: 8 }}>
      <div style={{ borderLeft: "3px solid #f59e0b", paddingLeft: 10 }}>
        The explorer tree and source control sections maintain separate selection state to avoid conflicts.
      </div>
      <div style={{ borderLeft: "3px solid #38bdf8", paddingLeft: 10 }}>
        Trace fixtures cover multiple agent formats so the viewer is exercised on longer, realistic transcripts.
      </div>
    </div>
  );
}

function TerminalPanel() {
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        color: "#d1fae5",
        fontSize: 12,
        lineHeight: 1.55,
        fontFamily: "var(--mosaic-font-family-mono)",
      }}
    >
{`$ npm run test:e2e

Running viewer and workbench stories
  ✓ source control opens Monaco diff editors
  ✓ trace fixtures open as workbench tabs
  ✓ multi-format traces render correctly`}
    </pre>
  );
}

function OutputPanel() {
  return (
    <pre
      style={{
        margin: 0,
        padding: 12,
        color: "#cbd5e1",
        fontSize: 12,
        lineHeight: 1.55,
        fontFamily: "var(--mosaic-font-family-mono)",
      }}
    >
{`{
  "workspace": "example-project",
  "diff_files": 3,
  "trace_files": 6,
  "default_trace": "codex-cli.raw.jsonl"
}`}
    </pre>
  );
}


type CustomWorkspaceItem = {
  id: string;
  title: string;
  subtitle: string;
  kind: "run" | "finding" | "artifact";
  accent: string;
  stage: string;
  summary: string;
};

const customQueueItems: CustomWorkspaceItem[] = [
  {
    id: "run:review-candidate-a",
    title: "Review candidate A",
    subtitle: "Primary review candidate · ready for inspection",
    kind: "run",
    accent: "#4ec9b0",
    stage: "Ready to review",
    summary: "A representative review candidate used to demonstrate custom tabs, reopening by id, and drag-to-open behavior.",
  },
  {
    id: "finding:mini-swe-agent-exit",
    title: "Completion sentinel fix",
    subtitle: "Protocol mismatch · regression note",
    kind: "finding",
    accent: "#f2cc60",
    stage: "Needs follow-up",
    summary: "A sample engineering note showing how non-file items can open custom tabs in the workbench.",
  },
  {
    id: "artifact:k3-smoke",
    title: "Smoke-check artifact",
    subtitle: "Reference artifact · validation sample",
    kind: "artifact",
    accent: "#75beff",
    stage: "Reference",
    summary: "A lightweight artifact tab used to show alternate item kinds in the custom example.",
  },
];

const customPinnedItems: CustomWorkspaceItem[] = [
  customQueueItems[0],
  {
    id: "finding:adaptive-thinking",
    title: "Reasoning mode note",
    subtitle: "Interpretation note · implementation detail",
    kind: "finding",
    accent: "#c586c0",
    stage: "Pinned context",
    summary: "A second pinned note used to demonstrate id-based tab reuse across multiple custom sidebar sections.",
  },
];

function CustomWorkspaceIcon({ kind }: { kind: CustomWorkspaceItem["kind"] }) {
  if (kind === "run") {
    return <span className="codicon codicon-play-circle" style={{ fontSize: 14 }} aria-hidden="true" />;
  }
  if (kind === "artifact") {
    return <span className="codicon codicon-package" style={{ fontSize: 14 }} aria-hidden="true" />;
  }
  return <span className="codicon codicon-warning" style={{ fontSize: 14 }} aria-hidden="true" />;
}

function CustomWorkspaceTabContent({ item }: { item: CustomWorkspaceItem }) {
  return (
    <div
      style={{
        height: "100%",
        overflow: "auto",
        background: "var(--mosaic-editor-bg)",
        padding: "16px 20px",
      }}
    >
      <div style={{ maxWidth: 920 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 12 }}>
          <span
            style={{
              width: 8,
              height: 8,
              borderRadius: 999,
              background: item.accent,
              flexShrink: 0,
            }}
          />
          <span style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>
            {item.stage}
          </span>
        </div>
        <div style={{ fontSize: 20, fontWeight: 600, color: "#cccccc", marginBottom: 8 }}>{item.title}</div>
        <div style={{ fontSize: 13, color: "#9da5b4", lineHeight: 1.6, marginBottom: 6 }}>{item.subtitle}</div>
        <div style={{ fontSize: 13, lineHeight: 1.7, color: "#d4d4d4", marginBottom: 20 }}>{item.summary}</div>
        <div style={{ borderTop: "1px solid #3c3c3c", paddingTop: 16, display: "grid", gap: 12 }}>
          {[
            ["Open semantics", "Same item id reuses the existing tab instead of opening a duplicate."],
            ["Custom UI", "This sidebar is plain React buttons, not a file tree or preset component."],
            ["Drag support", "These rows can also be dragged into editor groups using the exported drag helpers."],
          ].map(([label, value]) => (
            <div key={label}>
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#6e6e6e", marginBottom: 4 }}>{label}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6, color: "#cccccc" }}>{value}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const makeCustomWorkspaceTab: TabFactory<CustomWorkspaceItem> = (item) => ({
  id: item.id,
  title: item.title,
  icon: <CustomWorkspaceIcon kind={item.kind} />,
  labelColor: item.accent,
  content: <CustomWorkspaceTabContent item={item} />,
});

function CustomWorkspaceList({ title, items }: { title: string; items: CustomWorkspaceItem[] }) {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = useActiveWorkbenchGroupId();
  const activeTabId = findActiveTabId(state);

  return (
    <div style={{ padding: "4px 0" }}>
      {items.map((item) => {
        const isActive = item.id === activeTabId;
        const tab = makeCustomWorkspaceTab(item);
        return (
          <button
            key={`${title}-${item.id}`}
            type="button"
            draggable
            data-custom-item={item.id}
            onClick={() => {
              if (!activeGroupId) return;
              actions.activateOrOpenTab(activeGroupId, tab);
            }}
            onDragStart={(event) => {
              setDragTab(tab);
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(DRAG_TYPE, JSON.stringify({ type: "sidebar-file", tabId: tab.id }));
            }}
            onDragEnd={() => clearDragTab()}
            style={{
              border: "none",
              background: isActive ? "rgba(255,255,255,0.06)" : "transparent",
              color: "inherit",
              padding: "6px 20px",
              textAlign: "left",
              display: "flex",
              alignItems: "center",
              gap: 8,
              cursor: "pointer",
              width: "100%",
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 6,
                height: 6,
                borderRadius: 999,
                background: item.accent,
                flexShrink: 0,
              }}
            />
            <span style={{ color: isActive ? "#ffffff" : "#cccccc", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{item.title}</span>
            <span style={{ fontSize: 12, color: "#6e6e6e", marginLeft: "auto", flexShrink: 0 }}>{item.stage}</span>
          </button>
        );
      })}
    </div>
  );
}

function CustomViewsWorkbench() {
  const initialState: Partial<WorkbenchState> = {
    splitTree: createLeaf("custom-main"),
    activeGroupId: "custom-main",
    groups: {
      "custom-main": {
        tabs: [makeCustomWorkspaceTab(customQueueItems[0])],
        activeTabId: customQueueItems[0].id,
        mruOrder: [customQueueItems[0].id],
      },
    },
  };

  const leftSections: SidebarSection[] = [
    {
      id: "queue",
      title: "Queue",
      content: <CustomWorkspaceList title="Review queue" items={customQueueItems} />,
      headerActions: <SectionActionLabel>plain React rows opening custom tabs</SectionActionLabel>,
    },
    {
      id: "pinned",
      title: "Pinned",
      content: <CustomWorkspaceList title="Pinned context" items={customPinnedItems} />,
      headerActions: <SectionActionLabel>same ids reactivate existing tabs</SectionActionLabel>,
    },
  ];

  const panelTabs: PanelTab[] = [
    {
      id: "custom-notes",
      title: "Notes",
      content: (
        <pre style={{ margin: 0, padding: 12, color: "#cbd5e1", fontSize: 12, lineHeight: 1.55, fontFamily: "var(--mosaic-font-family-mono)" }}>
{`makeTab(item) => { id, title, icon, content }

click: activateOrOpenTab(activeGroupId, makeTab(item))
drag: setDragTab(makeTab(item))`}
        </pre>
      ),
    },
  ];

  return (
    <div style={stageStyle}>
      <div style={frameStyle}>
        <Workbench
          initialState={initialState}
          leftSidebar={{ sections: leftSections, defaultWidth: 320, minWidth: 220 }}
          panel={{ tabs: panelTabs, defaultHeight: 144, minHeight: 96 }}
        />
      </div>
    </div>
  );
}

function ReviewWorkbench({ initialState }: { initialState: Partial<WorkbenchState> }) {
  const [sourceControlViewMode, setSourceControlViewMode] = useState<"list" | "tree">("list");

  const activityItems: ActivityBarItem[] = [
    { id: "explorer", title: "Explorer", icon: <ExplorerIcon /> },
    { id: "search", title: "Search", icon: <SearchIcon /> },
    { id: "git", title: "Source Control", icon: <GitIcon /> },
    { id: "trace", title: "Traces", icon: <TraceIcon /> },
  ];

  const leftSections: SidebarSection[] = [
    {
      id: "explorer",
      title: "Explorer",
      content: <ExplorerSection />,
      headerActions: <SectionActionLabel>drag files into editor groups</SectionActionLabel>,
    },
    {
      id: "source-control",
      title: "Source Control",
      content: <SourceControlSection viewMode={sourceControlViewMode} />,
      headerActions: (
        <div style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
          <HeaderIconButton
            title="Tree View"
            active={sourceControlViewMode === "tree"}
            onClick={() => setSourceControlViewMode("tree")}
            iconClass="codicon-list-tree"
          />
          <HeaderIconButton
            title="List View"
            active={sourceControlViewMode === "list"}
            onClick={() => setSourceControlViewMode("list")}
            iconClass="codicon-list-flat"
          />
        </div>
      ),
    },
  ];

  const rightSections: SidebarSection[] = [
    {
      id: "trace-files",
      title: "Trace Files",
      content: <TraceFilesSection />,
      headerActions: <SectionActionLabel>multi-format trace fixtures</SectionActionLabel>,
    },
    {
      id: "outline",
      title: "Outline",
      content: <OutlineSection />,
    },
  ];

  const panelTabs: PanelTab[] = [
    { id: "terminal", title: "Terminal", content: <TerminalPanel /> },
    { id: "problems", title: "Problems", content: <ProblemsPanel /> },
    { id: "output", title: "Output", content: <OutputPanel /> },
  ];

  return (
    <div style={stageStyle}>
      <div style={frameStyle}>
        <Workbench
          initialState={initialState}
          activityBar={{ items: activityItems }}
          leftSidebar={{ sections: leftSections, defaultWidth: 300, minWidth: 220 }}
          rightSidebar={{ sections: rightSections, defaultWidth: 320, minWidth: 240 }}
          panel={{ tabs: panelTabs, defaultHeight: 188, minHeight: 120 }}
        />
      </div>
    </div>
  );
}

function buildDefaultState(): Partial<WorkbenchState> {
  return {
    splitTree: createLeaf("group-main"),
    activeGroupId: "group-main",
    groups: {
      "group-main": {
        tabs: [
          createCodeTab("App.tsx"),
          createCodeTab("index.ts"),
          createDiffOverviewTab(),
          createDiffFileTab("src/components/StatusBar.tsx"),
          createTraceTab("trajectory-format.json"),
          createTraceTab("codex-cli.raw.jsonl"),
        ],
        activeTabId: "App.tsx",
        mruOrder: [
          "App.tsx",
          "index.ts",
          "workspace.diff",
          "src/components/StatusBar.tsx.diff",
          "trajectory-format.json",
          "codex-cli.raw.jsonl",
        ],
      },
    },
  };
}

function buildSplitState(): Partial<WorkbenchState> {
  return {
    splitTree: createBranch(
      "horizontal",
      [
        createLeaf("group-main"),
        createBranch(
          "vertical",
          [createLeaf("group-review"), createLeaf("group-trace")],
          [0.52, 0.48],
        ),
      ],
      [0.56, 0.44],
    ),
    activeGroupId: "group-main",
    groups: {
      "group-main": {
        tabs: [
          createCodeTab("App.tsx"),
          createCodeTab("FileTree.tsx"),
          createCodeTab("app.css"),
        ],
        activeTabId: "App.tsx",
        mruOrder: ["App.tsx", "FileTree.tsx", "app.css"],
      },
      "group-review": {
        tabs: [
          createDiffOverviewTab(),
          createDiffFileTab("src/components/StatusBar.tsx"),
          createDiffFileTab("src/components/FileTree.tsx"),
        ],
        activeTabId: "src/components/StatusBar.tsx.diff",
        mruOrder: [
          "src/components/StatusBar.tsx.diff",
          "workspace.diff",
          "src/components/FileTree.tsx.diff",
        ],
      },
      "group-trace": {
        tabs: [
          createTraceTab("trajectory-format.json"),
          createTraceTab("codex-cli.raw.jsonl"),
          createTraceTab("claude-code.raw.jsonl"),
        ],
        activeTabId: "claude-code.raw.jsonl",
        mruOrder: [
          "claude-code.raw.jsonl",
          "trajectory-format.json",
          "codex-cli.raw.jsonl",
        ],
      },
    },
  };
}

function buildManyTabsState(): Partial<WorkbenchState> {
  const tabs = [
    ...exampleFiles.map((file) => createCodeTab(file.id)),
    createDiffOverviewTab(),
    ...exampleDiffFiles.map((file) => createDiffFileTab(file.path)),
    ...traceSamples.map((sample) => createTraceTab(sample.id)),
  ];

  return {
    splitTree: createLeaf("group-main"),
    activeGroupId: "group-main",
    groups: {
      "group-main": {
        tabs,
        activeTabId: "App.tsx",
        mruOrder: tabs.map((tab) => tab.id),
      },
    },
  };
}


type TailwindDemoItem = {
  id: string;
  title: string;
  subtitle: string;
  eyebrow: string;
  summary: string;
  highlights: string[];
  accentColor: string;
  chipClassName: string;
};

const tailwindDemoItems: TailwindDemoItem[] = [
  {
    id: "tailwind:styled-tabs",
    title: "Styled tabs",
    subtitle: "Tailwind card tabs with live React content",
    eyebrow: "Basics",
    summary:
      "This tab is pure React content styled with Tailwind utilities while the workbench itself stays on react-code-panes primitives.",
    highlights: ["Utility classes on tab content", "Same id reuses the open tab", "Drag the row to open it in another group"],
    accentColor: "#34d399",
    chipClassName: "bg-emerald-400/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/30",
  },
  {
    id: "tailwind:app-shell",
    title: "App shell",
    subtitle: "A bounded app shell around Workbench",
    eyebrow: "Layout",
    summary:
      "The host layout, hero, cards, and side content all use Tailwind. The workbench just fills a normal flex child instead of assuming full viewport ownership.",
    highlights: ["No full-screen requirement", "Tailwind wrappers around Workbench", "Preflight disabled to avoid global collisions"],
    accentColor: "#60a5fa",
    chipClassName: "bg-sky-400/12 text-sky-200 ring-1 ring-inset ring-sky-400/30",
  },
  {
    id: "tailwind:custom-rows",
    title: "Custom rows",
    subtitle: "Custom rows opening custom tabs",
    eyebrow: "Extend",
    summary:
      "Your own UI decides what tab to open, and the workbench only manages splits, tabs, and drag-drop. No file-tree assumption in the core library.",
    highlights: ["Custom sidebar rows", "ReactElement tab content", "No file-tree assumption in core"],
    accentColor: "#f9a8d4",
    chipClassName: "bg-pink-400/12 text-pink-200 ring-1 ring-inset ring-pink-400/30",
  },
];

const makeTailwindShowcaseTab: TabFactory<TailwindDemoItem> = (item) => ({
  id: item.id,
  title: item.title,
  labelColor: item.accentColor,
  icon: <FileIcon filename={`${item.title.toLowerCase().replace(/\s+/g, "-")}.mdx`} />,
  content: (
    <div className="h-full overflow-auto bg-[#1e1e1e] px-5 py-4 text-[13px] leading-7 text-slate-300">
      <div className="max-w-3xl">
        <div className="mb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">{item.eyebrow}</div>
        <h1 className="mb-3 text-lg font-semibold text-white">{item.title}</h1>
        <p className="mb-5">{item.summary}</p>
        {item.highlights.map((highlight) => (
          <p key={highlight} className="mb-2 text-slate-400">— {highlight}</p>
        ))}
      </div>
    </div>
  ),
});

function TailwindSidebarCards({ title, items }: { title: string; items: TailwindDemoItem[] }) {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = useActiveWorkbenchGroupId();

  return (
    <div className="py-1">
      {items.map((item) => {
        const isActive = state.groups[activeGroupId]?.activeTabId === item.id;
        const tab = makeTailwindShowcaseTab(item);
        return (
          <button
            key={item.id}
            type="button"
            data-tailwind-item={item.id}
            draggable
            onClick={() => actions.activateOrOpenTab(activeGroupId, tab)}
            onDragStart={(event) => {
              event.dataTransfer.effectAllowed = "copy";
              event.dataTransfer.setData(DRAG_TYPE, item.id);
              setDragTab(tab);
            }}
            onDragEnd={() => clearDragTab()}
            className={`flex w-full items-center gap-2 border-0 px-5 py-1.5 text-left text-[13px] transition ${
              isActive
                ? "bg-white/[0.06] text-white"
                : "bg-transparent text-zinc-300 hover:bg-white/[0.04]"
            }`}
          >
            <span
              className="h-1.5 w-1.5 flex-shrink-0 rounded-full"
              style={{ background: item.accentColor }}
            />
            <span className="truncate">{item.title}</span>
            <span className="ml-auto flex-shrink-0 text-[11px] text-zinc-600">{item.eyebrow}</span>
          </button>
        );
      })}
    </div>
  );
}

function TailwindHostWorkbench() {
  const initialState: Partial<WorkbenchState> = {
    splitTree: createLeaf("tailwind-main"),
    activeGroupId: "tailwind-main",
    groups: {
      "tailwind-main": {
        tabs: [
          makeTailwindShowcaseTab(tailwindDemoItems[0]),
          createCodeTab("App.tsx"),
          createDiffFileTab("src/components/StatusBar.tsx"),
          createTraceTab("trajectory-format.json"),
        ],
        activeTabId: tailwindDemoItems[0].id,
        mruOrder: [
          tailwindDemoItems[0].id,
          "App.tsx",
          "src/components/StatusBar.tsx.diff",
          "trajectory-format.json",
        ],
      },
    },
  };

  const leftSections: SidebarSection[] = [
    {
      id: "tailwind-launchpad",
      title: "Launchpad",
      content: <TailwindSidebarCards title="Tailwind cards" items={tailwindDemoItems} />,
      headerActions: <SectionActionLabel>utility classes outside core</SectionActionLabel>,
    },
    {
      id: "explorer",
      title: "Explorer",
      content: <ExplorerSection />,
      headerActions: <SectionActionLabel>library tree stays unchanged</SectionActionLabel>,
    },
  ];

  const rightSections: SidebarSection[] = [
    {
      id: "tailwind-notes",
      title: "Integration Notes",
      content: (
        <div className="px-5 py-3 text-[13px] leading-6 text-zinc-400">
          <p>Preflight is enabled. The library's scoped CSS is resilient to global resets.</p>
          <p className="mt-3">Import the workbench into a bounded container, wire your own item-to-tab factories, and use utility classes for the host shell.</p>
        </div>
      ),
    },
  ];

  const panelTabs: PanelTab[] = [
    {
      id: "tailwind-checks",
      title: "Checks",
      content: (
        <div className="h-full overflow-auto bg-[#111111] p-4 font-mono text-[12px] leading-6 text-zinc-300">
          <div>tailwind host shell renders around workbench</div>
          <div>custom rows open React tabs by stable id</div>
          <div>library viewers still coexist with utility-class content</div>
        </div>
      ),
    },
    { id: "output", title: "Output", content: <OutputPanel /> },
  ];

  return (
    <div className="flex min-h-screen flex-col bg-[#09090b] text-zinc-100">
      <div className="flex items-center gap-6 border-b border-zinc-800 px-6 py-3">
        <span className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-300/70">Tailwind host app</span>
        <span className="text-[13px] text-zinc-400">The workbench embedded in a utility-class layout.</span>
      </div>
      <div className="flex-1">
        <div className="h-full">
            <Workbench
              initialState={initialState}
              activityBar={{ items: [{ id: "tailwind", title: "Tailwind", icon: <ExplorerIcon /> }] }}
              leftSidebar={{ sections: leftSections, defaultWidth: 310, minWidth: 240 }}
              rightSidebar={{ sections: rightSections, defaultWidth: 320, minWidth: 240 }}
              panel={{ tabs: panelTabs, defaultHeight: 160, minHeight: 96 }}
            />
        </div>
      </div>
    </div>
  );
}

const meta = {
  title: "Workbench",
  component: Workbench,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof Workbench>;

export default meta;

type Story = StoryObj<typeof meta>;

export const FullWorkbench: Story = {
  render: () => <ReviewWorkbench initialState={buildDefaultState()} />,
};

export const PreSplitLayout: Story = {
  render: () => <ReviewWorkbench initialState={buildSplitState()} />,
};

export const ManyTabs: Story = {
  render: () => <ReviewWorkbench initialState={buildManyTabsState()} />,
};

export const CustomViewsOpenTabs: Story = {
  render: () => <CustomViewsWorkbench />,
};

export const TailwindHostApp: Story = {
  render: () => <TailwindHostWorkbench />,
};
