import { useState, useCallback, useRef, useEffect, ReactNode } from "react";
import { WorkbenchProvider, useWorkbench, useWorkbenchActions } from "../context/WorkbenchContext";
import { SplitPane } from "./SplitPane";
import { ActivityBar, ActivityBarItem } from "./ActivityBar";
import { Sidebar } from "./Sidebar";
import { Panel } from "./Panel";
import { SidebarConfig, SidebarSection, PanelConfig, PanelTab, WorkbenchState } from "../types";

import "../styles/reset.css";
import "../styles/themes.css";
import "../styles/components.css";

// Container IDs for cross-container drag
const LEFT_CONTAINER = "sidebar-left";
const RIGHT_CONTAINER = "sidebar-right";
const PANEL_CONTAINER = "panel";

function mergeSections(prev: SidebarSection[], next: SidebarSection[]) {
  const nextById = new Map(next.map((section) => [section.id, section]));
  const retainedIds = prev.map((section) => section.id).filter((id) => nextById.has(id));
  const appendedIds = next.map((section) => section.id).filter((id) => !retainedIds.includes(id));
  const orderedIds = [...retainedIds, ...appendedIds];

  return orderedIds
    .map((id) => {
      const incoming = nextById.get(id);
      if (!incoming) return null;
      const existing = prev.find((section) => section.id === id);
      if (!existing) return incoming;
      return {
        ...incoming,
        isCollapsed: existing.isCollapsed,
      };
    })
    .filter((section): section is SidebarSection => section !== null);
}

interface WorkbenchInnerProps {
  leftSidebar?: SidebarConfig & { title?: string };
  rightSidebar?: SidebarConfig & { title?: string };
  panel?: PanelConfig;
  activityBar?: { items: ActivityBarItem[] };
  showToolbar?: boolean;
  theme?: "dark" | "light";
}

function WorkbenchInner({
  leftSidebar: leftSidebarProp,
  rightSidebar: rightSidebarProp,
  panel: panelProp,
  activityBar,
  showToolbar = true,
  theme = "dark",
}: WorkbenchInnerProps) {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();

  // ── Lifted state ──────────────────────────────────────────

  const [leftSections, setLeftSections] = useState<SidebarSection[]>(
    leftSidebarProp?.sections ?? []
  );
  const [rightSections, setRightSections] = useState<SidebarSection[]>(
    rightSidebarProp?.sections ?? []
  );
  const [panelTabs, setPanelTabs] = useState<PanelTab[]>(panelProp?.tabs ?? []);
  const [panelActiveTabId, setPanelActiveTabId] = useState<string>(
    panelProp?.tabs[0]?.id ?? ""
  );

  useEffect(() => {
    setLeftSections((prev) => mergeSections(prev, leftSidebarProp?.sections ?? []));
  }, [leftSidebarProp?.sections]);

  useEffect(() => {
    setRightSections((prev) => mergeSections(prev, rightSidebarProp?.sections ?? []));
  }, [rightSidebarProp?.sections]);

  // ── Visibility & sizing ───────────────────────────────────

  const [activeActivityId, setActiveActivityId] = useState<string | null>(
    activityBar?.items[0]?.id ?? null
  );
  const [leftVisible, setLeftVisible] = useState(!!leftSidebarProp);
  const [rightVisible, setRightVisible] = useState(!!rightSidebarProp);
  const [panelVisible, setPanelVisible] = useState(!!panelProp);
  const [leftWidth, setLeftWidth] = useState(leftSidebarProp?.defaultWidth ?? 240);
  const [rightWidth, setRightWidth] = useState(rightSidebarProp?.defaultWidth ?? 240);
  const [panelHeight, setPanelHeight] = useState(panelProp?.defaultHeight ?? 200);

  const lastLeftWidth = useRef(leftSidebarProp?.defaultWidth ?? 240);
  const lastRightWidth = useRef(rightSidebarProp?.defaultWidth ?? 240);
  const lastPanelHeight = useRef(panelProp?.defaultHeight ?? 200);

  const leftMinWidth = leftSidebarProp?.minWidth ?? 170;
  const rightMinWidth = rightSidebarProp?.minWidth ?? 170;
  const panelMinHeight = panelProp?.minHeight ?? 80;

  // ── Section toggle (lifted) ───────────────────────────────

  const handleLeftSectionToggle = useCallback((sectionId: string) => {
    setLeftSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, isCollapsed: !s.isCollapsed } : s))
    );
  }, []);

  const handleRightSectionToggle = useCallback((sectionId: string) => {
    setRightSections((prev) =>
      prev.map((s) => (s.id === sectionId ? { ...s, isCollapsed: !s.isCollapsed } : s))
    );
  }, []);

  // ── Cross-container move helpers ──────────────────────────

  const removeFromContainer = useCallback((containerId: string, itemId: string) => {
    if (containerId === LEFT_CONTAINER) {
      setLeftSections((prev) => prev.filter((s) => s.id !== itemId));
    } else if (containerId === RIGHT_CONTAINER) {
      setRightSections((prev) => prev.filter((s) => s.id !== itemId));
    } else if (containerId === PANEL_CONTAINER) {
      setPanelTabs((prev) => {
        const filtered = prev.filter((t) => t.id !== itemId);
        // If we removed the active tab, activate the first remaining
        setPanelActiveTabId((activeId) =>
          activeId === itemId ? (filtered[0]?.id ?? "") : activeId
        );
        return filtered;
      });
    }
  }, []);

  // When a sidebar receives a cross-container drop
  const handleLeftMoveIn = useCallback(
    (section: SidebarSection, targetIndex: number, sourceContainerId: string) => {
      removeFromContainer(sourceContainerId, section.id);
      setLeftSections((prev) => {
        if (prev.some((s) => s.id === section.id)) return prev; // already here
        const next = [...prev];
        next.splice(targetIndex, 0, section);
        return next;
      });
    },
    [removeFromContainer]
  );

  const handleRightMoveIn = useCallback(
    (section: SidebarSection, targetIndex: number, sourceContainerId: string) => {
      removeFromContainer(sourceContainerId, section.id);
      setRightSections((prev) => {
        if (prev.some((s) => s.id === section.id)) return prev;
        const next = [...prev];
        next.splice(targetIndex, 0, section);
        return next;
      });
    },
    [removeFromContainer]
  );

  const handlePanelMoveIn = useCallback(
    (item: PanelTab, targetIndex: number, sourceContainerId: string) => {
      removeFromContainer(sourceContainerId, item.id);
      setPanelTabs((prev) => {
        if (prev.some((t) => t.id === item.id)) return prev;
        const next = [...prev];
        next.splice(targetIndex, 0, item);
        return next;
      });
      setPanelActiveTabId(item.id);
    },
    [removeFromContainer]
  );


  // ── Sidebar resize ────────────────────────────────────────

  const resizingRef = useRef<{
    side: "left" | "right";
    startX: number;
    startWidth: number;
  } | null>(null);

  const handleSidebarMouseMove = useRef((e: MouseEvent) => {
    const r = resizingRef.current;
    if (!r) return;
    const delta = e.clientX - r.startX;
    const newWidth = r.side === "left" ? r.startWidth + delta : r.startWidth - delta;
    const minW = r.side === "left" ? leftMinWidth : rightMinWidth;

    if (newWidth < minW - 30) {
      if (r.side === "left") setLeftVisible(false);
      else setRightVisible(false);
      return;
    }

    const clamped = Math.max(minW, Math.min(newWidth, 600));
    if (r.side === "left") {
      setLeftVisible(true);
      setLeftWidth(clamped);
      lastLeftWidth.current = clamped;
    } else {
      setRightVisible(true);
      setRightWidth(clamped);
      lastRightWidth.current = clamped;
    }
  }).current;

  const handleSidebarMouseUp = useRef(() => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleSidebarMouseMove);
    document.removeEventListener("mouseup", handleSidebarMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }).current;

  const handleSidebarResizeStart = useCallback(
    (e: React.MouseEvent, side: "left" | "right") => {
      e.preventDefault();
      resizingRef.current = {
        side,
        startX: e.clientX,
        startWidth: side === "left" ? leftWidth : rightWidth,
      };
      document.body.style.cursor = "col-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleSidebarMouseMove);
      document.addEventListener("mouseup", handleSidebarMouseUp);
    },
    [leftWidth, rightWidth, handleSidebarMouseMove, handleSidebarMouseUp]
  );

  // ── Panel resize ──────────────────────────────────────────

  const panelResizeRef = useRef<{ startY: number; startHeight: number } | null>(null);

  const handlePanelMouseMove = useRef((e: MouseEvent) => {
    const r = panelResizeRef.current;
    if (!r) return;
    const delta = r.startY - e.clientY;
    const newHeight = r.startHeight + delta;

    if (newHeight < panelMinHeight - 30) {
      setPanelVisible(false);
      return;
    }

    const clamped = Math.max(panelMinHeight, Math.min(newHeight, 600));
    setPanelVisible(true);
    setPanelHeight(clamped);
    lastPanelHeight.current = clamped;
  }).current;

  const handlePanelMouseUp = useRef(() => {
    panelResizeRef.current = null;
    document.removeEventListener("mousemove", handlePanelMouseMove);
    document.removeEventListener("mouseup", handlePanelMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }).current;

  const handlePanelResizeStart = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      panelResizeRef.current = { startY: e.clientY, startHeight: panelHeight };
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handlePanelMouseMove);
      document.addEventListener("mouseup", handlePanelMouseUp);
    },
    [panelHeight, handlePanelMouseMove, handlePanelMouseUp]
  );

  // Cleanup
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleSidebarMouseMove);
      document.removeEventListener("mouseup", handleSidebarMouseUp);
      document.removeEventListener("mousemove", handlePanelMouseMove);
      document.removeEventListener("mouseup", handlePanelMouseUp);
    };
  }, [handleSidebarMouseMove, handleSidebarMouseUp, handlePanelMouseMove, handlePanelMouseUp]);

  // ── Toggles ───────────────────────────────────────────────

  const toggleLeft = useCallback(() => {
    setLeftVisible((v) => { if (!v) setLeftWidth(lastLeftWidth.current); return !v; });
  }, []);

  const toggleRight = useCallback(() => {
    setRightVisible((v) => { if (!v) setRightWidth(lastRightWidth.current); return !v; });
  }, []);

  const togglePanel = useCallback(() => {
    setPanelVisible((v) => { if (!v) setPanelHeight(lastPanelHeight.current); return !v; });
  }, []);

  const handleActivitySelect = useCallback(
    (id: string) => {
      if (id === activeActivityId && leftVisible) setLeftVisible(false);
      else { setActiveActivityId(id); setLeftVisible(true); setLeftWidth(lastLeftWidth.current); }
    },
    [activeActivityId, leftVisible]
  );

  // ── Keyboard shortcuts ────────────────────────────────────

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      const mod = e.metaKey || e.ctrlKey;
      if (mod && e.key === "b") { e.preventDefault(); toggleLeft(); return; }
      if (mod && e.key === "i") { e.preventDefault(); toggleRight(); return; }
      if (mod && e.key === "`") { e.preventDefault(); togglePanel(); return; }
      if (mod && e.key === "w") {
        e.preventDefault();
        const gid = state.activeGroupId;
        if (!gid) return;
        const group = state.groups[gid];
        if (group?.activeTabId) actions.closeTab(gid, group.activeTabId);
      }
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [toggleLeft, toggleRight, togglePanel, state.activeGroupId, state.groups, actions]);

  // ── Render ────────────────────────────────────────────────

  return (
    <div className="mosaic-workbench" data-theme={theme}>
      {activityBar && (
        <ActivityBar
          items={activityBar.items}
          activeId={leftVisible ? activeActivityId : null}
          onSelect={handleActivitySelect}
        />
      )}

      <div className="mosaic-main">
        {showToolbar && (
          <div className="mosaic-toolbar">
            <div className="mosaic-toolbar-left">
              {leftSidebarProp && (
                <button className={`mosaic-toolbar-btn${leftVisible ? " active" : ""}`} onClick={toggleLeft} title="Toggle Left Sidebar (Cmd+B)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 2h4v12H2V2zm5 0h7a1 1 0 011 1v10a1 1 0 01-1 1H7V2z" opacity={leftVisible ? 1 : 0.4} />
                    <rect x="2" y="2" width="4" height="12" opacity={leftVisible ? 0.6 : 0.2} />
                  </svg>
                </button>
              )}
            </div>
            <div className="mosaic-toolbar-center" />
            <div className="mosaic-toolbar-right">
              {panelProp && (
                <button className={`mosaic-toolbar-btn${panelVisible ? " active" : ""}`} onClick={togglePanel} title="Toggle Panel (Cmd+`)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h10a1 1 0 011 1v7H2V3zm0 8h12v2a1 1 0 01-1 1H3a1 1 0 01-1-1v-2z" opacity={panelVisible ? 1 : 0.4} />
                    <rect x="2" y="11" width="12" height="3" rx="0" opacity={panelVisible ? 0.6 : 0.2} />
                  </svg>
                </button>
              )}
              {rightSidebarProp && (
                <button className={`mosaic-toolbar-btn${rightVisible ? " active" : ""}`} onClick={toggleRight} title="Toggle Right Sidebar (Cmd+I)">
                  <svg width="16" height="16" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M2 3a1 1 0 011-1h7v12H3a1 1 0 01-1-1V3zm9-1h3v12h-3V2z" opacity={rightVisible ? 1 : 0.4} />
                    <rect x="11" y="2" width="3" height="12" opacity={rightVisible ? 0.6 : 0.2} />
                  </svg>
                </button>
              )}
            </div>
          </div>
        )}

        <div className="mosaic-content-row">
          {leftSidebarProp && leftVisible && (
            <>
              <div className="mosaic-sidebar-container" style={{ width: leftWidth, minWidth: leftMinWidth }}>
                <Sidebar
                  containerId={LEFT_CONTAINER}
                  title={leftSidebarProp.title ?? "Explorer"}
                  sections={leftSections}
                  side="left"
                  onSectionToggle={handleLeftSectionToggle}
                  onSectionsReorder={setLeftSections}
                  onSectionMoveIn={handleLeftMoveIn}
                />
              </div>
              <div className="mosaic-resizer horizontal" onMouseDown={(e) => handleSidebarResizeStart(e, "left")} />
            </>
          )}

          <div className="mosaic-center-column">
            <div className="mosaic-editor-area">
              <SplitPane node={state.splitTree} path={[]} />
            </div>
            {panelProp && panelVisible && (
              <>
                <div className="mosaic-resizer vertical" onMouseDown={handlePanelResizeStart} />
                <div className="mosaic-panel-container" style={{ height: panelHeight, minHeight: panelMinHeight }}>
                  <Panel
                    containerId={PANEL_CONTAINER}
                    tabs={panelTabs}
                    activeTabId={panelActiveTabId}
                    onTabChange={setPanelActiveTabId}
                    onTabsReorder={setPanelTabs}
                    onItemMoveIn={handlePanelMoveIn}
                    onClose={togglePanel}
                  />
                </div>
              </>
            )}
          </div>

          {rightSidebarProp && rightVisible && (
            <>
              <div className="mosaic-resizer horizontal" onMouseDown={(e) => handleSidebarResizeStart(e, "right")} />
              <div className="mosaic-sidebar-container" style={{ width: rightWidth, minWidth: rightMinWidth }}>
                <Sidebar
                  containerId={RIGHT_CONTAINER}
                  title={rightSidebarProp.title ?? "Outline"}
                  sections={rightSections}
                  side="right"
                  onSectionToggle={handleRightSectionToggle}
                  onSectionsReorder={setRightSections}
                  onSectionMoveIn={handleRightMoveIn}
                />
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

export interface WorkbenchProps extends WorkbenchInnerProps {
  initialState?: Partial<WorkbenchState>;
  children?: ReactNode;
}

export function Workbench({ initialState, children, ...rest }: WorkbenchProps) {
  return (
    <WorkbenchProvider initialState={initialState}>
      <WorkbenchInner {...rest} />
      {children}
    </WorkbenchProvider>
  );
}

export { useWorkbench, useWorkbenchActions } from "../context/WorkbenchContext";
