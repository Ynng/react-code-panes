# react-code-panes

VS Code-style split panes, editor tabs, sidebars, and bottom panels for React.

It is a good fit for dashboards and inspector-style interfaces where the main content is already React components: code viewers, AI trajectories, logs, diffs, evaluation details, or other drill-down panels.

![react-code-panes screenshot](docs/images/workbench-full.png)

The package is framework-agnostic on the React side and ships plain CSS for layout and theming. It works fine in Tailwind apps, but it is not implemented with Tailwind classes.

## Features

- Nested horizontal and vertical split panes with draggable sashes
- Editor tab groups with close, reorder, split, dirty, preview, and MRU behavior
- Left and right sidebars with collapsible, resizable, reorderable sections
- Bottom panel with draggable tabs and persisted active-tab state
- Cross-container drag between sidebars, panel, and editor tabs
- Built-in code review primitives: `CodeFileTree`, `ChangedFilesList`, `MonacoCodeViewer`, `MonacoDiffViewer`, `UnifiedDiffPreview`
- Built-in agent trace support via `AgentTraceViewer` and `parseAgentTrace(...)`
- Self-contained Material-style file and folder icons
- Dark and light themes via CSS custom properties
- TypeScript types and a Storybook demo with Playwright coverage

## Install

```bash
npm install react-code-panes
```

Import the packaged stylesheet once in your app:

```tsx
import "react-code-panes/styles.css";
```

## Quick Start

The main thing to know: `Workbench` fills the size of its parent. In most apps you will embed it inside an existing layout region with a bounded height, not mount it fullscreen.

```tsx
import "react-code-panes/styles.css";
import { Workbench, createLeaf } from "react-code-panes";
import type { PanelTab, SidebarSection, Tab } from "react-code-panes";

function CodeFileView({ path, code }: { path: string; code: string }) {
  return (
    <div style={{ padding: 16, fontFamily: "monospace", whiteSpace: "pre", overflow: "auto", height: "100%" }}>
      <div style={{ opacity: 0.6, marginBottom: 12 }}>{path}</div>
      {code}
    </div>
  );
}

function JsonView({ value }: { value: unknown }) {
  return (
    <pre style={{ margin: 0, padding: 16, overflow: "auto", height: "100%" }}>
      {JSON.stringify(value, null, 2)}
    </pre>
  );
}

function TrajectoryView({ steps }: { steps: Array<{ title: string; detail: string }> }) {
  return (
    <div style={{ padding: 16, display: "grid", gap: 12 }}>
      {steps.map((step, index) => (
        <div key={index} style={{ border: "1px solid rgba(255,255,255,0.08)", borderRadius: 8, padding: 12 }}>
          <div style={{ fontWeight: 600, marginBottom: 4 }}>{step.title}</div>
          <div style={{ opacity: 0.8 }}>{step.detail}</div>
        </div>
      ))}
    </div>
  );
}

const files: Array<{ id: string; title: string; code: string }> = [
  {
    id: "app.tsx",
    title: "app.tsx",
    code: "export function App() {\n  return <main>Review dashboard</main>;\n}\n",
  },
  {
    id: "evaluator.json",
    title: "evaluator.json",
    code: '{\n  "status": "pass",\n  "score": 0.92\n}\n',
  },
];

function makeFileTab(file: (typeof files)[number]): Tab {
  return {
    id: file.id,
    title: file.title,
    content: <CodeFileView path={file.title} code={file.code} />,
  };
}

const leftSidebarSections: SidebarSection[] = [
  {
    id: "files",
    title: "Files",
    defaultHeight: 280,
    content: (
      <div style={{ padding: 8 }}>
        {files.map((file) => (
          <div key={file.id} style={{ padding: "6px 10px" }}>
            {file.title}
          </div>
        ))}
      </div>
    ),
  },
];

const panelTabs: PanelTab[] = [
  {
    id: "trajectory",
    title: "Trajectory",
    content: (
      <TrajectoryView
        steps={[
          { title: "Inspect diff", detail: "Agent opened the patch and looked for the regression." },
          { title: "Run tests", detail: "It reproduced the failing evaluator path before making changes." },
          { title: "Patch", detail: "It fixed the exit behavior and reran validation." },
        ]}
      />
    ),
  },
  {
    id: "metadata",
    title: "Metadata",
    content: <JsonView value={{ taskId: "example__task-1", verdict: "pass", runtimeSec: 84 }} />,
  },
];

export function ReviewWorkbench() {
  return (
    <section style={{ minHeight: 560, height: "70vh", border: "1px solid #2d2d2d" }}>
      <Workbench
        theme="dark"
        initialState={{
          splitTree: createLeaf("main"),
          groups: {
            main: {
              tabs: [makeFileTab(files[0]), makeFileTab(files[1])],
              activeTabId: files[0].id,
              mruOrder: files.map((file) => file.id),
            },
          },
          activeGroupId: "main",
        }}
        leftSidebar={{
          title: "Explorer",
          sections: leftSidebarSections,
          defaultWidth: 260,
          minWidth: 180,
        }}
        panel={{
          tabs: panelTabs,
          defaultHeight: 200,
          minHeight: 96,
        }}
      />
    </section>
  );
}
```

## Layout Pattern

`Workbench` uses `width: 100%` and `height: 100%`, so the parent element must define the available size.

Typical patterns:

- a dashboard card or page region with a fixed or viewport-relative height
- a CSS grid area with `min-height: 0`
- a flex child that gets remaining space from an app shell

Example:

```tsx
<div style={{ display: "grid", gridTemplateRows: "auto minmax(0, 1fr)", height: "100vh" }}>
  <Header />
  <main style={{ minHeight: 0 }}>
    <ReviewWorkbench />
  </main>
</div>
```

## What Goes In Tabs

Tabs and sidebar sections accept `ReactNode` content, so in practice you usually render your own components:

- code viewers
- diff viewers
- logs and terminal output
- JSON inspectors
- AI trajectory or trace views
- screenshots or artifacts
- custom forms and admin panels

The library handles pane layout, tabs, drag/drop, and resizing. Your app owns the actual content components.

## Built-in Review Components

If you want a stronger default out of the box, the package now exports a small review-oriented component set:

- `CodeFileTree` for nested explorer trees with file icons, status badges, and optional drag-to-tab behavior
- `ChangedFilesList` for compact changed-file sidebars
- `MonacoCodeViewer` for read-only file views
- `MonacoDiffViewer` for before/after file diffs
- `UnifiedDiffPreview` for full unified patch inspection
- `AgentTraceViewer` for rendered agent traces
- `parseAgentTrace(raw)` for Claude Code, Codex CLI, OpenCode, Gemini CLI, and mini-swe-agent trace formats

The flagship Storybook workbench uses these pieces together to show a realistic review surface rather than a toy fullscreen editor.

## Styling

The library uses scoped class names under `.mosaic-workbench` and `.mosaic-*`, so it generally coexists cleanly with app CSS and Tailwind.

- It does not reset global `html`, `body`, or element styles outside the workbench container.
- It does ship plain CSS with fixed layout rules for the workbench itself.
- Colors, fonts, and many visual tokens are exposed as CSS custom properties.

Override tokens on `.mosaic-workbench` or a parent element:

```css
.mosaic-workbench {
  --mosaic-bg: #111827;
  --mosaic-tab-border-active: #22c55e;
  --mosaic-sash-hover: #22c55e;
  --mosaic-font-family: "Inter", sans-serif;
}
```

## Tailwind Compatibility

Yes. The package is compatible with Tailwind apps.

- Use Tailwind for the surrounding page and for content you render inside tabs or sidebars.
- Import `react-code-panes/styles.css` once so the workbench layout styles are present.
- Override the CSS variables or add targeted selectors if you want the workbench to match your design system.

## Components

### `<Workbench>`

Top-level layout component that combines the activity bar, sidebars, editor area, and bottom panel.

Key props:

- `initialState`: initial split tree, groups, and active group
- `leftSidebar`: left sidebar configuration
- `rightSidebar`: right sidebar configuration
- `panel`: bottom panel configuration
- `activityBar`: activity bar items
- `showToolbar`: show or hide the toolbar
- `theme`: `"dark"` or `"light"`

### Lower-level components

`SplitPane`, `TabBar`, `EditorGroup`, `Sidebar`, `Panel`, `ActivityBar`, `Sash`, and `DropOverlay` are also exported.

- `EditorGroup` and `SplitPane` require `WorkbenchProvider` context.
- `Sidebar`, `Panel`, `ActivityBar`, and `TabBar` are useful for more custom compositions.

## Hooks

### `useWorkbench()`

Returns `{ state, dispatch }`.

### `useWorkbenchActions()`

Returns action helpers including:

- `openTab`
- `closeTab`
- `setActiveTab`
- `setActiveGroup`
- `moveTab`
- `updateSizes`
- `reorderTab`
- `activateOrOpenTab`
- `pinTab`
- `unpinTab`
- `confirmTab`
- `setTabDirty`
- `dispatch`

## Custom Drag Sources

To make custom sidebar items draggable into the editor area:

```tsx
import { DRAG_TYPE, setDragTab } from "react-code-panes";

function DraggableItem({ tab }: { tab: any }) {
  return (
    <div
      draggable
      onDragStart={(e) => {
        setDragTab(tab);
        e.dataTransfer.setData(
          DRAG_TYPE,
          JSON.stringify({ type: "sidebar-file", tabId: tab.id })
        );
      }}
    >
      {tab.title}
    </div>
  );
}
```

## Local Development

```bash
npm run build
npm run storybook
npm run build-storybook
npm run test:e2e
```

## License

MIT
