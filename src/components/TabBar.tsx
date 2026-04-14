import { useRef, useCallback, useEffect, useState } from "react";
import { Tab, DRAG_TYPE } from "../types";

interface TabBarProps {
  groupId: string;
  tabs: Tab[];
  activeTabId: string | null;
  isFocused: boolean;
  onActivate: (tabId: string) => void;
  onClose: (tabId: string) => void;
  onPinTab: (tabId: string) => void;
  onReorder: (tabId: string, toIndex: number) => void;
  onCrossGroupDrop: (tabId: string, sourceGroupId: string, index: number) => void;
  onSplit: () => void;
}

export function TabBar({
  groupId,
  tabs,
  activeTabId,
  isFocused,
  onActivate,
  onClose,
  onPinTab,
  onReorder,
  onCrossGroupDrop,
  onSplit,
}: TabBarProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const dragStateRef = useRef<{
    startClientX: number;
    startScrollLeft: number;
  } | null>(null);
  const [dropTarget, setDropTarget] = useState<{
    tabId: string;
    side: "left" | "right";
  } | null>(null);
  const [scrollMetrics, setScrollMetrics] = useState({
    hasOverflow: false,
    thumbWidth: 0,
    thumbLeft: 0,
  });

  const updateScrollMetrics = useCallback(() => {
    const element = scrollRef.current;
    if (!element) return;

    const { clientWidth, scrollWidth, scrollLeft } = element;
    const hasOverflow = scrollWidth > clientWidth + 1;
    if (!hasOverflow) {
      setScrollMetrics({ hasOverflow: false, thumbWidth: 0, thumbLeft: 0 });
      return;
    }

    const thumbWidth = Math.max(18, (clientWidth / scrollWidth) * clientWidth);
    const maxScrollLeft = scrollWidth - clientWidth;
    const maxThumbLeft = clientWidth - thumbWidth;
    const thumbLeft = maxScrollLeft > 0 ? (scrollLeft / maxScrollLeft) * maxThumbLeft : 0;

    setScrollMetrics({ hasOverflow: true, thumbWidth, thumbLeft });
  }, []);

  // Scroll active tab into view
  useEffect(() => {
    if (!scrollRef.current || !activeTabId) return;
    const el = scrollRef.current.querySelector(
      `[data-tab-id="${CSS.escape(activeTabId)}"]`
    );
    el?.scrollIntoView({ behavior: "smooth", block: "nearest", inline: "nearest" });
  }, [activeTabId]);

  useEffect(() => {
    const element = scrollRef.current;
    if (!element) return;

    updateScrollMetrics();
    element.addEventListener("scroll", updateScrollMetrics, { passive: true });

    let observer: ResizeObserver | null = null;
    if (typeof ResizeObserver !== "undefined") {
      observer = new ResizeObserver(() => updateScrollMetrics());
      observer.observe(element);
    }

    window.addEventListener("resize", updateScrollMetrics);
    return () => {
      element.removeEventListener("scroll", updateScrollMetrics);
      window.removeEventListener("resize", updateScrollMetrics);
      observer?.disconnect();
    };
  }, [tabs, updateScrollMetrics]);

  const stopThumbDrag = useCallback(() => {
    dragStateRef.current = null;
    document.body.style.userSelect = "";
    document.body.style.cursor = "";
  }, []);

  useEffect(() => {
    const handlePointerMove = (event: PointerEvent) => {
      const dragState = dragStateRef.current;
      const element = scrollRef.current;
      if (!dragState || !element) return;

      const { clientWidth, scrollWidth } = element;
      const maxScrollLeft = scrollWidth - clientWidth;
      const maxThumbLeft = clientWidth - scrollMetrics.thumbWidth;
      if (maxScrollLeft <= 0 || maxThumbLeft <= 0) return;

      const delta = event.clientX - dragState.startClientX;
      const nextThumbLeft = Math.max(0, Math.min(maxThumbLeft, (dragState.startScrollLeft / maxScrollLeft) * maxThumbLeft + delta));
      element.scrollLeft = (nextThumbLeft / maxThumbLeft) * maxScrollLeft;
    };

    const handlePointerUp = () => stopThumbDrag();

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
    return () => {
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    };
  }, [scrollMetrics.thumbWidth, stopThumbDrag]);

  const handleDragStart = useCallback(
    (e: React.DragEvent, tab: Tab) => {
      e.dataTransfer.setData(
        DRAG_TYPE,
        JSON.stringify({ type: "tab", tabId: tab.id, sourceGroupId: groupId })
      );
      e.dataTransfer.effectAllowed = "move";
    },
    [groupId]
  );

  const handleDragOver = useCallback(
    (e: React.DragEvent, tab: Tab) => {
      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const side = e.clientX < rect.left + rect.width / 2 ? "left" : "right";
      setDropTarget({ tabId: tab.id, side });
    },
    []
  );

  const handleDrop = useCallback(
    (e: React.DragEvent, _tab: Tab, index: number) => {
      e.preventDefault();
      setDropTarget(null);

      const raw = e.dataTransfer.getData(DRAG_TYPE);
      if (!raw) return;
      let data: any;
      try { data = JSON.parse(raw); } catch { return; }
      if (data.type !== "tab") return;

      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const insertIndex = e.clientX < rect.left + rect.width / 2 ? index : index + 1;

      if (data.sourceGroupId === groupId) {
        onReorder(data.tabId, insertIndex);
      } else {
        onCrossGroupDrop(data.tabId, data.sourceGroupId, insertIndex);
      }
    },
    [groupId, onReorder, onCrossGroupDrop]
  );

  const handleDragLeave = useCallback(() => setDropTarget(null), []);

  // Handle drops on the empty area of the tab bar (past the last tab)
  const handleBarDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(DRAG_TYPE)) return;
      // Only handle if the drop target is the scroll container itself, not a child tab
      if (e.target !== scrollRef.current) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      // Show a drop indicator after the last tab
      if (tabs.length > 0) {
        setDropTarget({ tabId: tabs[tabs.length - 1].id, side: "right" });
      }
    },
    [tabs]
  );

  const handleBarDrop = useCallback(
    (e: React.DragEvent) => {
      // Only handle if the drop target is the scroll container itself
      if (e.target !== scrollRef.current) return;
      e.preventDefault();
      setDropTarget(null);

      const raw = e.dataTransfer.getData(DRAG_TYPE);
      if (!raw) return;
      let data: any;
      try { data = JSON.parse(raw); } catch { return; }
      if (data.type !== "tab") return;

      // Append after the last tab
      const insertIndex = tabs.length;

      if (data.sourceGroupId === groupId) {
        onReorder(data.tabId, insertIndex);
      } else {
        onCrossGroupDrop(data.tabId, data.sourceGroupId, insertIndex);
      }
    },
    [groupId, tabs.length, onReorder, onCrossGroupDrop]
  );

  const handleBarDragLeave = useCallback(
    (e: React.DragEvent) => {
      if (e.target !== scrollRef.current) return;
      setDropTarget(null);
    },
    []
  );

  return (
    <div className={`mosaic-tabbar${isFocused ? " focused" : ""}`}>
      <div className="mosaic-tabbar-scroll-shell">
        <div
          className="mosaic-tabbar-scroll"
          ref={scrollRef}
          onDragOver={handleBarDragOver}
          onDrop={handleBarDrop}
          onDragLeave={handleBarDragLeave}
        >
          {tabs.map((tab, index) => {
            const isActive = tab.id === activeTabId;
            const isClosable = tab.closable !== false;
            const cls = [
              "mosaic-tab",
              isActive && "active",
              tab.isDirty && "dirty",
              tab.isPreview && "preview",
              dropTarget?.tabId === tab.id &&
                dropTarget.side === "left" &&
                "drop-target-left",
              dropTarget?.tabId === tab.id &&
                dropTarget.side === "right" &&
                "drop-target-right",
            ]
              .filter(Boolean)
              .join(" ");

            return (
              <div
                key={tab.id}
                data-tab-id={tab.id}
                className={cls}
                draggable
                onClick={() => onActivate(tab.id)}
                onDoubleClick={() => {
                  if (tab.isPreview) onPinTab(tab.id);
                }}
                onMouseDown={(e) => {
                  if (e.button === 1 && isClosable) {
                    e.preventDefault();
                    onClose(tab.id);
                  }
                }}
                onDragStart={(e) => handleDragStart(e, tab)}
                onDragOver={(e) => handleDragOver(e, tab)}
                onDragLeave={handleDragLeave}
                onDrop={(e) => handleDrop(e, tab, index)}
              >
                {tab.icon && <span className="mosaic-tab-icon">{tab.icon}</span>}
                <span className="mosaic-tab-label" style={tab.labelColor ? { color: tab.labelColor } : undefined}>{tab.title}</span>
                {tab.isDirty && <span className="mosaic-tab-dirty" />}
                {isClosable && (
                  <span
                    className="mosaic-tab-close"
                    onClick={(e) => {
                      e.stopPropagation();
                      onClose(tab.id);
                    }}
                  >
                    ×
                  </span>
                )}
              </div>
            );
          })}
        </div>
        {scrollMetrics.hasOverflow && (
          <div className="mosaic-tabbar-overlay-scrollbar" aria-hidden="true">
            <div
              className="mosaic-tabbar-overlay-thumb"
              style={{
                width: scrollMetrics.thumbWidth,
                transform: `translateX(${scrollMetrics.thumbLeft}px)`,
              }}
              onPointerDown={(event) => {
                dragStateRef.current = {
                  startClientX: event.clientX,
                  startScrollLeft: scrollRef.current?.scrollLeft ?? 0,
                };
                document.body.style.userSelect = "none";
                document.body.style.cursor = "default";
              }}
            />
          </div>
        )}
      </div>
      <div className="mosaic-tabbar-actions">
        <button
          className="mosaic-tabbar-split-btn"
          onClick={onSplit}
          title="Split Editor Right"
        >
          <svg width="14" height="14" viewBox="0 0 16 16" fill="currentColor">
            <path d="M14 1H2a1 1 0 00-1 1v12a1 1 0 001 1h12a1 1 0 001-1V2a1 1 0 00-1-1zm0 13H9V2h5v12zM2 2h6v12H2V2z" />
          </svg>
        </button>
      </div>
    </div>
  );
}
