import { useRef, useState, useCallback } from "react";
import { useWorkbench, useWorkbenchActions } from "../context/WorkbenchContext";
import { TabBar } from "./TabBar";
import { DropOverlay } from "./DropOverlay";
import { DropPosition, DRAG_TYPE } from "../types";
import { getDragTab } from "../utils/dragStore";

interface EditorGroupProps {
  groupId: string;
}

function getDropPosition(e: React.DragEvent, rect: DOMRect): DropPosition {
  const x = (e.clientX - rect.left) / rect.width;
  const y = (e.clientY - rect.top) / rect.height;
  const threshold = 0.2;

  if (x < threshold) return "left";
  if (x > 1 - threshold) return "right";
  if (y < threshold) return "top";
  if (y > 1 - threshold) return "bottom";
  return "center";
}

export function EditorGroup({ groupId }: EditorGroupProps) {
  const { state } = useWorkbench();
  const actions = useWorkbenchActions();
  const [dropPos, setDropPos] = useState<DropPosition | null>(null);
  const dragCounter = useRef(0);

  const group = state.groups[groupId];
  const isFocused = state.activeGroupId === groupId;
  const activeTab = group?.tabs.find((t) => t.id === group.activeTabId);

  const handleContentDragOver = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    e.preventDefault();
    e.dataTransfer.dropEffect = "move";
    const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
    setDropPos(getDropPosition(e, rect));
  }, []);

  const handleContentDragEnter = useCallback((e: React.DragEvent) => {
    if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
    dragCounter.current++;
  }, []);

  const handleContentDragLeave = useCallback(() => {
    dragCounter.current--;
    if (dragCounter.current <= 0) {
      dragCounter.current = 0;
      setDropPos(null);
    }
  }, []);

  const handleContentDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      dragCounter.current = 0;
      setDropPos(null);

      const raw = e.dataTransfer.getData(DRAG_TYPE);
      if (!raw) return;
      let data: any;
      try { data = JSON.parse(raw); } catch { return; }

      // Handle sidebar file drop — retrieve full Tab from drag store
      if (data.type === "sidebar-file") {
        const tab = getDragTab();
        if (!tab) return;
        const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
        const position = getDropPosition(e, rect);
        if (position === "center") {
          actions.openTab(groupId, tab);
        } else {
          actions.openTab(groupId, tab);
          actions.dispatch({
            type: "SPLIT_AND_MOVE",
            targetGroupId: groupId,
            sourceGroupId: groupId,
            tabId: tab.id,
            position,
          });
        }
        return;
      }

      if (data.type !== "tab") return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const position = getDropPosition(e, rect);

      if (position === "center") {
        if (data.sourceGroupId !== groupId) {
          actions.moveTab(data.sourceGroupId, data.tabId, groupId);
        }
      } else {
        actions.dispatch({
          type: "SPLIT_AND_MOVE",
          targetGroupId: groupId,
          sourceGroupId: data.sourceGroupId,
          tabId: data.tabId,
          position,
        });
      }
    },
    [groupId, actions]
  );

  const handleCrossGroupDrop = useCallback(
    (tabId: string, sourceGroupId: string, index: number) => {
      actions.moveTab(sourceGroupId, tabId, groupId, index);
    },
    [groupId, actions]
  );

  const handleSplitActive = useCallback(() => {
    if (!activeTab) return;
    actions.dispatch({
      type: "SPLIT_AND_MOVE",
      targetGroupId: groupId,
      sourceGroupId: groupId,
      tabId: activeTab.id,
      position: "right",
    });
  }, [groupId, activeTab, actions]);

  return (
    <div
      className={`mosaic-editor-group${isFocused ? " focused" : ""}`}
      onMouseDown={() => actions.setActiveGroup(groupId)}
    >
      {group && group.tabs.length > 0 && (
        <TabBar
          groupId={groupId}
          tabs={group.tabs}
          activeTabId={group.activeTabId}
          isFocused={isFocused}
          onActivate={(tabId) => actions.setActiveTab(groupId, tabId)}
          onClose={(tabId) => actions.closeTab(groupId, tabId)}
          onPinTab={(tabId) => actions.dispatch({ type: "CONFIRM_TAB", groupId, tabId })}
          onReorder={(tabId, toIndex) => actions.reorderTab(groupId, tabId, toIndex)}
          onCrossGroupDrop={handleCrossGroupDrop}
          onSplit={handleSplitActive}
        />
      )}
      <div
        className="mosaic-editor-content"
        onDragOver={handleContentDragOver}
        onDragEnter={handleContentDragEnter}
        onDragLeave={handleContentDragLeave}
        onDrop={handleContentDrop}
      >
        {group && group.tabs.length > 0 ? (
          group.tabs.map((tab) => (
            <div
              key={tab.id}
              style={{
                display: tab.id === group.activeTabId ? "block" : "none",
                height: "100%",
              }}
            >
              {tab.content}
            </div>
          ))
        ) : (
          <div className="mosaic-editor-empty">
            <span>No editor is open</span>
          </div>
        )}
        {dropPos && <DropOverlay position={dropPos} />}
      </div>
    </div>
  );
}
