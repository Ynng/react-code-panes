import { useState, useCallback } from "react";
import { PanelTab } from "../types";
import { SECTION_DRAG_TYPE, getDraggedSection, setDraggedSection, clearDraggedSection } from "./Sidebar";

interface PanelProps {
  containerId: string;
  tabs: PanelTab[];
  activeTabId: string;
  onTabChange: (tabId: string) => void;
  onTabsReorder?: (tabs: PanelTab[]) => void;
  onItemMoveIn?: (item: PanelTab, targetIndex: number, sourceContainerId: string) => void;
  onClose?: () => void;
}

export function Panel({
  containerId,
  tabs,
  activeTabId,
  onTabChange,
  onTabsReorder,
  onItemMoveIn,
  onClose,
}: PanelProps) {
  const [dropIndicator, setDropIndicator] = useState<{ tabId: string; side: "left" | "right" } | null>(null);
  const activeTab = tabs.find((t) => t.id === activeTabId);

  const handleDragStart = useCallback(
    (e: React.DragEvent, tab: PanelTab) => {
      e.dataTransfer.setData(SECTION_DRAG_TYPE, JSON.stringify({ sectionId: tab.id, sourceContainerId: containerId }));
      e.dataTransfer.effectAllowed = "move";
      setDraggedSection({ id: tab.id, title: tab.title, icon: tab.icon, content: tab.content });
    },
    [containerId]
  );

  const handleTabDragOver = useCallback((e: React.DragEvent, tabId: string) => {
    if (!e.dataTransfer.types.includes(SECTION_DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropIndicator({ tabId, side: e.clientX < rect.left + rect.width / 2 ? "left" : "right" });
  }, []);

  const handleTabDrop = useCallback((e: React.DragEvent, targetId: string) => {
    e.preventDefault();
    const side = dropIndicator?.side ?? "right";
    setDropIndicator(null);
    let parsed: { sectionId: string; sourceContainerId: string };
    try { parsed = JSON.parse(e.dataTransfer.getData(SECTION_DRAG_TYPE)); } catch { return; }
    const { sectionId: sourceId, sourceContainerId } = parsed;
    if (!sourceId) return;
    const targetIdx = tabs.findIndex((t) => t.id === targetId);
    if (targetIdx < 0) return;
    const insertIdx = side === "left" ? targetIdx : targetIdx + 1;

    if (sourceContainerId === containerId) {
      if (sourceId === targetId) return;
      const sourceIdx = tabs.findIndex((t) => t.id === sourceId);
      if (sourceIdx < 0) return;
      const newTabs = [...tabs];
      const [moved] = newTabs.splice(sourceIdx, 1);
      newTabs.splice(sourceIdx < insertIdx ? insertIdx - 1 : insertIdx, 0, moved);
      onTabsReorder?.(newTabs);
    } else {
      const dragged = getDraggedSection();
      if (dragged) onItemMoveIn?.({ id: dragged.id, title: dragged.title, icon: dragged.icon, content: dragged.content }, insertIdx, sourceContainerId);
      clearDraggedSection();
    }
  }, [containerId, tabs, dropIndicator, onTabsReorder, onItemMoveIn]);

  const handleTabBarDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(SECTION_DRAG_TYPE)) return;
    if ((e.target as HTMLElement).closest(".mosaic-panel-tab")) return;
    e.preventDefault();
    if (tabs.length > 0) setDropIndicator({ tabId: tabs[tabs.length - 1].id, side: "right" });
  }, [tabs]);

  const handleTabBarDrop = useCallback((e: React.DragEvent) => {
    if ((e.target as HTMLElement).closest(".mosaic-panel-tab")) return;
    e.preventDefault();
    setDropIndicator(null);
    let parsed: { sectionId: string; sourceContainerId: string };
    try { parsed = JSON.parse(e.dataTransfer.getData(SECTION_DRAG_TYPE)); } catch { return; }
    const { sectionId: sourceId, sourceContainerId } = parsed;
    if (!sourceId) return;
    if (sourceContainerId === containerId) {
      const sourceIdx = tabs.findIndex((t) => t.id === sourceId);
      if (sourceIdx < 0) return;
      const newTabs = [...tabs]; const [moved] = newTabs.splice(sourceIdx, 1); newTabs.push(moved);
      onTabsReorder?.(newTabs);
    } else {
      const dragged = getDraggedSection();
      if (dragged) onItemMoveIn?.({ id: dragged.id, title: dragged.title, icon: dragged.icon, content: dragged.content }, tabs.length, sourceContainerId);
      clearDraggedSection();
    }
  }, [containerId, tabs, onTabsReorder, onItemMoveIn]);

  const clearDrag = useCallback(() => setDropIndicator(null), []);

  return (
    <div className="mosaic-panel">
      <div className="mosaic-panel-header">
        <div className="mosaic-panel-tabs" onDragOver={handleTabBarDragOver} onDrop={handleTabBarDrop} onDragLeave={clearDrag}>
          {tabs.map((tab) => {
            const isActive = tab.id === activeTabId;
            const showLeft = dropIndicator?.tabId === tab.id && dropIndicator.side === "left";
            const showRight = dropIndicator?.tabId === tab.id && dropIndicator.side === "right";
            return (
              <div
                key={tab.id}
                className={[
                  "mosaic-panel-tab",
                  isActive && "active",
                  showLeft && "insert-left",
                  showRight && "insert-right",
                ].filter(Boolean).join(" ")}
                draggable
                onClick={() => onTabChange(tab.id)}
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragOver={(e) => handleTabDragOver(e, tab.id)}
                onDragLeave={clearDrag}
                onDrop={(e) => handleTabDrop(e, tab.id)}
              >
                {tab.icon && <span className="mosaic-panel-tab-icon">{tab.icon}</span>}
                <span>{tab.title}</span>
              </div>
            );
          })}
        </div>
        <div className="mosaic-panel-actions">
          {onClose && (
            <button className="mosaic-panel-action-btn" onClick={onClose} title="Close Panel">
              <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
                <path d="M8 8.707l3.646 3.647.708-.708L8.707 8l3.647-3.646-.708-.708L8 7.293 4.354 3.646l-.708.708L7.293 8l-3.647 3.646.708.708L8 8.707z" />
              </svg>
            </button>
          )}
        </div>
      </div>
      <div className="mosaic-panel-content">
        {activeTab?.content}
      </div>
    </div>
  );
}
