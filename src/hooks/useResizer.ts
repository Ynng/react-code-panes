import { useCallback, useRef, useEffect } from "react";

interface UseResizerOptions {
  orientation: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
}

/**
 * Hook for drag-to-resize behavior.
 * Uses refs for the callbacks so document listeners always see the latest
 * closures without needing to remove/re-add on every render.
 */
export function useResizer({ orientation, onResize, onResizeEnd }: UseResizerOptions) {
  const dragging = useRef(false);
  const startPos = useRef(0);
  const orientationRef = useRef(orientation);
  const onResizeRef = useRef(onResize);
  const onResizeEndRef = useRef(onResizeEnd);

  // Keep refs in sync
  orientationRef.current = orientation;
  onResizeRef.current = onResize;
  onResizeEndRef.current = onResizeEnd;

  // Stable listener refs that never change identity
  const handleMouseMove = useRef((e: MouseEvent) => {
    if (!dragging.current) return;
    const current = orientationRef.current === "horizontal" ? e.clientX : e.clientY;
    const delta = current - startPos.current;
    startPos.current = current;
    if (delta !== 0) onResizeRef.current(delta);
  }).current;

  const handleMouseUp = useRef(() => {
    if (!dragging.current) return;
    dragging.current = false;
    document.body.style.cursor = "";
    document.body.style.userSelect = "";
    document.removeEventListener("mousemove", handleMouseMove);
    document.removeEventListener("mouseup", handleMouseUp);
    onResizeEndRef.current?.();
  }).current;

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.removeEventListener("mousemove", handleMouseMove);
      document.removeEventListener("mouseup", handleMouseUp);
      if (dragging.current) {
        dragging.current = false;
        document.body.style.cursor = "";
        document.body.style.userSelect = "";
      }
    };
  }, [handleMouseMove, handleMouseUp]);

  const onMouseDown = useCallback(
    (e: React.MouseEvent) => {
      e.preventDefault();
      e.stopPropagation();
      dragging.current = true;
      startPos.current =
        orientationRef.current === "horizontal" ? e.clientX : e.clientY;
      document.body.style.cursor =
        orientationRef.current === "horizontal" ? "col-resize" : "row-resize";
      document.body.style.userSelect = "none";
      document.addEventListener("mousemove", handleMouseMove);
      document.addEventListener("mouseup", handleMouseUp);
    },
    [handleMouseMove, handleMouseUp]
  );

  return { onMouseDown, isDragging: dragging };
}
