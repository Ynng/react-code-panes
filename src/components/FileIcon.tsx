import { CSSProperties } from "react";
import {
  MATERIAL_DEFAULT_FILE_ICON_ID,
  MATERIAL_DEFAULT_FOLDER_EXPANDED_ICON_ID,
  MATERIAL_DEFAULT_FOLDER_ICON_ID,
  MATERIAL_FILE_EXTENSION_ICON_IDS,
  MATERIAL_FILE_NAME_ICON_IDS,
  MATERIAL_FOLDER_EXPANDED_ICON_IDS,
  MATERIAL_FOLDER_ICON_IDS,
  MATERIAL_ICON_DATA,
} from "./materialIconTheme";

const SIZE = 16;

function basename(path: string): string {
  const normalized = path.replace(/\\/g, "/");
  const parts = normalized.split("/").filter(Boolean);
  return parts[parts.length - 1] ?? path;
}

function getExtension(filename: string): string {
  const base = basename(filename).toLowerCase();
  return base.includes(".") ? base.split(".").pop() ?? "" : "";
}

function getFileIconId(filename: string): string {
  const base = basename(filename).toLowerCase();
  const ext = getExtension(base);
  return (MATERIAL_FILE_NAME_ICON_IDS as Record<string, string>)[base]
    ?? (MATERIAL_FILE_EXTENSION_ICON_IDS as Record<string, string>)[ext]
    ?? MATERIAL_DEFAULT_FILE_ICON_ID;
}

function getFolderIconId(name: string | undefined, open: boolean): string {
  const lower = name ? basename(name).toLowerCase() : "";
  if (open) {
    return (MATERIAL_FOLDER_EXPANDED_ICON_IDS as Record<string, string>)[lower] ?? MATERIAL_DEFAULT_FOLDER_EXPANDED_ICON_ID;
  }
  return (MATERIAL_FOLDER_ICON_IDS as Record<string, string>)[lower] ?? MATERIAL_DEFAULT_FOLDER_ICON_ID;
}

function iconWrapperStyle(): CSSProperties {
  return {
    width: SIZE,
    height: SIZE,
    display: "inline-flex",
    alignItems: "center",
    justifyContent: "center",
    flexShrink: 0,
    userSelect: "none",
  };
}

function IconImage({ iconId }: { iconId: string }) {
  return (
    <img
      src={MATERIAL_ICON_DATA[iconId] ?? MATERIAL_ICON_DATA[MATERIAL_DEFAULT_FILE_ICON_ID]}
      alt=""
      width={SIZE}
      height={SIZE}
      draggable={false}
      style={{ width: SIZE, height: SIZE }}
    />
  );
}

export function FileIcon({ filename, className }: { filename: string; className?: string }) {
  return (
    <span className={className} style={iconWrapperStyle()} aria-hidden="true">
      <IconImage iconId={getFileIconId(filename)} />
    </span>
  );
}

export function FolderIcon({ open, name, className }: { open: boolean; name?: string; className?: string }) {
  return (
    <span className={className} style={iconWrapperStyle()} aria-hidden="true">
      <IconImage iconId={getFolderIconId(name, open)} />
    </span>
  );
}

export function getStatusColor(status: string): string {
  switch (status) {
    case "added":
      return "#73c991";
    case "deleted":
      return "#c74e39";
    case "modified":
      return "#e2c08d";
    case "renamed":
      return "#73c991";
    default:
      return "#e2c08d";
  }
}

export function getStatusLetter(status: string): string {
  switch (status) {
    case "added":
      return "A";
    case "deleted":
      return "D";
    case "modified":
      return "M";
    case "renamed":
      return "R";
    default:
      return "M";
  }
}
