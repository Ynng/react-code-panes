import { useState, useCallback, useRef, useEffect } from "react";
import { SidebarSection } from "../types";

export const SECTION_DRAG_TYPE = "application/x-mosaic-section";

let draggedSection: SidebarSection | null = null;
export function getDraggedSection() { return draggedSection; }
export function setDraggedSection(s: SidebarSection | null) { draggedSection = s; }
export function clearDraggedSection() { draggedSection = null; }

type DropIndicator = {
  sectionId: string;
  half: "top" | "bottom";
} | {
  sectionId: "__empty__";
  half: "bottom";
};

interface SidebarProps {
  containerId: string;
  title: string;
  sections: SidebarSection[];
  side?: "left" | "right";
  onSectionToggle?: (sectionId: string) => void;
  onSectionsReorder?: (sections: SidebarSection[]) => void;
  onSectionMoveIn?: (section: SidebarSection, targetIndex: number, sourceContainerId: string) => void;
}

export function Sidebar({
  containerId,
  title,
  sections,
  side = "left",
  onSectionToggle,
  onSectionsReorder,
  onSectionMoveIn,
}: SidebarProps) {
  const [sectionHeights, setSectionHeights] = useState<Record<string, number>>({});
  const [dropIndicator, setDropIndicator] = useState<DropIndicator | null>(null);

  // ─── Section resize (stable refs) ─────────────────────────

  const resizingRef = useRef<{ sectionId: string; startY: number; startHeight: number } | null>(null);

  const handleResizeMouseMove = useRef((e: MouseEvent) => {
    const r = resizingRef.current;
    if (!r) return;
    const delta = e.clientY - r.startY;
    const newHeight = Math.max(40, r.startHeight + delta);
    setSectionHeights((prev) => ({ ...prev, [r.sectionId]: newHeight }));
  }).current;

  const handleResizeMouseUp = useRef(() => {
    resizingRef.current = null;
    document.removeEventListener("mousemove", handleResizeMouseMove);
    document.removeEventListener("mouseup", handleResizeMouseUp);
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
  }).current;

  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleResizeMouseMove);
      document.removeEventListener("mouseup", handleResizeMouseUp);
    };
  }, [handleResizeMouseMove, handleResizeMouseUp]);

  const handleSectionResizeStart = useCallback(
    (e: React.MouseEvent, section: SidebarSection) => {
      e.preventDefault();
      const currentHeight = sectionHeights[section.id] ?? section.defaultHeight ?? 200;
      resizingRef.current = { sectionId: section.id, startY: e.clientY, startHeight: currentHeight };
      document.body.style.cursor = "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleResizeMouseMove);
      document.addEventListener("mouseup", handleResizeMouseUp);
    },
    [sectionHeights, handleResizeMouseMove, handleResizeMouseUp]
  );

  // ─── Drag start ───────────────────────────────────────────

  const handleDragStart = useCallback(
    (e: React.DragEvent, section: SidebarSection) => {
      draggedSection = section;
      e.dataTransfer.setData(SECTION_DRAG_TYPE, JSON.stringify({
        sectionId: section.id,
        sourceContainerId: containerId,
      }));
      e.dataTransfer.effectAllowed = "move";
    },
    [containerId]
  );

  // ─── Drag over: top-half / bottom-half detection ──────────

  const handleSectionDragOver = useCallback(
    (e: React.DragEvent, sectionId: string) => {
      if (!e.dataTransfer.types.includes(SECTION_DRAG_TYPE)) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      const y = e.clientY - rect.top;
      const half = y < rect.height / 2 ? "top" : "bottom";
      setDropIndicator({ sectionId, half });
    },
    []
  );

  // Drop on empty area below all sections = append at end
  const handleEmptyDragOver = useCallback(
    (e: React.DragEvent) => {
      if (!e.dataTransfer.types.includes(SECTION_DRAG_TYPE)) return;
      // Only activate if cursor is below the last section
      if ((e.target as HTMLElement).closest(".mosaic-sidebar-section")) return;
      e.preventDefault();
      e.dataTransfer.dropEffect = "move";
      setDropIndicator({ sectionId: "__empty__", half: "bottom" });
    },
    []
  );

  const handleDragLeave = useCallback((e: React.DragEvent) => {
    // Only clear if leaving the sections container entirely
    const related = e.relatedTarget as HTMLElement | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    setDropIndicator(null);
  }, []);

  const handleSectionDragLeave = useCallback((e: React.DragEvent) => {
    const related = e.relatedTarget as HTMLElement | null;
    if (related && (e.currentTarget as HTMLElement).contains(related)) return;
    setDropIndicator(null);
  }, []);

  // ─── Drop: compute insert index from indicator ────────────

  const executeDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const indicator = dropIndicator;
      setDropIndicator(null);
      if (!indicator) return;

      let parsed: { sectionId: string; sourceContainerId: string };
      try {
        parsed = JSON.parse(e.dataTransfer.getData(SECTION_DRAG_TYPE));
      } catch { return; }

      const { sectionId: sourceId, sourceContainerId } = parsed;
      if (!sourceId) return;

      // Compute target insert index
      let insertIdx: number;
      if (indicator.sectionId === "__empty__") {
        insertIdx = sections.length;
      } else {
        const targetIdx = sections.findIndex((s) => s.id === indicator.sectionId);
        if (targetIdx < 0) return;
        insertIdx = indicator.half === "top" ? targetIdx : targetIdx + 1;
      }

      if (sourceContainerId === containerId) {
        // Internal reorder
        if (sourceId === indicator.sectionId) return;
        const sourceIdx = sections.findIndex((s) => s.id === sourceId);
        if (sourceIdx < 0) return;
        const newSections = [...sections];
        const [moved] = newSections.splice(sourceIdx, 1);
        // Adjust index if source was before the insert point
        const adjustedIdx = sourceIdx < insertIdx ? insertIdx - 1 : insertIdx;
        newSections.splice(adjustedIdx, 0, moved);
        onSectionsReorder?.(newSections);
      } else {
        // Cross-container move
        const section = getDraggedSection();
        if (section) {
          onSectionMoveIn?.(section, insertIdx, sourceContainerId);
        }
      }
      clearDraggedSection();
    },
    [containerId, sections, dropIndicator, onSectionsReorder, onSectionMoveIn]
  );

  // ─── Render ───────────────────────────────────────────────

  return (
    <div className="mosaic-sidebar" data-side={side}>
      <div className="mosaic-sidebar-title">{title}</div>
      <div
        className="mosaic-sidebar-sections"
        onDragOver={handleEmptyDragOver}
        onDragLeave={handleDragLeave}
        onDrop={executeDrop}
      >
        {sections.map((section, index) => {
          const height = sectionHeights[section.id] ?? section.defaultHeight ?? 200;
          const isLastExpanded =
            !section.isCollapsed &&
            sections.slice(index + 1).every((s) => s.isCollapsed);

          // Drop indicator state for this section
          const isDropTarget = dropIndicator?.sectionId === section.id;
          const dropHalf = isDropTarget ? dropIndicator!.half : null;
          const isSmall = section.isCollapsed; // collapsed = small, use border indicator

          return (
            <div
              key={section.id}
              className={`mosaic-sidebar-section${isLastExpanded ? " fill" : ""}`}
              onDragOver={(e) => handleSectionDragOver(e, section.id)}
              onDragLeave={handleSectionDragLeave}
              onDrop={executeDrop}
              style={{ position: "relative" }}
            >
              {/* VS Code-style drop overlay */}
              {isDropTarget && !isSmall && (
                <div
                  className="mosaic-section-drop-overlay"
                  style={
                    dropHalf === "top"
                      ? { top: 0, left: 0, right: 0, height: "50%" }
                      : { bottom: 0, left: 0, right: 0, height: "50%" }
                  }
                />
              )}
              {/* For collapsed/small sections, use a border indicator */}
              {isDropTarget && isSmall && (
                <div
                  className="mosaic-section-drop-border"
                  style={
                    dropHalf === "top"
                      ? { top: 0, left: 0, right: 0 }
                      : { bottom: 0, left: 0, right: 0 }
                  }
                />
              )}
              <div
                className="mosaic-sidebar-section-header"
              >
                <div
                  className="mosaic-sidebar-section-header-drag-handle"
                  draggable
                  onDragStart={(e) => handleDragStart(e, section)}
                  onClick={() => onSectionToggle?.(section.id)}
                >
                  <span
                    className={`mosaic-sidebar-section-chevron${
                      section.isCollapsed ? " collapsed" : ""
                    }`}
                  >
                    ▼
                  </span>
                  {section.icon && <span style={{ marginRight: 4 }}>{section.icon}</span>}
                  {section.title}
                </div>
                {section.headerActions && (
                  <div
                    className="mosaic-sidebar-section-header-actions"
                    style={{ display: 'flex', alignItems: 'center', flexShrink: 0, position: 'relative', zIndex: 1 }}
                    onClick={(e) => e.stopPropagation()}
                    onMouseDown={(e) => e.stopPropagation()}
                    onPointerDown={(e) => e.stopPropagation()}
                  >
                    {section.headerActions}
                  </div>
                )}
              </div>
              {!section.isCollapsed && (
                <>
                  <div
                    className="mosaic-sidebar-section-content"
                    style={isLastExpanded ? undefined : { height, maxHeight: height }}
                  >
                    {section.content}
                  </div>
                  {!isLastExpanded && (
                    <div
                      className="mosaic-resizer vertical"
                      onMouseDown={(e) => handleSectionResizeStart(e, section)}
                    />
                  )}
                </>
              )}
            </div>
          );
        })}
        {/* Empty area drop zone — shows overlay when dragging here */}
        {dropIndicator?.sectionId === "__empty__" && (
          <div className="mosaic-section-drop-empty-overlay" />
        )}
      </div>
    </div>
  );
}
