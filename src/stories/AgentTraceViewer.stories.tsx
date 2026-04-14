import type { Meta, StoryObj } from "@storybook/react";
import {
  AgentTraceViewer,
  CodeFileTree,
  EditorBreadcrumb,
  FileIcon,
  PanelTab,
  SidebarSection,
  Tab,
  Workbench,
  WorkbenchState,
  createLeaf,
  useWorkbench,
  useWorkbenchActions,
} from "../index";
import {
  getTraceSampleById,
  getTraceSampleByPath,
  traceFileTree,
  traceSamples,
} from "./exampleData";

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
    content: (
      <EditorBreadcrumb filePath={sample.path}>
        <AgentTraceViewer turns={sample.turns} label={sample.title} />
      </EditorBreadcrumb>
    ),
  };
}

function TraceFilesSection() {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const activeGroupId = state.activeGroupId ?? Object.keys(state.groups)[0];
  const activeTabId = activeGroupId ? state.groups[activeGroupId]?.activeTabId : null;
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

function SummaryPanel() {
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
  "fixtures": 5,
  "source": "swe-bench-ultra rollout slices",
  "formats": ["codex", "claude", "gemini", "opencode", "mini-swe-agent"]
}`}
    </pre>
  );
}

const meta = {
  title: "Agent Trace Viewer",
  component: AgentTraceViewer,
  parameters: {
    layout: "fullscreen",
  },
} satisfies Meta<typeof AgentTraceViewer>;

export default meta;

type Story = StoryObj<typeof meta>;

const initialState: Partial<WorkbenchState> = {
  splitTree: createLeaf("group-main"),
  activeGroupId: "group-main",
  groups: {
    "group-main": {
      tabs: traceSamples.map((sample) => createTraceTab(sample.id)),
      activeTabId: "codex-cli-gpt-5.4-xhigh.raw.jsonl",
      mruOrder: traceSamples.map((sample) => sample.id),
    },
  },
};

export const TraceGallery: Story = {
  render: () => {
    const leftSections: SidebarSection[] = [
      {
        id: "trace-files",
        title: "Trace Files",
        content: <TraceFilesSection />,
      },
    ];

    const panelTabs: PanelTab[] = [
      { id: "summary", title: "Summary", content: <SummaryPanel /> },
    ];

    return (
      <div
        style={{
          minHeight: "100vh",
          padding: 16,
          boxSizing: "border-box",
          background: "#111111",
        }}
      >
        <div
          style={{
            width: "min(1480px, calc(100vw - 32px))",
            height: 860,
            margin: "0 auto",
            border: "1px solid #2d2d30",
            borderRadius: 6,
            overflow: "hidden",
            background: "#1e1e1e",
            boxShadow: "0 22px 54px rgba(0, 0, 0, 0.34)",
          }}
        >
          <Workbench
            initialState={initialState}
            activityBar={{ items: [{ id: "trace", title: "Traces", icon: <TraceIcon /> }] }}
            leftSidebar={{ sections: leftSections, defaultWidth: 320, minWidth: 240 }}
            panel={{ tabs: panelTabs, defaultHeight: 140, minHeight: 100 }}
          />
        </div>
      </div>
    );
  },
};
