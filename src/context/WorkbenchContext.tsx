import {
  createContext,
  cloneElement,
  isValidElement,
  useContext,
  useCallback,
  useReducer,
  ReactNode,
  Dispatch,
} from "react";
import {
  WorkbenchState,
  Tab,
  SplitNode,
  DropPosition,
  EditorGroupState,
} from "../types";
import {
  createLeaf,
  generateGroupId,
  splitLeaf,
  removeLeaf,
  simplifyTree,
  updateSizes,
  getAllGroupIds,
} from "../utils/splitTree";

// ─── Actions ─────────────────────────────────────────────────

export type Action =
  | { type: "OPEN_TAB"; groupId: string; tab: Tab }
  | { type: "CLOSE_TAB"; groupId: string; tabId: string }
  | { type: "SET_ACTIVE_TAB"; groupId: string; tabId: string }
  | { type: "ACTIVATE_OR_OPEN_TAB"; fallbackGroupId: string; tab: Tab }
  | { type: "SET_ACTIVE_GROUP"; groupId: string }
  | { type: "MOVE_TAB"; sourceGroupId: string; tabId: string; targetGroupId: string; index?: number }
  | { type: "SPLIT_AND_MOVE"; targetGroupId: string; sourceGroupId: string; tabId: string; position: DropPosition }
  | { type: "REMOVE_GROUP"; groupId: string }
  | { type: "UPDATE_SIZES"; path: number[]; sizes: number[] }
  | { type: "SET_TAB_DIRTY"; groupId: string; tabId: string; isDirty: boolean }
  | { type: "PIN_TAB"; groupId: string; tabId: string }
  | { type: "UNPIN_TAB"; groupId: string; tabId: string }
  | { type: "CONFIRM_TAB"; groupId: string; tabId: string }
  | { type: "REORDER_TAB"; groupId: string; tabId: string; toIndex: number }
  | { type: "SPLIT_GROUP_WITH_TAB"; groupId: string; tabId: string; position: DropPosition }
  | { type: "SET_TREE"; tree: SplitNode; groups?: Record<string, EditorGroupState> };

function createEmptyGroup(): EditorGroupState {
  return { tabs: [], activeTabId: null, mruOrder: [] };
}

function updateMru(mru: string[], tabId: string): string[] {
  return [tabId, ...mru.filter((id) => id !== tabId)];
}

function cloneTabForSplit(tab: Tab): Tab {
  return {
    ...tab,
    content: isValidElement(tab.content) ? cloneElement(tab.content) : tab.content,
  };
}

function reducer(state: WorkbenchState, action: Action): WorkbenchState {
  switch (action.type) {
    case "OPEN_TAB": {
      // Validate the target group exists in the split tree.
      // If not (e.g. stale reference to a removed group), redirect to the
      // first group in the tree so the tab doesn't end up in a ghost group.
      let targetGroupId = action.groupId;
      const allIds = getAllGroupIds(state.splitTree);
      if (!allIds.includes(targetGroupId)) {
        targetGroupId = allIds[0] ?? targetGroupId;
      }

      const group = state.groups[targetGroupId] ?? createEmptyGroup();
      const existing = group.tabs.find((t) => t.id === action.tab.id);
      if (existing) {
        return {
          ...state,
          activeGroupId: targetGroupId,
          groups: {
            ...state.groups,
            [targetGroupId]: {
              ...group,
              activeTabId: action.tab.id,
              mruOrder: updateMru(group.mruOrder, action.tab.id),
            },
          },
        };
      }
      let newTabs = [...group.tabs];
      let newMru = group.mruOrder;
      let replaceIdx = -1;
      if (action.tab.isPreview) {
        replaceIdx = newTabs.findIndex((t) => t.isPreview);
        if (replaceIdx >= 0) {
          const replacedId = newTabs[replaceIdx].id;
          newTabs.splice(replaceIdx, 1);
          newMru = newMru.filter((id) => id !== replacedId);
        }
      }
      // If replacing a preview tab, insert at the same position; otherwise after active tab
      let insertIdx: number;
      if (replaceIdx >= 0) {
        insertIdx = replaceIdx;
      } else {
        const activeIdx = newTabs.findIndex((t) => t.id === group.activeTabId);
        insertIdx = activeIdx >= 0 ? activeIdx + 1 : newTabs.length;
      }
      newTabs.splice(insertIdx, 0, action.tab);

      return {
        ...state,
        activeGroupId: targetGroupId,
        groups: {
          ...state.groups,
          [targetGroupId]: {
            tabs: newTabs,
            activeTabId: action.tab.id,
            mruOrder: updateMru(newMru, action.tab.id),
          },
        },
      };
    }

    case "CLOSE_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      const closingTab = group.tabs.find((t) => t.id === action.tabId);
      if (closingTab && closingTab.closable === false) return state;
      const newTabs = group.tabs.filter((t) => t.id !== action.tabId);
      const newMru = group.mruOrder.filter((id) => id !== action.tabId);
      let newActiveId = group.activeTabId;
      if (group.activeTabId === action.tabId) {
        newActiveId = newMru[0] ?? null;
      }

      // Remove empty group (unless last)
      if (newTabs.length === 0) {
        const allGroups = getAllGroupIds(state.splitTree);
        if (allGroups.length > 1) {
          const newTree = simplifyTree(
            removeLeaf(state.splitTree, action.groupId) ?? state.splitTree
          );
          // Clean up: remove this group and any ghost groups not in the tree
          const treeGroupSet = new Set(getAllGroupIds(newTree));
          const cleanedGroups: Record<string, EditorGroupState> = {};
          for (const [gid, g] of Object.entries(state.groups)) {
            if (gid !== action.groupId && treeGroupSet.has(gid)) {
              cleanedGroups[gid] = g;
            }
          }
          return {
            splitTree: newTree,
            groups: cleanedGroups,
            activeGroupId:
              state.activeGroupId === action.groupId
                ? getAllGroupIds(newTree)[0] ?? null
                : state.activeGroupId,
          };
        }
      }

      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            tabs: newTabs,
            activeTabId: newActiveId,
            mruOrder: newMru,
          },
        },
      };
    }

    case "SET_ACTIVE_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      return {
        ...state,
        activeGroupId: action.groupId,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            activeTabId: action.tabId,
            mruOrder: updateMru(group.mruOrder, action.tabId),
          },
        },
      };
    }

    case "ACTIVATE_OR_OPEN_TAB": {
      // Search groups that exist in the split tree for a tab with the given ID.
      // If found, activate it in that group. Otherwise, open it in the fallback group.
      // This avoids stale-closure issues since the reducer always has the current state.
      // We only search groups present in the tree to avoid activating tabs in
      // "ghost" groups that were removed from the tree but linger in state.groups.
      const treeGroupIds = new Set(getAllGroupIds(state.splitTree));
      for (const [groupId, group] of Object.entries(state.groups)) {
        if (!treeGroupIds.has(groupId)) continue;
        if (group.tabs.some((t) => t.id === action.tab.id)) {
          return {
            ...state,
            activeGroupId: groupId,
            groups: {
              ...state.groups,
              [groupId]: {
                ...group,
                activeTabId: action.tab.id,
                mruOrder: updateMru(group.mruOrder, action.tab.id),
              },
            },
          };
        }
      }
      // Tab not found in any group — open it in the fallback group.
      // Validate that the fallback group exists in the split tree;
      // if it was removed (stale closure), fall back to the first tree group.
      const validFallback = treeGroupIds.has(action.fallbackGroupId)
        ? action.fallbackGroupId
        : getAllGroupIds(state.splitTree)[0] ?? action.fallbackGroupId;
      return reducer(state, { type: "OPEN_TAB", groupId: validFallback, tab: action.tab });
    }

    case "SET_ACTIVE_GROUP":
      return { ...state, activeGroupId: action.groupId };

    case "MOVE_TAB": {
      const sourceGroup = state.groups[action.sourceGroupId];
      if (!sourceGroup) return state;
      const tab = sourceGroup.tabs.find((t) => t.id === action.tabId);
      if (!tab) return state;

      // Remove from source
      const sourceTabs = sourceGroup.tabs.filter((t) => t.id !== action.tabId);
      const sourceMru = sourceGroup.mruOrder.filter((id) => id !== action.tabId);
      let sourceActiveId = sourceGroup.activeTabId;
      if (sourceActiveId === action.tabId) {
        sourceActiveId = sourceMru[0] ?? null;
      }

      // Add to target
      const targetGroup =
        action.sourceGroupId === action.targetGroupId
          ? { tabs: sourceTabs, activeTabId: sourceActiveId, mruOrder: sourceMru }
          : state.groups[action.targetGroupId] ?? createEmptyGroup();
      const targetTabs = [...targetGroup.tabs];
      targetTabs.splice(action.index ?? targetTabs.length, 0, tab);

      let newGroups: Record<string, EditorGroupState> = {
        ...state.groups,
        [action.sourceGroupId]: {
          tabs: sourceTabs,
          activeTabId: sourceActiveId,
          mruOrder: sourceMru,
        },
        [action.targetGroupId]: {
          tabs: targetTabs,
          activeTabId: action.tabId,
          mruOrder: updateMru(targetGroup.mruOrder, action.tabId),
        },
      };

      let newTree = state.splitTree;

      // Clean up empty source group
      if (sourceTabs.length === 0 && action.sourceGroupId !== action.targetGroupId) {
        const allGroups = getAllGroupIds(state.splitTree);
        if (allGroups.length > 1) {
          newTree = simplifyTree(
            removeLeaf(newTree, action.sourceGroupId) ?? newTree
          );
          const { [action.sourceGroupId]: _, ...rest } = newGroups;
          newGroups = rest;
        }
      }

      return {
        splitTree: newTree,
        groups: newGroups,
        activeGroupId: action.targetGroupId,
      };
    }

    case "SPLIT_AND_MOVE": {
      // Split the TARGET group and move the tab from SOURCE into the new group
      const sourceGroup = state.groups[action.sourceGroupId];
      if (!sourceGroup) return state;
      const tab = sourceGroup.tabs.find((t) => t.id === action.tabId);
      if (!tab) return state;

      // If source only has this tab and source===target, don't split (nothing to split from)
      if (
        action.sourceGroupId === action.targetGroupId &&
        sourceGroup.tabs.length <= 1
      ) {
        return reducer(state, {
          type: "SPLIT_GROUP_WITH_TAB",
          groupId: action.targetGroupId,
          tabId: action.tabId,
          position: action.position,
        });
      }

      const newGroupId = generateGroupId();
      // Split the target leaf in the tree
      const newTree = splitLeaf(
        state.splitTree,
        action.targetGroupId,
        newGroupId,
        action.position
      );

      // Remove tab from source
      const sourceTabs = sourceGroup.tabs.filter((t) => t.id !== action.tabId);
      const sourceMru = sourceGroup.mruOrder.filter((id) => id !== action.tabId);
      let sourceActiveId = sourceGroup.activeTabId;
      if (sourceActiveId === action.tabId) {
        sourceActiveId = sourceMru[0] ?? null;
      }

      let newGroups: Record<string, EditorGroupState> = {
        ...state.groups,
        [action.sourceGroupId]: {
          tabs: sourceTabs,
          activeTabId: sourceActiveId,
          mruOrder: sourceMru,
        },
        [newGroupId]: {
          tabs: [tab],
          activeTabId: tab.id,
          mruOrder: [tab.id],
        },
      };

      let finalTree = simplifyTree(newTree);

      // If source is now empty and different from target, remove it
      if (sourceTabs.length === 0 && action.sourceGroupId !== action.targetGroupId) {
        const allGroups = getAllGroupIds(finalTree);
        if (allGroups.length > 1) {
          finalTree = simplifyTree(
            removeLeaf(finalTree, action.sourceGroupId) ?? finalTree
          );
          const { [action.sourceGroupId]: _, ...rest } = newGroups;
          newGroups = rest;
        }
      }

      return {
        splitTree: finalTree,
        groups: newGroups,
        activeGroupId: newGroupId,
      };
    }

    case "REMOVE_GROUP": {
      const allGroups = getAllGroupIds(state.splitTree);
      if (allGroups.length <= 1) return state;
      const newTree = simplifyTree(
        removeLeaf(state.splitTree, action.groupId) ?? state.splitTree
      );
      const { [action.groupId]: _, ...restGroups } = state.groups;
      return {
        splitTree: newTree,
        groups: restGroups,
        activeGroupId:
          state.activeGroupId === action.groupId
            ? getAllGroupIds(newTree)[0] ?? null
            : state.activeGroupId,
      };
    }

    case "UPDATE_SIZES":
      return {
        ...state,
        splitTree: updateSizes(state.splitTree, action.path, action.sizes),
      };

    case "SET_TAB_DIRTY": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: group.tabs.map((t) =>
              t.id === action.tabId ? { ...t, isDirty: action.isDirty } : t
            ),
          },
        },
      };
    }

    case "PIN_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      const tab = group.tabs.find((t) => t.id === action.tabId);
      if (!tab) return state;
      const without = group.tabs.filter((t) => t.id !== action.tabId);
      const pinnedCount = without.filter((t) => t.isPinned).length;
      const newTabs = [...without];
      newTabs.splice(pinnedCount, 0, {
        ...tab,
        isPinned: true,
        isPreview: false,
      });
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: { ...group, tabs: newTabs },
        },
      };
    }

    case "UNPIN_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: group.tabs.map((t) =>
              t.id === action.tabId ? { ...t, isPinned: false } : t
            ),
          },
        },
      };
    }

    case "CONFIRM_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: {
            ...group,
            tabs: group.tabs.map((t) =>
              t.id === action.tabId ? { ...t, isPreview: false } : t
            ),
          },
        },
      };
    }

    case "REORDER_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      const tab = group.tabs.find((t) => t.id === action.tabId);
      if (!tab) return state;
      const without = group.tabs.filter((t) => t.id !== action.tabId);
      const newTabs = [...without];
      newTabs.splice(action.toIndex, 0, tab);
      return {
        ...state,
        groups: {
          ...state.groups,
          [action.groupId]: { ...group, tabs: newTabs },
        },
      };
    }

    case "SPLIT_GROUP_WITH_TAB": {
      const group = state.groups[action.groupId];
      if (!group) return state;
      const tab = group.tabs.find((candidate) => candidate.id === action.tabId);
      if (!tab) return state;
      const duplicatedTab = cloneTabForSplit(tab);

      const newGroupId = generateGroupId();
      const newTree = simplifyTree(
        splitLeaf(state.splitTree, action.groupId, newGroupId, action.position)
      );

      return {
        splitTree: newTree,
        groups: {
          ...state.groups,
          [newGroupId]: {
            tabs: [duplicatedTab],
            activeTabId: duplicatedTab.id,
            mruOrder: [duplicatedTab.id],
          },
        },
        activeGroupId: newGroupId,
      };
    }

    case "SET_TREE":
      return {
        ...state,
        splitTree: action.tree,
        groups: action.groups ?? state.groups,
      };

    default:
      return state;
  }
}

// ─── Context ─────────────────────────────────────────────────

interface WorkbenchContextValue {
  state: WorkbenchState;
  dispatch: Dispatch<Action>;
}

const WorkbenchContext = createContext<WorkbenchContextValue | null>(null);

export function useWorkbench(): WorkbenchContextValue {
  const ctx = useContext(WorkbenchContext);
  if (!ctx)
    throw new Error("useWorkbench must be used within WorkbenchProvider");
  return ctx;
}

interface WorkbenchProviderProps {
  initialState?: Partial<WorkbenchState>;
  children: ReactNode;
}

export function WorkbenchProvider({
  initialState,
  children,
}: WorkbenchProviderProps) {
  const defaultGroupId = "group-0";
  const defaultState: WorkbenchState = {
    splitTree: createLeaf(defaultGroupId),
    groups: { [defaultGroupId]: createEmptyGroup() },
    activeGroupId: defaultGroupId,
  };

  const [state, dispatch] = useReducer(reducer, {
    ...defaultState,
    ...initialState,
  });

  return (
    <WorkbenchContext.Provider value={{ state, dispatch }}>
      {children}
    </WorkbenchContext.Provider>
  );
}

// ─── Convenience Hooks ───────────────────────────────────────

export function useWorkbenchActions() {
  const { dispatch } = useWorkbench();

  return {
    openTab: useCallback(
      (groupId: string, tab: Tab) =>
        dispatch({ type: "OPEN_TAB", groupId, tab }),
      [dispatch]
    ),
    closeTab: useCallback(
      (groupId: string, tabId: string) =>
        dispatch({ type: "CLOSE_TAB", groupId, tabId }),
      [dispatch]
    ),
    setActiveTab: useCallback(
      (groupId: string, tabId: string) =>
        dispatch({ type: "SET_ACTIVE_TAB", groupId, tabId }),
      [dispatch]
    ),
    setActiveGroup: useCallback(
      (groupId: string) => dispatch({ type: "SET_ACTIVE_GROUP", groupId }),
      [dispatch]
    ),
    moveTab: useCallback(
      (
        sourceGroupId: string,
        tabId: string,
        targetGroupId: string,
        index?: number
      ) =>
        dispatch({
          type: "MOVE_TAB",
          sourceGroupId,
          tabId,
          targetGroupId,
          index,
        }),
      [dispatch]
    ),
    updateSizes: useCallback(
      (path: number[], sizes: number[]) =>
        dispatch({ type: "UPDATE_SIZES", path, sizes }),
      [dispatch]
    ),
    reorderTab: useCallback(
      (groupId: string, tabId: string, toIndex: number) =>
        dispatch({ type: "REORDER_TAB", groupId, tabId, toIndex }),
      [dispatch]
    ),
    splitGroupWithTab: useCallback(
      (groupId: string, tabId: string, position: DropPosition) =>
        dispatch({ type: "SPLIT_GROUP_WITH_TAB", groupId, tabId, position }),
      [dispatch]
    ),
    activateOrOpenTab: useCallback(
      (fallbackGroupId: string, tab: Tab) =>
        dispatch({ type: "ACTIVATE_OR_OPEN_TAB", fallbackGroupId, tab }),
      [dispatch]
    ),
    pinTab: useCallback(
      (groupId: string, tabId: string) =>
        dispatch({ type: "PIN_TAB", groupId, tabId }),
      [dispatch]
    ),
    unpinTab: useCallback(
      (groupId: string, tabId: string) =>
        dispatch({ type: "UNPIN_TAB", groupId, tabId }),
      [dispatch]
    ),
    /** Remove preview status from a tab without pinning it (e.g. on double-click). */
    confirmTab: useCallback(
      (groupId: string, tabId: string) =>
        dispatch({ type: "CONFIRM_TAB", groupId, tabId }),
      [dispatch]
    ),
    setTabDirty: useCallback(
      (groupId: string, tabId: string, isDirty: boolean) =>
        dispatch({ type: "SET_TAB_DIRTY", groupId, tabId, isDirty }),
      [dispatch]
    ),
    dispatch,
  };
}
