// ─── Components ──────────────────────────────────────────────
export { Workbench } from "./components/Workbench";
export type { WorkbenchProps } from "./components/Workbench";
export { useWorkbench, useWorkbenchActions, useActiveWorkbenchGroupId } from "./context/WorkbenchContext";
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
export { FileIcon, FolderIcon, getStatusColor, getStatusLetter } from "./components/FileIcon";
export { EditorBreadcrumb } from "./components/EditorBreadcrumb";
export { UnifiedDiffPreview } from "./components/UnifiedDiffPreview";
export { MonacoCodeViewer } from "./components/MonacoCodeViewer";
export { MonacoDiffViewer } from "./components/MonacoDiffViewer";
export { AgentTraceViewer } from "./components/AgentTraceViewer";
export { CodeFileTree } from "./components/CodeFileTree";
export { ChangedFilesList } from "./components/ChangedFilesList";

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
  TabFactory,
  TabDragData,
  GroupDragData,
  DragData,
} from "./types";
export { DRAG_TYPE } from "./types";
export type { CodeFileTreeItem } from "./components/CodeFileTree";
export type { ChangedFileItem } from "./components/ChangedFilesList";
export type {
  AgentTraceTurnType,
  AgentTraceToolCall,
  AgentTraceToolResult,
  AgentTraceTurn,
} from "./types/agentTrace";

// ─── Tree utilities (for advanced/programmatic use) ──────────
export { createLeaf, createBranch } from "./utils/splitTree";
export { parseUnifiedDiffFiles } from "./utils/unifiedDiff";
export { parseAgentTrace } from "./utils/agentTrace";

// ─── Drag helpers (for custom draggable sidebar items) ───────
export { setDragTab, getDragTab, clearDragTab } from "./utils/dragStore";

// Consumers should import the packaged stylesheet explicitly:
//   import "react-code-panes/styles.css";
