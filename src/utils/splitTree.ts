import {
  SplitNode,
  SplitBranch,
  SplitLeaf,
  Orientation,
  DropPosition,
} from "../types";

export function generateGroupId(): string {
  return `group-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function createLeaf(groupId?: string): SplitLeaf {
  return { type: "leaf", groupId: groupId ?? generateGroupId() };
}

export function createBranch(
  orientation: Orientation,
  children: SplitNode[],
  sizes?: number[]
): SplitBranch {
  const n = children.length;
  return {
    type: "branch",
    orientation,
    children,
    sizes: sizes ?? children.map(() => 1 / n),
  };
}

/** Find and return the path (indices) to a leaf with the given groupId */
export function findLeafPath(
  node: SplitNode,
  groupId: string
): number[] | null {
  if (node.type === "leaf") {
    return node.groupId === groupId ? [] : null;
  }
  for (let i = 0; i < node.children.length; i++) {
    const result = findLeafPath(node.children[i], groupId);
    if (result !== null) return [i, ...result];
  }
  return null;
}

/** Get the leaf node for a given groupId */
export function findLeaf(
  node: SplitNode,
  groupId: string
): SplitLeaf | null {
  if (node.type === "leaf") {
    return node.groupId === groupId ? node : null;
  }
  for (const child of node.children) {
    const result = findLeaf(child, groupId);
    if (result) return result;
  }
  return null;
}

/** Collect all group IDs in the tree */
export function getAllGroupIds(node: SplitNode): string[] {
  if (node.type === "leaf") return [node.groupId];
  return node.children.flatMap(getAllGroupIds);
}

function dropPositionToOrientation(pos: DropPosition): Orientation {
  return pos === "left" || pos === "right" ? "horizontal" : "vertical";
}

function isAfter(pos: DropPosition): boolean {
  return pos === "right" || pos === "bottom";
}

/**
 * Split a leaf node in the tree by inserting a new leaf adjacent to it.
 * Returns a new tree (immutable update).
 */
export function splitLeaf(
  tree: SplitNode,
  targetGroupId: string,
  newGroupId: string,
  position: DropPosition
): SplitNode {
  return transformNode(tree, targetGroupId, (leaf) => {
    const newLeaf = createLeaf(newGroupId);
    const orientation = dropPositionToOrientation(position);
    const children = isAfter(position)
      ? [leaf, newLeaf]
      : [newLeaf, leaf];
    return createBranch(orientation, children, [0.5, 0.5]);
  });
}

/** Remove a leaf from the tree. If its parent branch is left with one child, collapse it. */
export function removeLeaf(
  tree: SplitNode,
  groupId: string
): SplitNode | null {
  if (tree.type === "leaf") {
    return tree.groupId === groupId ? null : tree;
  }

  const newChildren: SplitNode[] = [];
  const newSizes: number[] = [];

  for (let i = 0; i < tree.children.length; i++) {
    const result = removeLeaf(tree.children[i], groupId);
    if (result !== null) {
      newChildren.push(result);
      newSizes.push(tree.sizes[i]);
    }
  }

  if (newChildren.length === 0) return null;
  if (newChildren.length === 1) return newChildren[0];

  // Renormalize sizes
  const total = newSizes.reduce((a, b) => a + b, 0);
  return {
    ...tree,
    children: newChildren,
    sizes: newSizes.map((s) => s / total),
  };
}

/** Update sizes of a branch node's children at a given path */
export function updateSizes(
  tree: SplitNode,
  path: number[],
  newSizes: number[]
): SplitNode {
  if (path.length === 0) {
    if (tree.type !== "branch") return tree;
    return { ...tree, sizes: newSizes };
  }
  if (tree.type !== "branch") return tree;
  const [head, ...rest] = path;
  return {
    ...tree,
    children: tree.children.map((child, i) =>
      i === head ? updateSizes(child, rest, newSizes) : child
    ),
  };
}

/** Apply a transform function to the leaf with the given groupId */
function transformNode(
  node: SplitNode,
  groupId: string,
  transform: (leaf: SplitLeaf) => SplitNode
): SplitNode {
  if (node.type === "leaf") {
    return node.groupId === groupId ? transform(node) : node;
  }
  return {
    ...node,
    children: node.children.map((child) =>
      transformNode(child, groupId, transform)
    ),
  };
}

/**
 * Simplify a tree by collapsing single-child branches and
 * merging same-orientation nested branches.
 */
export function simplifyTree(node: SplitNode): SplitNode {
  if (node.type === "leaf") return node;

  let children = node.children.map(simplifyTree);
  let sizes = [...node.sizes];

  // Flatten same-orientation children
  const flatChildren: SplitNode[] = [];
  const flatSizes: number[] = [];

  for (let i = 0; i < children.length; i++) {
    const child = children[i];
    if (
      child.type === "branch" &&
      child.orientation === node.orientation
    ) {
      for (let j = 0; j < child.children.length; j++) {
        flatChildren.push(child.children[j]);
        flatSizes.push(sizes[i] * child.sizes[j]);
      }
    } else {
      flatChildren.push(child);
      flatSizes.push(sizes[i]);
    }
  }

  if (flatChildren.length === 1) return flatChildren[0];

  return {
    ...node,
    children: flatChildren,
    sizes: flatSizes,
  };
}
