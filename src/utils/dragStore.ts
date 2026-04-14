import { Tab } from "../types";

/**
 * In-memory store for drag data that can't be serialized to dataTransfer
 * (e.g., React elements in Tab objects).
 * This is set on dragStart and read on drop, within the same JS runtime.
 */
let pendingTab: Tab | null = null;
let clearTimer: ReturnType<typeof setTimeout> | null = null;

export function setDragTab(tab: Tab) {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  pendingTab = tab;
}

export function getDragTab(): Tab | null {
  return pendingTab;
}

export function clearDragTab() {
  if (clearTimer) {
    clearTimeout(clearTimer);
    clearTimer = null;
  }
  pendingTab = null;
}

export function scheduleClearDragTab() {
  if (clearTimer) clearTimeout(clearTimer);
  clearTimer = setTimeout(() => {
    pendingTab = null;
    clearTimer = null;
  }, 0);
}
