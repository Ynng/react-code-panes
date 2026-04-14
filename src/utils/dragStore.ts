import { Tab } from "../types";

/**
 * In-memory store for drag data that can't be serialized to dataTransfer
 * (e.g., React elements in Tab objects).
 * This is set on dragStart and read on drop, within the same JS runtime.
 */
let pendingTab: Tab | null = null;

export function setDragTab(tab: Tab) {
  pendingTab = tab;
}

export function getDragTab(): Tab | null {
  const tab = pendingTab;
  pendingTab = null;
  return tab;
}

export function clearDragTab() {
  pendingTab = null;
}
