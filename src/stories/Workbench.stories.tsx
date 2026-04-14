import type { Meta, StoryObj } from "@storybook/react";
import { useCallback, CSSProperties } from "react";
import {
  Workbench,
  useWorkbench,
  useWorkbenchActions,
  Tab,
  SidebarSection,
  PanelTab,
  WorkbenchState,
  createLeaf,
  createBranch,
  DRAG_TYPE,
} from "../index";
import type { ActivityBarItem } from "../components/ActivityBar";
import { setDragTab } from "../utils/dragStore";

// ─── Helpers ─────────────────────────────────────────────────

const fileColors: Record<string, string> = {
  ts: "#3178c6",
  tsx: "#3178c6",
  js: "#f7df1e",
  css: "#264de4",
  json: "#5b5b5b",
  md: "#ffffff",
  html: "#e34c26",
  py: "#3572A5",
};

function FileIcon({ ext }: { ext: string }) {
  return (
    <span
      style={{
        width: 16,
        height: 16,
        display: "inline-flex",
        alignItems: "center",
        justifyContent: "center",
        fontSize: 9,
        fontWeight: 700,
        color: fileColors[ext] ?? "#999",
        fontFamily: "monospace",
      }}
    >
      {ext.toUpperCase()}
    </span>
  );
}

function FakeEditor({ filename }: { filename: string }) {
  const lines = Array.from({ length: 30 }, (_, i) => {
    const indent = i % 5 === 0 ? "" : i % 3 === 0 ? "    " : "  ";
    const keywords = [
      `${indent}import { useState } from 'react';`,
      `${indent}export function ${filename.replace(/\.\w+$/, "")}() {`,
      `${indent}  const [count, setCount] = useState(0);`,
      `${indent}  // ${filename} - line ${i + 1}`,
      `${indent}  return <div>{count}</div>;`,
      `${indent}}`,
      ``,
      `${indent}interface Props {`,
      `${indent}  value: string;`,
      `${indent}  onChange: (v: string) => void;`,
      `${indent}}`,
    ];
    return keywords[i % keywords.length];
  });

  return (
    <div
      style={{
        padding: "8px 16px",
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: 13,
        lineHeight: "20px",
        color: "#d4d4d4",
        whiteSpace: "pre",
        minHeight: "100%",
      }}
    >
      {lines.map((line, i) => (
        <div key={i} style={{ display: "flex" }}>
          <span
            style={{
              width: 50,
              textAlign: "right",
              paddingRight: 16,
              color: "#858585",
              userSelect: "none",
              flexShrink: 0,
            }}
          >
            {i + 1}
          </span>
          <span>{line}</span>
        </div>
      ))}
    </div>
  );
}

function createFileTab(name: string, ext: string, opts?: Partial<Tab>): Tab {
  return {
    id: name,
    title: name,
    icon: <FileIcon ext={ext} />,
    content: <FakeEditor filename={name} />,
    ...opts,
  };
}

// ─── SVG icons ───────────────────────────────────────────────

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

function ExtensionsIcon() {
  return (
    <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
      <rect x="3" y="3" width="8" height="8" rx="1" />
      <rect x="13" y="3" width="8" height="8" rx="1" />
      <rect x="3" y="13" width="8" height="8" rx="1" />
      <rect x="13" y="13" width="8" height="8" rx="1" />
    </svg>
  );
}

// ─── Sidebar content ─────────────────────────────────────────

const files = [
  { name: "App.tsx", ext: "tsx" },
  { name: "index.ts", ext: "ts" },
  { name: "styles.css", ext: "css" },
  { name: "package.json", ext: "json" },
  { name: "README.md", ext: "md" },
  { name: "server.py", ext: "py" },
  { name: "vite.config.ts", ext: "ts" },
  { name: "tsconfig.json", ext: "json" },
  { name: "utils.ts", ext: "ts" },
  { name: "hooks.ts", ext: "ts" },
  { name: "types.ts", ext: "ts" },
  { name: "api.ts", ext: "ts" },
  { name: "auth.ts", ext: "ts" },
  { name: "router.tsx", ext: "tsx" },
  { name: "store.ts", ext: "ts" },
];

function FileTree() {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const groupId = state.activeGroupId ?? Object.keys(state.groups)[0];

  const handleClick = useCallback(
    (file: { name: string; ext: string }) => {
      if (!groupId) return;
      actions.openTab(groupId, createFileTab(file.name, file.ext));
    },
    [groupId, actions]
  );

  const handleDragStart = useCallback(
    (e: React.DragEvent, file: { name: string; ext: string }) => {
      const tab = createFileTab(file.name, file.ext);
      // Store full tab (with React elements) in the drag store
      setDragTab(tab);
      // Serializable marker in dataTransfer so drop targets can identify this drag
      e.dataTransfer.setData(
        DRAG_TYPE,
        JSON.stringify({ type: "sidebar-file", tabId: tab.id })
      );
      e.dataTransfer.effectAllowed = "copy";
    },
    []
  );

  const itemStyle: CSSProperties = {
    padding: "2px 8px 2px 24px",
    cursor: "pointer",
    fontSize: 13,
    display: "flex",
    alignItems: "center",
    gap: 6,
    whiteSpace: "nowrap",
  };

  return (
    <div>
      {files.map((f) => (
        <div
          key={f.name}
          style={itemStyle}
          draggable
          onClick={() => handleClick(f)}
          onDragStart={(e) => handleDragStart(e, f)}
          onMouseOver={(e) => {
            (e.currentTarget as HTMLElement).style.background = "var(--mosaic-bg-tertiary)";
          }}
          onMouseOut={(e) => {
            (e.currentTarget as HTMLElement).style.background = "transparent";
          }}
        >
          <FileIcon ext={f.ext} />
          <span>{f.name}</span>
        </div>
      ))}
    </div>
  );
}

function OutlinePanel() {
  const symbols = [
    "App (function)",
    "  props (const)",
    "  handleClick (function)",
    "  state (const)",
    "  useEffect (hook)",
    "Header (function)",
    "Footer (function)",
    "utils (module)",
    "  formatDate (function)",
    "  parseJSON (function)",
  ];

  return (
    <div>
      {symbols.map((s, i) => (
        <div
          key={i}
          style={{
            padding: "2px 8px",
            fontSize: 12,
            color: "var(--mosaic-sidebar-fg)",
            cursor: "pointer",
            whiteSpace: "pre",
          }}
        >
          {s}
        </div>
      ))}
    </div>
  );
}

// ─── Panel content (bottom bar) ──────────────────────────────

function TerminalContent() {
  return (
    <div
      style={{
        padding: "8px 12px",
        fontFamily: "'Cascadia Code', 'Fira Code', 'Consolas', monospace",
        fontSize: 13,
        lineHeight: "20px",
        color: "#cccccc",
        whiteSpace: "pre",
      }}
    >
      <div style={{ color: "#6a9955" }}>~/react-code-panes $</div>
      <div>npm run storybook</div>
      <div style={{ color: "#569cd6" }}>Storybook 8.6.18 for react-vite started</div>
      <div>Local: http://localhost:6006/</div>
      <div style={{ color: "#6a9955" }}>~/react-code-panes $</div>
      <div style={{ color: "#585858" }}>|</div>
    </div>
  );
}

function ProblemsContent() {
  return (
    <div style={{ padding: "8px 12px", fontSize: 13, color: "var(--mosaic-editor-fg)" }}>
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "2px 0" }}>
        <span style={{ color: "#f48771" }}>E</span>
        <span>styles.css: Unknown property 'colr' (line 12)</span>
      </div>
      <div style={{ display: "flex", gap: 8, alignItems: "center", padding: "2px 0" }}>
        <span style={{ color: "#cca700" }}>W</span>
        <span>index.ts: 'unused' is declared but never used (line 3)</span>
      </div>
    </div>
  );
}

function OutputContent() {
  return (
    <div
      style={{
        padding: "8px 12px",
        fontFamily: "monospace",
        fontSize: 12,
        lineHeight: "18px",
        color: "#858585",
      }}
    >
      <div>[Info] Build started...</div>
      <div>[Info] Compiled 42 modules in 1.2s</div>
      <div>[Info] Build complete.</div>
    </div>
  );
}

// ─── Story Configuration ─────────────────────────────────────

const meta: Meta<typeof Workbench> = {
  title: "Workbench",
  component: Workbench,
  parameters: { layout: "fullscreen" },
  decorators: [
    (Story) => (
      <div style={{ width: "100vw", height: "100vh" }}>
        <Story />
      </div>
    ),
  ],
};

export default meta;
type Story = StoryObj<typeof Workbench>;

// ─── Shared config ───────────────────────────────────────────

const activityBarItems: ActivityBarItem[] = [
  { id: "explorer", icon: <ExplorerIcon />, title: "Explorer" },
  { id: "search", icon: <SearchIcon />, title: "Search" },
  { id: "git", icon: <GitIcon />, title: "Source Control" },
  { id: "extensions", icon: <ExtensionsIcon />, title: "Extensions" },
];

const leftSections: SidebarSection[] = [
  { id: "files", title: "Explorer", content: <FileTree />, defaultHeight: 400 },
  { id: "outline", title: "Outline", content: <OutlinePanel />, defaultHeight: 200 },
];

const rightSections: SidebarSection[] = [
  { id: "outline-right", title: "Document Outline", content: <OutlinePanel />, defaultHeight: 300 },
];

const panelTabs: PanelTab[] = [
  { id: "terminal", title: "Terminal", content: <TerminalContent /> },
  { id: "problems", title: "Problems", content: <ProblemsContent /> },
  { id: "output", title: "Output", content: <OutputContent /> },
];

// ─── Initial states ──────────────────────────────────────────

function makeInitialState(): Partial<WorkbenchState> {
  const groupId = "group-0";
  return {
    splitTree: createLeaf(groupId),
    groups: {
      [groupId]: {
        tabs: [
          createFileTab("App.tsx", "tsx"),
          createFileTab("index.ts", "ts"),
          createFileTab("styles.css", "css", { isDirty: true }),
        ],
        activeTabId: "App.tsx",
        mruOrder: ["App.tsx", "index.ts", "styles.css"],
      },
    },
    activeGroupId: groupId,
  };
}

function makeSplitState(): Partial<WorkbenchState> {
  return {
    splitTree: createBranch("horizontal", [
      createLeaf("group-left"),
      createBranch("vertical", [
        createLeaf("group-top-right"),
        createLeaf("group-bottom-right"),
      ]),
    ]),
    groups: {
      "group-left": {
        tabs: [createFileTab("App.tsx", "tsx"), createFileTab("index.ts", "ts")],
        activeTabId: "App.tsx",
        mruOrder: ["App.tsx", "index.ts"],
      },
      "group-top-right": {
        tabs: [createFileTab("styles.css", "css")],
        activeTabId: "styles.css",
        mruOrder: ["styles.css"],
      },
      "group-bottom-right": {
        tabs: [createFileTab("package.json", "json"), createFileTab("tsconfig.json", "json")],
        activeTabId: "package.json",
        mruOrder: ["package.json", "tsconfig.json"],
      },
    },
    activeGroupId: "group-left",
  };
}

function makeManyTabsState(): Partial<WorkbenchState> {
  const groupId = "group-0";
  const tabs = Array.from({ length: 20 }, (_, i) => {
    const ext = ["ts", "tsx", "css", "json", "md"][i % 5]!;
    return createFileTab(`file-${i + 1}.${ext}`, ext, { isDirty: i % 4 === 0 });
  });
  return {
    splitTree: createLeaf(groupId),
    groups: {
      [groupId]: { tabs, activeTabId: tabs[0].id, mruOrder: tabs.map((t) => t.id) },
    },
    activeGroupId: groupId,
  };
}

// ─── Stories ─────────────────────────────────────────────────

export const FullWorkbench: Story = {
  render: () => (
    <Workbench
      initialState={makeInitialState()}
      activityBar={{ items: activityBarItems }}
      leftSidebar={{ title: "Explorer", sections: leftSections, defaultWidth: 260, minWidth: 170 }}
      rightSidebar={{ title: "Outline", sections: rightSections, defaultWidth: 220, minWidth: 170 }}
      panel={{ tabs: panelTabs, defaultHeight: 200, minHeight: 80 }}
      theme="dark"
    />
  ),
};

export const LightTheme: Story = {
  render: () => (
    <Workbench
      initialState={makeInitialState()}
      activityBar={{ items: activityBarItems }}
      leftSidebar={{ title: "Explorer", sections: leftSections, defaultWidth: 260, minWidth: 170 }}
      panel={{ tabs: panelTabs, defaultHeight: 200, minHeight: 80 }}
      theme="light"
    />
  ),
};

export const PreSplitLayout: Story = {
  render: () => (
    <Workbench
      initialState={makeSplitState()}
      activityBar={{ items: activityBarItems }}
      leftSidebar={{ title: "Explorer", sections: leftSections, defaultWidth: 240, minWidth: 170 }}
      panel={{ tabs: panelTabs, defaultHeight: 180, minHeight: 80 }}
      theme="dark"
    />
  ),
};

export const MinimalEditor: Story = {
  render: () => (
    <Workbench initialState={makeInitialState()} theme="dark" />
  ),
};

export const ManyTabs: Story = {
  render: () => (
    <Workbench initialState={makeManyTabsState()} theme="dark" />
  ),
};

export const EmptyWorkbench: Story = {
  render: () => (
    <Workbench
      activityBar={{ items: activityBarItems }}
      leftSidebar={{ title: "Explorer", sections: leftSections, defaultWidth: 260 }}
      panel={{ tabs: panelTabs, defaultHeight: 200 }}
      theme="dark"
    />
  ),
};
