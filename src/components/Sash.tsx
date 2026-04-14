import { useState, useCallback } from "react";
import { useResizer } from "../hooks/useResizer";

interface SashProps {
  orientation: "horizontal" | "vertical";
  onResize: (delta: number) => void;
  onResizeEnd?: () => void;
  onDoubleClick?: () => void;
}

export function Sash({ orientation, onResize, onResizeEnd, onDoubleClick }: SashProps) {
  const [isDragging, setIsDragging] = useState(false);

  const { onMouseDown: baseMouseDown } = useResizer({
    orientation,
    onResize,
    onResizeEnd: () => {
      setIsDragging(false);
      onResizeEnd?.();
    },
  });

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      setIsDragging(true);
      baseMouseDown(e);
    },
    [baseMouseDown]
  );

  return (
    <div
      className={`mosaic-sash ${orientation}${isDragging ? " dragging" : ""}`}
      onMouseDown={handleMouseDown}
      onDoubleClick={onDoubleClick}
    />
  );
}
