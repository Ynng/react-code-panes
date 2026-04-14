import { DropPosition } from "../types";

interface DropOverlayProps {
  position: DropPosition;
}

const positionStyles: Record<DropPosition, React.CSSProperties> = {
  left: { top: 0, left: 0, bottom: 0, width: "50%" },
  right: { top: 0, right: 0, bottom: 0, width: "50%" },
  top: { top: 0, left: 0, right: 0, height: "50%" },
  bottom: { bottom: 0, left: 0, right: 0, height: "50%" },
  center: { top: 0, left: 0, right: 0, bottom: 0 },
};

export function DropOverlay({ position }: DropOverlayProps) {
  return (
    <div
      className="mosaic-drop-overlay"
      style={positionStyles[position]}
    />
  );
}
