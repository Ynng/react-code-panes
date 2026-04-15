/**
 * Icon mappings and SVG data sourced directly from the material-icon-theme npm
 * package (https://npmjs.com/package/material-icon-theme).
 *
 * Mapping tables below are a curated subset of the full manifest located at
 * material-icon-theme/dist/material-icons.json.  To add a new file type or
 * folder, find its icon ID in the manifest and add the corresponding import.
 */

// ---------------------------------------------------------------------------
// SVG imports — bundled as data-URIs by tsup (esbuild) / Vite
// ---------------------------------------------------------------------------

// File icons
import consoleSvg from "material-icon-theme/icons/console.svg";
import cssSvg from "material-icon-theme/icons/css.svg";
import databaseSvg from "material-icon-theme/icons/database.svg";
import dockerSvg from "material-icon-theme/icons/docker.svg";
import documentSvg from "material-icon-theme/icons/document.svg";
import fileSvg from "material-icon-theme/icons/file.svg";
import gitSvg from "material-icon-theme/icons/git.svg";
import goSvg from "material-icon-theme/icons/go.svg";
import htmlSvg from "material-icon-theme/icons/html.svg";
import imageSvg from "material-icon-theme/icons/image.svg";
import javascriptSvg from "material-icon-theme/icons/javascript.svg";
import jsonSvg from "material-icon-theme/icons/json.svg";
import licenseSvg from "material-icon-theme/icons/license.svg";
import lockSvg from "material-icon-theme/icons/lock.svg";
import logSvg from "material-icon-theme/icons/log.svg";
import makefileSvg from "material-icon-theme/icons/makefile.svg";
import markdownSvg from "material-icon-theme/icons/markdown.svg";
import mdxSvg from "material-icon-theme/icons/mdx.svg";
import nodejsSvg from "material-icon-theme/icons/nodejs.svg";
import playwrightSvg from "material-icon-theme/icons/playwright.svg";
import pnpmSvg from "material-icon-theme/icons/pnpm.svg";
import pythonSvg from "material-icon-theme/icons/python.svg";
import reactSvg from "material-icon-theme/icons/react.svg";
import reactTsSvg from "material-icon-theme/icons/react_ts.svg";
import readmeSvg from "material-icon-theme/icons/readme.svg";
import rustSvg from "material-icon-theme/icons/rust.svg";
import sassSvg from "material-icon-theme/icons/sass.svg";
import svgIconSvg from "material-icon-theme/icons/svg.svg";
import tomlSvg from "material-icon-theme/icons/toml.svg";
import tsconfigSvg from "material-icon-theme/icons/tsconfig.svg";
import viteSvg from "material-icon-theme/icons/vite.svg";
import xmlSvg from "material-icon-theme/icons/xml.svg";
import yarnSvg from "material-icon-theme/icons/yarn.svg";

// Folder icons (closed)
import folderSvg from "material-icon-theme/icons/folder.svg";
import folderComponentsSvg from "material-icon-theme/icons/folder-components.svg";
import folderCoverageSvg from "material-icon-theme/icons/folder-coverage.svg";
import folderCssSvg from "material-icon-theme/icons/folder-css.svg";
import folderDistSvg from "material-icon-theme/icons/folder-dist.svg";
import folderDocsSvg from "material-icon-theme/icons/folder-docs.svg";
import folderImagesSvg from "material-icon-theme/icons/folder-images.svg";
import folderMockSvg from "material-icon-theme/icons/folder-mock.svg";
import folderScriptsSvg from "material-icon-theme/icons/folder-scripts.svg";
import folderSrcSvg from "material-icon-theme/icons/folder-src.svg";
import folderStorybookSvg from "material-icon-theme/icons/folder-storybook.svg";
import folderTestSvg from "material-icon-theme/icons/folder-test.svg";

// Folder icons (open)
import folderOpenSvg from "material-icon-theme/icons/folder-open.svg";
import folderComponentsOpenSvg from "material-icon-theme/icons/folder-components-open.svg";
import folderCoverageOpenSvg from "material-icon-theme/icons/folder-coverage-open.svg";
import folderCssOpenSvg from "material-icon-theme/icons/folder-css-open.svg";
import folderDistOpenSvg from "material-icon-theme/icons/folder-dist-open.svg";
import folderDocsOpenSvg from "material-icon-theme/icons/folder-docs-open.svg";
import folderImagesOpenSvg from "material-icon-theme/icons/folder-images-open.svg";
import folderMockOpenSvg from "material-icon-theme/icons/folder-mock-open.svg";
import folderScriptsOpenSvg from "material-icon-theme/icons/folder-scripts-open.svg";
import folderSrcOpenSvg from "material-icon-theme/icons/folder-src-open.svg";
import folderStorybookOpenSvg from "material-icon-theme/icons/folder-storybook-open.svg";
import folderTestOpenSvg from "material-icon-theme/icons/folder-test-open.svg";

// ---------------------------------------------------------------------------
// Defaults
// ---------------------------------------------------------------------------

export const MATERIAL_DEFAULT_FILE_ICON_ID = "file";
export const MATERIAL_DEFAULT_FOLDER_ICON_ID = "folder";
export const MATERIAL_DEFAULT_FOLDER_EXPANDED_ICON_ID = "folder-open";

// ---------------------------------------------------------------------------
// Mapping tables (curated subset of material-icons.json manifest)
// ---------------------------------------------------------------------------

export const MATERIAL_FILE_EXTENSION_ICON_IDS = {
  bash: "console",
  css: "css",
  gif: "image",
  go: "go",
  htm: "html",
  jpeg: "image",
  jpg: "image",
  json: "json",
  jsonl: "json",
  jsx: "react",
  lock: "lock",
  log: "log",
  md: "markdown",
  mdx: "mdx",
  mjs: "javascript",
  patch: "git",
  png: "image",
  py: "python",
  rs: "rust",
  scss: "sass",
  sh: "console",
  sql: "database",
  svg: "svg",
  toml: "toml",
  tsx: "react_ts",
  txt: "document",
  webp: "image",
  xml: "xml",
  zsh: "console",
} as const;

export const MATERIAL_FILE_NAME_ICON_IDS = {
  ".gitignore": "git",
  dockerfile: "docker",
  license: "license",
  makefile: "makefile",
  "package-lock.json": "nodejs",
  "package.json": "nodejs",
  "playwright.config.ts": "playwright",
  "pnpm-lock.yaml": "pnpm",
  "readme.md": "readme",
  "tsconfig.json": "tsconfig",
  "vite.config.ts": "vite",
  "yarn.lock": "yarn",
} as const;

export const MATERIAL_FOLDER_ICON_IDS = {
  ".storybook": "folder-storybook",
  components: "folder-components",
  coverage: "folder-coverage",
  docs: "folder-docs",
  fixtures: "folder-mock",
  icons: "folder-images",
  images: "folder-images",
  output: "folder-dist",
  scripts: "folder-scripts",
  src: "folder-src",
  stories: "folder-storybook",
  storybook: "folder-storybook",
  styles: "folder-css",
  test: "folder-test",
  tests: "folder-test",
} as const;

export const MATERIAL_FOLDER_EXPANDED_ICON_IDS = {
  ".storybook": "folder-storybook-open",
  components: "folder-components-open",
  coverage: "folder-coverage-open",
  docs: "folder-docs-open",
  fixtures: "folder-mock-open",
  icons: "folder-images-open",
  images: "folder-images-open",
  output: "folder-dist-open",
  scripts: "folder-scripts-open",
  src: "folder-src-open",
  stories: "folder-storybook-open",
  storybook: "folder-storybook-open",
  styles: "folder-css-open",
  test: "folder-test-open",
  tests: "folder-test-open",
} as const;

// ---------------------------------------------------------------------------
// Icon data — maps icon ID → SVG URL (data-URI in library build, asset URL
// in dev/Storybook).  FileIcon and FolderIcon components use this to render
// <img> elements.
// ---------------------------------------------------------------------------

export const MATERIAL_ICON_DATA: Record<string, string> = {
  // File icons
  console: consoleSvg,
  css: cssSvg,
  database: databaseSvg,
  docker: dockerSvg,
  document: documentSvg,
  file: fileSvg,
  git: gitSvg,
  go: goSvg,
  html: htmlSvg,
  image: imageSvg,
  javascript: javascriptSvg,
  json: jsonSvg,
  license: licenseSvg,
  lock: lockSvg,
  log: logSvg,
  makefile: makefileSvg,
  markdown: markdownSvg,
  mdx: mdxSvg,
  nodejs: nodejsSvg,
  playwright: playwrightSvg,
  pnpm: pnpmSvg,
  python: pythonSvg,
  react: reactSvg,
  react_ts: reactTsSvg,
  readme: readmeSvg,
  rust: rustSvg,
  sass: sassSvg,
  svg: svgIconSvg,
  toml: tomlSvg,
  tsconfig: tsconfigSvg,
  vite: viteSvg,
  xml: xmlSvg,
  yarn: yarnSvg,

  // Folder icons (closed)
  folder: folderSvg,
  "folder-components": folderComponentsSvg,
  "folder-coverage": folderCoverageSvg,
  "folder-css": folderCssSvg,
  "folder-dist": folderDistSvg,
  "folder-docs": folderDocsSvg,
  "folder-images": folderImagesSvg,
  "folder-mock": folderMockSvg,
  "folder-scripts": folderScriptsSvg,
  "folder-src": folderSrcSvg,
  "folder-storybook": folderStorybookSvg,
  "folder-test": folderTestSvg,

  // Folder icons (open)
  "folder-open": folderOpenSvg,
  "folder-components-open": folderComponentsOpenSvg,
  "folder-coverage-open": folderCoverageOpenSvg,
  "folder-css-open": folderCssOpenSvg,
  "folder-dist-open": folderDistOpenSvg,
  "folder-docs-open": folderDocsOpenSvg,
  "folder-images-open": folderImagesOpenSvg,
  "folder-mock-open": folderMockOpenSvg,
  "folder-scripts-open": folderScriptsOpenSvg,
  "folder-src-open": folderSrcOpenSvg,
  "folder-storybook-open": folderStorybookOpenSvg,
  "folder-test-open": folderTestOpenSvg,
};
