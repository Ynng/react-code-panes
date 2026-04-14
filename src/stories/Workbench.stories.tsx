import type { Meta, StoryObj } from "@storybook/react";
import { CSSProperties, ReactNode } from "react";
import type { ActivityBarItem } from "../components/ActivityBar";
import {
  AgentTraceViewer,
  ChangedFilesList,
  CodeFileTree,
  EditorBreadcrumb,
  FileIcon,
  MonacoCodeViewer,
  MonacoDiffViewer,
  PanelTab,
  SidebarSection,
  Tab,
  UnifiedDiffPreview,
  Workbench,
  WorkbenchState,
  createBranch,
  createLeaf,
  parseAgentTrace,
  useWorkbench,
  useWorkbenchActions,
} from "../index";
import {
  exampleDiffFiles,
  exampleFileTree,
  exampleFiles,
  getExampleDiffFile,
  getExampleFileById,
  getExampleFileByPath,
  traceSamples,
  workspaceUnifiedDiff,
} from "./exampleData";

const frameStyle: CSSProperties = {
  width: "min(1440px, calc(100vw - 48px))",
  height: 860,
  margin: "24px auto",
  borderRadius: 18,
  overflow: "hidden",
  border: "1px solid rgba(148, 163, 184, 0.16)",
  boxShadow: "0 30px 80px rgba(15, 23, 42, 0.3)",
  background:
    "radial-gradient(circle at top left, rgba(14, 165, 233, 0.12), transparent 26%), #0f172a",
  padding: 14,
  boxSizing: "border-box",
};

const shellStyle: CSSProperties = {
  width: "100%",
  height: "100%",
  borderRadius: 14,
  overflow: "hidden",
  background: "#111827",
};

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
        color: "#6b7280",
      }}
    >
      {children}
    </span>
  );
}

function createCodeTab(fileId: string): Tab {
  const file = getExampleFileById(fileId);
  if (!file) {
    return {
      id: fileId,
      title: fileId,
      content: <div style={{ padding: 16 }}>Missing example file: {fileId}</div>,
    };
  }

  return {
    id: file.id,
    title: file.id,
    icon: <FileIcon filename={file.id} />,
    labelColor: file.status ? "#e2c08d" : undefined,
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
    title: "workspace.diff",
    icon: <FileIcon filename="workspace.diff" />,
    content: <UnifiedDiffPreview diff={workspaceUnifiedDiff} />,
  };
}

function createDiffFileTab(path: string): Tab {
  const diffFile = getExampleDiffFile(path);
  const title = `${path.split("/").pop() ?? path}.diff`;
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
    title,
    icon: <FileIcon filename={path.split("/").pop() ?? path} />,
    labelColor: "#e2c08d",
    content: (
      <EditorBreadcrumb filePath={path}>
        <MonacoDiffViewer
          original={diffFile.original}
          modified={diffFile.modified}
          language={diffFile.language}
        />
      </EditorBreadcrumb>
    ),
  };
}

function createTraceTab(id: string): Tab {
  const sample = traceSamples.find((candidate) => candidate.id === id);
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
    content: (
      <AgentTraceViewer
        turns={parseAgentTrace(sample.raw)}
        label={sample.title}
      />
    ),
  };
}

const outlineByFileId: Record<string, string[]> = {
  "App.tsx": ["App()", "dashboard-shell", "dashboard-header", "RunSummary", "AgentTracePanel"],
  "index.ts": ["App", "RunSummary", "AgentTracePanel", "buildReviewTabs"],
  "RunSummary.tsx": ["rows", "RunSummary()", "summary-card", "summary-row"],
  "server.py": ["RunRequest", "launch_run(request)"],
  "workbench.css": [".dashboard-shell", ".dashboard-header", ".dashboard-grid"],
  "workspace.diff": ["AgentTraceViewer.tsx", "FileTree.tsx", "workbench.css"],
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

function DiffSection() {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = state.activeGroupId ?? Object.keys(state.groups)[0];
  const activeTabId = findActiveTabId(state);
  const selectedPath = activeTabId?.endsWith(".diff")
    ? activeTabId.slice(0, -5)
    : activeTabId === "workspace.diff"
      ? "workspace.diff"
      : null;

  return (
    <ChangedFilesList
      files={exampleDiffFiles}
      selectedPath={selectedPath}
      onSelectFile={(file) => {
        if (!activeGroupId) return;
        actions.activateOrOpenTab(activeGroupId, createDiffFileTab(file.path));
      }}
    />
  );
}

function OutlineSection() {
  const { state } = useWorkbench();
  const activeTabId = findActiveTabId(state) ?? "App.tsx";
  const symbols = outlineByFileId[activeTabId] ?? ["No outline available"];

  return (
    <div>
      {symbols.map((symbol) => (
        <div
          key={symbol}
          style={{
            padding: "4px 10px",
            fontSize: 12,
            color: "#cbd5e1",
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

function TraceSection() {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = state.activeGroupId ?? Object.keys(state.groups)[0];

  return (
    <div style={{ display: "grid", gap: 6, padding: 8 }}>
      {traceSamples.map((sample) => (
        <button
          key={sample.id}
          onClick={() => {
            if (!activeGroupId) return;
            actions.activateOrOpenTab(activeGroupId, createTraceTab(sample.id));
          }}
          style={{
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "8px 10px",
            background: "#111827",
            border: "1px solid rgba(148, 163, 184, 0.14)",
            color: "#e5e7eb",
            borderRadius: 8,
            cursor: "pointer",
            textAlign: "left",
            fontSize: 12,
          }}
        >
          <FileIcon filename={sample.id} />
          <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>
            {sample.title}
          </span>
        </button>
      ))}
    </div>
  );
}

function ProblemsPanel() {
  return (
    <div style={{ padding: 12, color: "#e5e7eb", fontSize: 12, display: "grid", gap: 8 }}>
      <div style={{ borderLeft: "3px solid #f59e0b", paddingLeft: 10 }}>
        `CodeFileTree.tsx` uses a fixed row height that may clip long labels in narrow panes.
      </div>
      <div style={{ borderLeft: "3px solid #38bdf8", paddingLeft: 10 }}>
        Consider memoizing parsed trace fixtures if you render many viewers on one page.
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
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
{`$ npm run test:e2e

Running 23 tests using 4 workers
  ✓ workbench: clicking a tab activates it
  ✓ workbench: dragging a file into a split opens Monaco
  ✓ trace gallery: all trace formats render

23 passed (14.7s)`}
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
        fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace",
      }}
    >
{`{
  "run_id": "run_20260410_213249_94mcl2",
  "agent": "crest-alpha",
  "pass_rate": 0.584,
  "resolved": 132,
  "total": 226
}`}
    </pre>
  );
}

function ReviewWorkbench({ initialState }: { initialState: Partial<WorkbenchState> }) {
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
      headerActions: <SectionActionLabel>drag files into editors</SectionActionLabel>,
    },
    {
      id: "diff",
      title: "Workspace Diff",
      content: <DiffSection />,
      headerActions: <SectionActionLabel>review changed files</SectionActionLabel>,
    },
  ];

  const rightSections: SidebarSection[] = [
    {
      id: "outline",
      title: "Outline",
      content: <OutlineSection />,
    },
    {
      id: "trace-samples",
      title: "Trace Samples",
      content: <TraceSection />,
      headerActions: <SectionActionLabel>all supported formats</SectionActionLabel>,
    },
  ];

  const panelTabs: PanelTab[] = [
    { id: "terminal", title: "Terminal", content: <TerminalPanel /> },
    { id: "problems", title: "Problems", content: <ProblemsPanel /> },
    { id: "output", title: "Output", content: <OutputPanel /> },
  ];

  return (
    <div style={frameStyle}>
      <div style={shellStyle}>
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
          createTraceTab("codex-trace.jsonl"),
        ],
        activeTabId: "App.tsx",
        mruOrder: ["App.tsx", "index.ts", "workspace.diff", "codex-trace.jsonl"],
      },
    },
  };
}

function buildSplitState(): Partial<WorkbenchState> {
  return {
    splitTree: createBranch("horizontal", [createLeaf("group-main"), createLeaf("group-review")], [0.58, 0.42]),
    activeGroupId: "group-main",
    groups: {
      "group-main": {
        tabs: [createCodeTab("App.tsx"), createCodeTab("index.ts"), createCodeTab("RunSummary.tsx")],
        activeTabId: "App.tsx",
        mruOrder: ["App.tsx", "index.ts", "RunSummary.tsx"],
      },
      "group-review": {
        tabs: [createDiffOverviewTab(), createDiffFileTab("dashboard/src/components/AgentTraceViewer.tsx")],
        activeTabId: "workspace.diff",
        mruOrder: ["workspace.diff", "dashboard/src/components/AgentTraceViewer.tsx.diff"],
      },
    },
  };
}

function buildManyTabsState(): Partial<WorkbenchState> {
  const tabs = [
    ...exampleFiles.map((file) => createCodeTab(file.id)),
    createDiffOverviewTab(),
    ...exampleDiffFiles.map((file) => createDiffFileTab(file.path)),
    ...traceSamples.slice(0, 3).map((sample) => createTraceTab(sample.id)),
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
