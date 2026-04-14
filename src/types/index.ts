import { ReactNode } from "react";

// ─── Split Tree ──────────────────────────────────────────────

export type Orientation = "horizontal" | "vertical";

export type SplitNode = SplitBranch | SplitLeaf;

export interface SplitBranch {
  type: "branch";
  orientation: Orientation;
  children: SplitNode[];
  /** Sizes as fractions (0-1) summing to 1 */
  sizes: number[];
}

export interface SplitLeaf {
  type: "leaf";
  groupId: string;
}

// ─── Tabs / Editor Groups ────────────────────────────────────

export interface Tab {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  isDirty?: boolean;
  isPinned?: boolean;
  isPreview?: boolean;
  /** When false, hides the close button and prevents closing. Defaults to true. */
  closable?: boolean;
  /** Optional CSS color for the tab label text (e.g. git status coloring). */
  labelColor?: string;
}

export interface EditorGroupState {
  tabs: Tab[];
  activeTabId: string | null;
  /** MRU order of tab ids for focus-after-close */
  mruOrder: string[];
}

// ─── Sidebar ─────────────────────────────────────────────────

export interface SidebarSection {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
  isCollapsed?: boolean;
  /** default: 200 */
  defaultHeight?: number;
  /** Rendered in the section header bar, right-aligned (e.g. toggle buttons). */
  headerActions?: ReactNode;
}

export interface SidebarConfig {
  sections: SidebarSection[];
  /** default: 240 */
  defaultWidth?: number;
  minWidth?: number;
}

// ─── Panel (bottom bar) ──────────────────────────────────────

export interface PanelTab {
  id: string;
  title: string;
  icon?: ReactNode;
  content: ReactNode;
}

export interface PanelConfig {
  tabs: PanelTab[];
  /** default: 200 */
  defaultHeight?: number;
  minHeight?: number;
}

// ─── Drop Zones ──────────────────────────────────────────────

export type DropPosition = "left" | "right" | "top" | "bottom" | "center";

// ─── Workbench ───────────────────────────────────────────────

export interface WorkbenchState {
  splitTree: SplitNode;
  groups: Record<string, EditorGroupState>;
  activeGroupId: string | null;
}

// ─── Drag Data ───────────────────────────────────────────────

export interface TabDragData {
  type: "tab";
  tabId: string;
  sourceGroupId: string;
}

export interface SidebarFileDragData {
  type: "sidebar-file";
  tab: Tab;
}

export interface GroupDragData {
  type: "group";
  groupId: string;
}

export type DragData = TabDragData | GroupDragData | SidebarFileDragData;

export const DRAG_TYPE = "application/x-react-code-panes";
