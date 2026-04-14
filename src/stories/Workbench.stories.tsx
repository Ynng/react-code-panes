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
  borderRadius: 6,
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
        borderRadius: 3,
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
      <EditorBreadcrumb filePath="rollouts/source-control/changes.patch">
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
  "App.tsx": ["App()", "dashboard-shell", "dashboard-header", "RunSummary", "AgentTracePanel"],
  "index.ts": ["App", "RunSummary", "AgentTracePanel", "buildReviewTabs"],
  "RunSummary.tsx": ["rows", "RunSummary()", "summary-card", "summary-row"],
  "AgentTraceViewer.tsx": ["Props", "AgentTraceViewer()", "TraceToolbar", "TraceRow"],
  "FileTree.tsx": ["FileTree()", "file-tree-row", "file-tree-label", "file-tree-status"],
  "server.py": ["RunRequest", "launch_run(request)"],
  "workbench.css": [".trace-viewer", ".trace-toolbar", ".file-tree-row"],
  "workspace.diff": [
    "AgentTraceViewer.tsx",
    "FileTree.tsx",
    "workbench.css",
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
        Separate the explorer tree from source control changes so regular files and diffs do not share state.
      </div>
      <div style={{ borderLeft: "3px solid #38bdf8", paddingLeft: 10 }}>
        Trace fixtures are real rollout slices from `swe-bench-ultra`, so the viewer is exercised on longer transcripts.
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
  ✓ long rollout-derived traces render across supported formats`}
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
  "task_id": "kh73faxghpn90rtyxsrjmpjpsx83f4ws",
  "diff_files": 3,
  "trace_files": 6,
  "default_trace": "codex-cli-gpt-5.4-xhigh.raw.jsonl"
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
        color: "var(--mosaic-fg)",
      }}
    >
      <div
        style={{
          display: "grid",
          gap: 18,
          padding: 20,
          maxWidth: 920,
        }}
      >
        <div
          style={{
            display: "grid",
            gap: 10,
            padding: 18,
            border: "1px solid rgba(255,255,255,0.08)",
            background: "rgba(255,255,255,0.02)",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <div
              style={{
                width: 10,
                height: 10,
                borderRadius: 999,
                background: item.accent,
                boxShadow: `0 0 0 3px color-mix(in srgb, ${item.accent} 18%, transparent)`,
              }}
            />
            <div style={{ fontSize: 12, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>
              {item.stage}
            </div>
          </div>
          <div style={{ fontSize: 24, fontWeight: 600 }}>{item.title}</div>
          <div style={{ fontSize: 13, color: "#9da5b4", lineHeight: 1.6 }}>{item.subtitle}</div>
          <div style={{ fontSize: 14, lineHeight: 1.7, color: "#d4d4d4" }}>{item.summary}</div>
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(3, minmax(0, 1fr))", gap: 12 }}>
          {[
            ["Open semantics", "Same item id reuses the existing tab instead of opening a duplicate."],
            ["Custom UI", "This sidebar is plain React buttons, not a file tree or preset component."],
            ["Drag support", "These rows can also be dragged into editor groups using the exported drag helpers."],
          ].map(([label, value]) => (
            <div
              key={label}
              style={{
                padding: 14,
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.015)",
                display: "grid",
                gap: 6,
              }}
            >
              <div style={{ fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>{label}</div>
              <div style={{ fontSize: 13, lineHeight: 1.6 }}>{value}</div>
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
    <div style={{ padding: 8, display: "grid", gap: 6 }}>
      <div style={{ padding: "2px 6px", fontSize: 11, textTransform: "uppercase", letterSpacing: "0.08em", color: "#8b949e" }}>
        {title}
      </div>
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
              border: "1px solid rgba(255,255,255,0.06)",
              background: isActive ? "rgba(255,255,255,0.07)" : "rgba(255,255,255,0.025)",
              color: "inherit",
              padding: 10,
              textAlign: "left",
              display: "grid",
              gap: 6,
              cursor: "pointer",
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
              <span
                style={{
                  width: 8,
                  height: 8,
                  borderRadius: 999,
                  background: item.accent,
                  flexShrink: 0,
                }}
              />
              <span style={{ fontSize: 13, fontWeight: 600, color: isActive ? "#ffffff" : "#d4d4d4" }}>{item.title}</span>
            </div>
            <span style={{ fontSize: 12, lineHeight: 1.5, color: "#8b949e" }}>{item.subtitle}</span>
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
      headerActions: <SectionActionLabel>real swe-bench fixtures</SectionActionLabel>,
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
          createDiffFileTab("dashboard/src/components/AgentTraceViewer.tsx"),
          createTraceTab("atif-gemini-cli-3.1-pro.trajectory.json"),
          createTraceTab("codex-cli-gpt-5.4-xhigh.raw.jsonl"),
        ],
        activeTabId: "App.tsx",
        mruOrder: [
          "App.tsx",
          "index.ts",
          "workspace.diff",
          "dashboard/src/components/AgentTraceViewer.tsx.diff",
          "atif-gemini-cli-3.1-pro.trajectory.json",
          "codex-cli-gpt-5.4-xhigh.raw.jsonl",
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
          createCodeTab("workbench.css"),
        ],
        activeTabId: "App.tsx",
        mruOrder: ["App.tsx", "FileTree.tsx", "workbench.css"],
      },
      "group-review": {
        tabs: [
          createDiffOverviewTab(),
          createDiffFileTab("dashboard/src/components/AgentTraceViewer.tsx"),
          createDiffFileTab("dashboard/src/components/FileTree.tsx"),
        ],
        activeTabId: "dashboard/src/components/AgentTraceViewer.tsx.diff",
        mruOrder: [
          "dashboard/src/components/AgentTraceViewer.tsx.diff",
          "workspace.diff",
          "dashboard/src/components/FileTree.tsx.diff",
        ],
      },
      "group-trace": {
        tabs: [
          createTraceTab("atif-gemini-cli-3.1-pro.trajectory.json"),
          createTraceTab("codex-cli-gpt-5.4-xhigh.raw.jsonl"),
          createTraceTab("claude-code-opus-4.6-max.raw.jsonl"),
        ],
        activeTabId: "claude-code-opus-4.6-max.raw.jsonl",
        mruOrder: [
          "claude-code-opus-4.6-max.raw.jsonl",
          "atif-gemini-cli-3.1-pro.trajectory.json",
          "codex-cli-gpt-5.4-xhigh.raw.jsonl",
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
    id: "tailwind:release-readiness",
    title: "Release readiness",
    subtitle: "Tailwind card tabs with live React content",
    eyebrow: "Launch",
    summary:
      "This tab is pure React content styled with Tailwind utilities while the workbench itself stays on react-code-panes primitives.",
    highlights: ["Utility classes on tab content", "Same id reuses the open tab", "Drag the row to open it in another group"],
    accentColor: "#34d399",
    chipClassName: "bg-emerald-400/12 text-emerald-200 ring-1 ring-inset ring-emerald-400/30",
  },
  {
    id: "tailwind:verifier-brief",
    title: "Verifier brief",
    subtitle: "A bounded app shell around Workbench",
    eyebrow: "Checks",
    summary:
      "The host layout, hero, cards, and side content all use Tailwind. The workbench just fills a normal flex child instead of assuming full viewport ownership.",
    highlights: ["No full-screen requirement", "Tailwind wrappers around Workbench", "Preflight disabled to avoid global collisions"],
    accentColor: "#60a5fa",
    chipClassName: "bg-sky-400/12 text-sky-200 ring-1 ring-inset ring-sky-400/30",
  },
  {
    id: "tailwind:handoff-notes",
    title: "Handoff notes",
    subtitle: "Custom rows opening custom tabs",
    eyebrow: "Docs",
    summary:
      "This is the same extension model as the README example direction: your own UI decides what tab to open, and the workbench only manages splits, tabs, and drag-drop.",
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
    <div className="h-full overflow-auto bg-[#0f1720] text-slate-100">
      <div className="mx-auto flex max-w-5xl flex-col gap-5 px-6 py-6">
        <div className="rounded-2xl border border-white/10 bg-white/5 p-6 shadow-[0_18px_50px_rgba(0,0,0,0.22)]">
          <div className="mb-4 flex flex-wrap items-center gap-3">
            <span className={`inline-flex rounded-full px-2.5 py-1 text-[11px] font-semibold uppercase tracking-[0.2em] ${item.chipClassName}`}>
              {item.eyebrow}
            </span>
            <span className="text-xs uppercase tracking-[0.22em] text-slate-400">tailwind host app</span>
          </div>
          <h1 className="text-3xl font-semibold tracking-tight text-white">{item.title}</h1>
          <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-300">{item.summary}</p>
        </div>
        <div className="grid gap-4 lg:grid-cols-3">
          {item.highlights.map((highlight, index) => (
            <div key={highlight} className="rounded-2xl border border-white/10 bg-slate-950/60 p-4">
              <div className="mb-3 text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">
                0{index + 1}
              </div>
              <p className="text-sm font-medium leading-6 text-slate-100">{highlight}</p>
            </div>
          ))}
        </div>
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.2fr)_minmax(280px,0.8fr)]">
          <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/8 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">
              Why this story exists
            </div>
            <ul className="mt-4 space-y-3 text-sm leading-6 text-slate-200">
              <li>Use Tailwind for the host application chrome without fighting the library.</li>
              <li>Open arbitrary React tabs from your own rows, lists, cards, or dashboards.</li>
              <li>Keep the workbench focused on tabs, splits, sidebars, and drag-drop routing.</li>
            </ul>
          </div>
          <div className="rounded-2xl border border-white/10 bg-slate-950/70 p-5">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Suggested README direction</div>
            <code className="mt-3 block whitespace-pre-wrap font-mono text-[12px] leading-6 text-slate-300">
{`<div className="flex h-[720px] min-h-0 flex-col rounded-xl border border-zinc-800">
  <Workbench ... />
</div>`}
            </code>
          </div>
        </div>
      </div>
    </div>
  ),
});

function TailwindSidebarCards({ title, items }: { title: string; items: TailwindDemoItem[] }) {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = useActiveWorkbenchGroupId();

  return (
    <div className="flex flex-col gap-2 p-2">
      <div className="px-2 pb-1 text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">{title}</div>
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
            className={`group flex w-full flex-col gap-2 rounded-lg border px-3 py-3 text-left transition ${
              isActive
                ? "border-emerald-400/40 bg-emerald-400/10 shadow-[inset_0_0_0_1px_rgba(52,211,153,0.08)]"
                : "border-white/5 bg-white/[0.03] hover:border-white/10 hover:bg-white/[0.05]"
            }`}
          >
            <div className="flex items-center justify-between gap-3">
              <div className="flex min-w-0 items-center gap-2">
                <span
                  className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
                  style={{ background: item.accentColor }}
                />
                <span className="truncate text-[13px] font-semibold text-zinc-100">{item.title}</span>
              </div>
              <span className={`inline-flex rounded-full px-2 py-0.5 text-[10px] font-semibold uppercase tracking-[0.14em] ${item.chipClassName}`}>
                {item.eyebrow}
              </span>
            </div>
            <p className="text-xs leading-5 text-zinc-400">{item.subtitle}</p>
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
          createDiffFileTab("dashboard/src/components/AgentTraceViewer.tsx"),
          createTraceTab("atif-gemini-cli-3.1-pro.trajectory.json"),
        ],
        activeTabId: tailwindDemoItems[0].id,
        mruOrder: [
          tailwindDemoItems[0].id,
          "App.tsx",
          "dashboard/src/components/AgentTraceViewer.tsx.diff",
          "atif-gemini-cli-3.1-pro.trajectory.json",
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
        <div className="flex flex-col gap-3 p-3 text-sm text-zinc-300">
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">Tailwind setup</div>
            <p className="mt-2 leading-6 text-zinc-300">
              This story imports Tailwind only for Storybook, with preflight disabled so utility classes can sit next to the library CSS without resetting everything.
            </p>
          </div>
          <div className="rounded-lg border border-white/10 bg-white/[0.03] p-3">
            <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-zinc-500">What to copy later</div>
            <p className="mt-2 leading-6 text-zinc-300">
              A normal app shell, a bounded workbench container, and your own item-to-tab factories. No full-screen requirement, no Tailwind dependency inside the library runtime.
            </p>
          </div>
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
    <div className="min-h-screen bg-[radial-gradient(circle_at_top,_rgba(20,184,166,0.12),_transparent_28%),linear-gradient(180deg,_#09090b_0%,_#111111_100%)] px-6 py-6 text-zinc-100">
      <div className="mx-auto flex max-w-[1500px] flex-col gap-4">
        <div className="grid gap-4 xl:grid-cols-[minmax(0,1.15fr)_minmax(320px,0.85fr)]">
          <div className="rounded-2xl border border-white/10 bg-white/[0.04] p-5 shadow-[0_18px_60px_rgba(0,0,0,0.28)] backdrop-blur-sm">
            <div className="text-[11px] font-semibold uppercase tracking-[0.22em] text-teal-200/70">Tailwind compatibility</div>
            <h1 className="mt-3 text-3xl font-semibold tracking-tight text-white">Wrap the workbench in a normal Tailwind app shell.</h1>
            <p className="mt-3 max-w-3xl text-sm leading-7 text-zinc-300">
              This story proves the library can live inside a utility-class layout, open custom React tabs from your own UI, and still keep Monaco, diff, and trace viewers working in the same workspace.
            </p>
          </div>
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-1">
            <div className="rounded-2xl border border-emerald-400/20 bg-emerald-400/10 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-emerald-200/80">Host layout</div>
              <p className="mt-2 text-sm leading-6 text-zinc-100">The workbench sits inside a bounded `h-[820px]` card, not a viewport-filling demo shell.</p>
            </div>
            <div className="rounded-2xl border border-sky-400/20 bg-sky-400/10 p-4">
              <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-sky-200/80">Open semantics</div>
              <p className="mt-2 text-sm leading-6 text-zinc-100">Tailwind buttons produce tabs; react-code-panes just handles activation, splitting, and drag-drop.</p>
            </div>
          </div>
        </div>
        <div className="overflow-hidden rounded-2xl border border-zinc-800 bg-[#1e1e1e] shadow-[0_22px_70px_rgba(0,0,0,0.35)]">
          <div className="h-[820px]">
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
