import { CSSProperties } from "react";
import { MATERIAL_ICON_DATA } from "./materialIconTheme";

const SIZE = 16;

const EXT_ICON: Record<string, string> = {
  ts: "typescript",
  tsx: "react_ts",
  js: "javascript",
  jsx: "react",
  py: "python",
  rs: "rust",
  go: "go",
  html: "html",
  htm: "html",
  css: "css",
  scss: "css",
  json: "json",
  yaml: "yaml",
  yml: "yaml",
  toml: "toml",
  xml: "xml",
  md: "markdown",
  mdx: "markdown",
  sh: "console",
  bash: "console",
  zsh: "console",
  sql: "database",
  lock: "lock",
  svg: "xml",
  png: "image",
  jpg: "image",
  jpeg: "image",
  gif: "image",
  webp: "image",
  diff: "git",
  patch: "git",
  log: "log",
};

const NAME_ICON: Record<string, string> = {
  trajectory: "document",
  dockerfile: "docker",
  makefile: "makefile",
  ".gitignore": "git",
  "vite.config.ts": "vite",
  "package.json": "json",
  "tsconfig.json": "typescript",
  "evaluator.json": "json",
  "stats.json": "json",
};

function getExtension(filename: string): string {
  const lower = filename.toLowerCase();
  return lower.includes(".") ? lower.split(".").pop() ?? "" : "";
}

function getFileIconName(filename: string): string {
  const lower = filename.toLowerCase();
  return NAME_ICON[lower] ?? EXT_ICON[getExtension(filename)] ?? "document";
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

export function FileIcon({ filename, className }: { filename: string; className?: string }) {
  const iconName = getFileIconName(filename);
  return (
    <span className={className} style={iconWrapperStyle()} aria-hidden="true">
      <img
        src={MATERIAL_ICON_DATA[iconName] ?? MATERIAL_ICON_DATA.document}
        alt=""
        width={SIZE}
        height={SIZE}
        draggable={false}
        style={{ width: SIZE, height: SIZE }}
      />
    </span>
  );
}

export function FolderIcon({ open, className }: { open: boolean; className?: string }) {
  return (
    <span className={className} style={iconWrapperStyle()} aria-hidden="true">
      <img
        src={open ? MATERIAL_ICON_DATA["folder-open"] : MATERIAL_ICON_DATA.folder}
        alt=""
        width={SIZE}
        height={SIZE}
        draggable={false}
        style={{ width: SIZE, height: SIZE }}
      />
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
