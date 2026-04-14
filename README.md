# react-code-panes

VS Code-style split panes, editor tabs, sidebars, and bottom panels for React.

The package is framework-agnostic on the React side and ships plain CSS for layout and theming. It works fine in Tailwind apps, but it is not implemented with Tailwind classes.

## Features

- Nested horizontal and vertical split panes with draggable sashes
- Editor tab groups with close, reorder, split, dirty, preview, and MRU behavior
- Left and right sidebars with collapsible, resizable, reorderable sections
- Bottom panel with draggable tabs and persisted active-tab state
- Cross-container drag between sidebars, panel, and editor tabs
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

```tsx
import "react-code-panes/styles.css";
import { Workbench, createLeaf } from "react-code-panes";

function App() {
  return (
    <div style={{ width: "100vw", height: "100vh" }}>
      <Workbench
        initialState={{
          splitTree: createLeaf("main"),
          groups: {
            main: {
              tabs: [
                { id: "file1", title: "index.ts", content: <div>Hello</div> },
                { id: "file2", title: "app.tsx", content: <div>World</div> },
              ],
              activeTabId: "file1",
              mruOrder: ["file1", "file2"],
            },
          },
          activeGroupId: "main",
        }}
        leftSidebar={{
          title: "Explorer",
          sections: [
            { id: "files", title: "Files", content: <div>File tree here</div> },
          ],
        }}
        panel={{
          tabs: [
            { id: "terminal", title: "Terminal", content: <div>$ _</div> },
          ],
        }}
        theme="dark"
      />
    </div>
  );
}
```

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
