// ─── Components ──────────────────────────────────────────────
export { Workbench } from "./components/Workbench";
export type { WorkbenchProps } from "./components/Workbench";
export { useWorkbench, useWorkbenchActions } from "./context/WorkbenchContext";
export type { Action } from "./context/WorkbenchContext";
export { WorkbenchProvider } from "./context/WorkbenchContext";
export { SplitPane } from "./components/SplitPane";
export { TabBar } from "./components/TabBar";
export { EditorGroup } from "./components/EditorGroup";
export { Sidebar } from "./components/Sidebar";
export { ActivityBar } from "./components/ActivityBar";
export type { ActivityBarItem } from "./components/ActivityBar";
export { Panel } from "./components/Panel";
export { Sash } from "./components/Sash";
export { DropOverlay } from "./components/DropOverlay";

// ─── Types ───────────────────────────────────────────────────
export type {
  Orientation,
  SplitNode,
  SplitBranch,
  SplitLeaf,
  Tab,
  EditorGroupState,
  SidebarSection,
  SidebarConfig,
  PanelTab,
  PanelConfig,
  DropPosition,
  WorkbenchState,
  TabDragData,
  GroupDragData,
  DragData,
} from "./types";
export { DRAG_TYPE } from "./types";

// ─── Tree utilities (for advanced/programmatic use) ──────────
export { createLeaf, createBranch } from "./utils/splitTree";

// ─── Drag helpers (for custom draggable sidebar items) ───────
export { setDragTab, getDragTab, clearDragTab } from "./utils/dragStore";

// Consumers should import the packaged stylesheet explicitly:
//   import "react-code-panes/styles.css";
