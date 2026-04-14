import { useRef, Fragment } from "react";
import { SplitNode } from "../types";
import { useWorkbenchActions } from "../context/WorkbenchContext";
import { Sash } from "./Sash";
import { EditorGroup } from "./EditorGroup";

interface SplitPaneProps {
  node: SplitNode;
  path?: number[];
}

const MIN_SIZE_PX = 80;
const SASH_SIZE = 4;

function SplitChild({
  child,
  path,
  size,
  isHorizontal,
}: {
  child: SplitNode;
  path: number[];
  size: number;
  isHorizontal: boolean;
}) {
  return (
    <div
      className="mosaic-split-child"
      style={{
        flex: `${size} 1 0%`,
        [isHorizontal ? "minWidth" : "minHeight"]: MIN_SIZE_PX,
      }}
    >
      <SplitPane node={child} path={path} />
    </div>
  );
}

/**
 * Renders a small overlay at the intersection of two perpendicular sashes.
 * Dragging it resizes in both directions simultaneously.
 */
function CornerSashOverlay({
  style,
  onDrag,
}: {
  style: React.CSSProperties;
  onDrag: (dx: number, dy: number) => void;
}) {
  return (
    <div
      className="mosaic-corner-sash"
      style={style}
      onMouseDown={(e) => {
        e.preventDefault();
        e.stopPropagation();
        let prevX = e.clientX;
        let prevY = e.clientY;
        document.body.style.cursor = "nwse-resize";
        document.body.style.userSelect = "none";

        const onMove = (me: MouseEvent) => {
          const dx = me.clientX - prevX;
          const dy = me.clientY - prevY;
          prevX = me.clientX;
          prevY = me.clientY;
          onDrag(dx, dy);
        };
        const onUp = () => {
          document.body.style.cursor = "";
          document.body.style.userSelect = "";
          document.removeEventListener("mousemove", onMove);
          document.removeEventListener("mouseup", onUp);
        };
        document.addEventListener("mousemove", onMove);
        document.addEventListener("mouseup", onUp);
      }}
    />
  );
}

export function SplitPane({ node, path = [] }: SplitPaneProps) {
  const actions = useWorkbenchActions();
  const containerRef = useRef<HTMLDivElement>(null);

  if (node.type === "leaf") {
    return <EditorGroup groupId={node.groupId} />;
  }

  const isHorizontal = node.orientation === "horizontal";
  const sizes = node.sizes;
  const orientation = node.orientation;

  const doResize = (resizePath: number[], resizeSizes: number[], index: number, delta: number, containerEl: HTMLElement, resizeOrientation: "horizontal" | "vertical") => {
    const rect = containerEl.getBoundingClientRect();
    const totalSize = resizeOrientation === "horizontal" ? rect.width : rect.height;
    const sashCount = resizeSizes.length - 1;
    const availableSize = totalSize - sashCount * SASH_SIZE;
    if (availableSize <= 0) return;

    const newSizes = [...resizeSizes];
    const deltaFraction = delta / availableSize;
    const newLeft = newSizes[index] + deltaFraction;
    const newRight = newSizes[index + 1] - deltaFraction;

    const minFraction = MIN_SIZE_PX / availableSize;
    if (newLeft < minFraction || newRight < minFraction) return;

    newSizes[index] = newLeft;
    newSizes[index + 1] = newRight;
    actions.updateSizes(resizePath, newSizes);
  };

  const makeResize = (index: number) => (delta: number) => {
    if (!containerRef.current) return;
    doResize(path, sizes, index, delta, containerRef.current, orientation);
  };

  const makeDoubleClick = (index: number) => () => {
    const n = node.children.length;
    actions.updateSizes(path, node.children.map(() => 1 / n));
  };

  // Build corner sash data: for each of our sashes, check adjacent children
  // for orthogonal child sashes.
  const cornerSashes: {
    sashIndex: number;      // index in our sash list (= child index - 1)
    childIndex: number;     // which of our children contains the cross sash
    childSashIndex: number; // index of the sash within that child
    childOrientation: "horizontal" | "vertical";
    childSizes: number[];
  }[] = [];

  for (let si = 0; si < node.children.length - 1; si++) {
    // Check children on both sides of the sash
    for (const ci of [si, si + 1]) {
      const child = node.children[ci];
      if (child.type === "branch" && child.orientation !== orientation) {
        for (let csi = 0; csi < child.children.length - 1; csi++) {
          cornerSashes.push({
            sashIndex: si,
            childIndex: ci,
            childSashIndex: csi,
            childOrientation: child.orientation,
            childSizes: child.sizes,
          });
        }
      }
    }
  }

  return (
    <div className={`mosaic-split ${orientation}`} ref={containerRef}>
      {node.children.map((child, i) => (
        <Fragment key={i}>
          {i > 0 && (
            <Sash
              orientation={orientation}
              onResize={makeResize(i - 1)}
              onDoubleClick={makeDoubleClick(i - 1)}
            />
          )}
          <SplitChild
            child={child}
            path={[...path, i]}
            size={sizes[i]}
            isHorizontal={isHorizontal}
          />
        </Fragment>
      ))}
      {/* Corner sashes at intersections — use percentage-based positioning */}
      {cornerSashes.map((corner, idx) => {
        // Calculate our sash position as a percentage along our axis
        let ourSashPct = 0;
        for (let i = 0; i <= corner.sashIndex; i++) {
          ourSashPct += sizes[i];
        }
        // Calculate child sash position as a percentage along the child axis
        let childSashPct = 0;
        for (let i = 0; i <= corner.childSashIndex; i++) {
          childSashPct += corner.childSizes[i];
        }
        // Also need to account for the child's offset within our axis
        let childOffset = 0;
        for (let i = 0; i < corner.childIndex; i++) {
          childOffset += sizes[i];
        }
        const childSize = sizes[corner.childIndex];

        // Convert child sash position to our coordinate system
        const childSashInOurPct = childOffset + childSize * childSashPct;

        // Position: for horizontal parent, our sash runs vertically (left% = ourSashPct)
        // and child sash runs horizontally (top% = childSashInOurPct)
        const style: React.CSSProperties = isHorizontal
          ? {
              left: `calc(${ourSashPct * 100}% - 5px)`,
              top: `calc(${childSashInOurPct * 100}% - 5px)`,
            }
          : {
              top: `calc(${ourSashPct * 100}% - 5px)`,
              left: `calc(${childSashInOurPct * 100}% - 5px)`,
            };

        return (
          <CornerSashOverlay
            key={`corner-${idx}`}
            style={style}
            onDrag={(dx, dy) => {
              if (!containerRef.current) return;

              // Resize our sash (the parent direction)
              const ourDelta = isHorizontal ? dx : dy;
              if (ourDelta !== 0) {
                doResize(path, sizes, corner.sashIndex, ourDelta, containerRef.current, orientation);
              }

              // Resize the child sash (the orthogonal direction)
              const childDelta = isHorizontal ? dy : dx;
              if (childDelta !== 0) {
                const childEl = containerRef.current.querySelectorAll(
                  `:scope > .mosaic-split-child`
                )[corner.childIndex];
                const childSplit = childEl?.querySelector(".mosaic-split") as HTMLElement | null;
                if (childSplit) {
                  doResize(
                    [...path, corner.childIndex],
                    corner.childSizes,
                    corner.childSashIndex,
                    childDelta,
                    childSplit,
                    corner.childOrientation
                  );
                }
              }
            }}
          />
        );
      })}
    </div>
  );
}

