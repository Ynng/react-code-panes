import type { AgentTraceTurn } from "../types/agentTrace";
import { parseAgentTrace } from "../utils/agentTrace";
import type { ChangedFileItem, CodeFileTreeItem } from "../index";
import claudeCodeTraceRaw from "./fixtures/claude-code.raw.jsonl?raw";
import trajectoryTraceRaw from "./fixtures/trajectory-format.json?raw";
import codexTraceRaw from "./fixtures/codex-cli.raw.jsonl?raw";
import geminiTraceRaw from "./fixtures/gemini-cli.raw.json?raw";
import miniSweAgentTraceRaw from "./fixtures/mini-swe-agent.raw.json?raw";
import openCodeTraceRaw from "./fixtures/opencode.raw.json?raw";

export interface ExampleFile {
  id: string;
  path: string;
  language: string;
  content: string;
}

export interface ExampleDiffFile extends ChangedFileItem {
  language: string;
  original: string;
  modified: string;
}

export interface TraceSample {
  id: string;
  title: string;
  path: string;
  raw: string;
  turns: AgentTraceTurn[];
}

export const exampleFiles: ExampleFile[] = [
  {
    id: "App.tsx",
    path: "src/App.tsx",
    language: "tsx",
    content: `import { TaskList } from "./components/TaskList";
import { StatusBar } from "./components/StatusBar";
import "./styles/app.css";

export function App() {
  return (
    <main className="app-shell">
      <header className="app-header">
        <div>
          <h1>Project Dashboard</h1>
          <p>Track tasks, review changes, and inspect activity logs.</p>
        </div>
        <button className="primary-button">New task</button>
      </header>

      <section className="content-grid">
        <TaskList />
        <StatusBar />
      </section>
    </main>
  );
}
`,
  },
  {
    id: "index.ts",
    path: "src/index.ts",
    language: "ts",
    content: `export { App } from "./App";
export { TaskList } from "./components/TaskList";
export { StatusBar } from "./components/StatusBar";
export { buildNavTabs } from "./lib/navigation";
`,
  },
  {
    id: "TaskList.tsx",
    path: "src/components/TaskList.tsx",
    language: "tsx",
    content: `const rows = [
  { label: "completed", value: "18 / 24", tone: "good" },
  { label: "in progress", value: "4", tone: "neutral" },
  { label: "blocked", value: "2", tone: "warning" },
];

export function TaskList() {
  return (
    <section className="task-card">
      <header>
        <h2>Current sprint</h2>
        <span className="status-badge">Active</span>
      </header>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="task-row">
            <dt>{row.label}</dt>
            <dd data-tone={row.tone}>{row.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}
`,
  },
  {
    id: "StatusBar.tsx",
    path: "src/components/StatusBar.tsx",
    language: "tsx",
    content: `type Props = {
  entries: LogEntry[];
  filter?: "all" | "info" | "error";
};

export function StatusBar({ entries, filter = "all" }: Props) {
  const visible = entries.filter((entry) => {
    if (filter === "info") return entry.level === "info";
    if (filter === "error") return entry.level === "error";
    return true;
  });

  return (
    <div className="status-bar">
      <StatusToolbar filter={filter} />
      {visible.map((entry) => (
        <StatusRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
`,
  },
  {
    id: "FileTree.tsx",
    path: "src/components/FileTree.tsx",
    language: "tsx",
    content: `export function FileTree({ files, onOpenFile }: Props) {
  return (
    <div className="file-tree">
      {files.map((file) => (
        <button
          key={file.path}
          className="file-tree-row"
          onClick={() => onOpenFile(file.path)}
        >
          <FileIcon filename={file.path} />
          <span className="file-tree-label">{file.path}</span>
          {file.status && <span className="file-tree-status">{file.status}</span>}
        </button>
      ))}
    </div>
  );
}
`,
  },
  {
    id: "app.css",
    path: "src/styles/app.css",
    language: "css",
    content: `.status-bar {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.status-toolbar {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.file-tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
}
`,
  },
  {
    id: "server.py",
    path: "api/server.py",
    language: "python",
    content: `from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class TaskRequest:
    project_id: str
    assignee: str


def create_task(request: TaskRequest) -> Path:
    task_dir = Path("data") / request.project_id / request.assignee
    task_dir.mkdir(parents=True, exist_ok=True)
    return task_dir
`,
  },
  {
    id: "README.md",
    path: "README.md",
    language: "markdown",
    content: `# React Code Panes Example Workspace

This Storybook scene mirrors a code review surface:

- code files in a draggable explorer
- unified diff overview plus per-file Monaco diff
- agent trace viewers for multiple formats
- bottom panel for terminal, problems, and structured output
`,
  },
  {
    id: "package.json",
    path: "package.json",
    language: "json",
    content: `{
  "name": "example-workspace",
  "private": true,
  "type": "module",
  "scripts": {
    "dev": "vite",
    "build": "vite build",
    "lint": "eslint ."
  }
}
`,
  },
  {
    id: "vite.config.ts",
    path: "vite.config.ts",
    language: "ts",
    content: `import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
  },
});
`,
  },
  {
    id: ".gitignore",
    path: ".gitignore",
    language: "plaintext",
    content: `node_modules
dist
.DS_Store
*.log
coverage
`,
  },
];

export const exampleDiffFiles: ExampleDiffFile[] = [
  {
    path: "src/components/StatusBar.tsx",
    additions: 24,
    deletions: 7,
    status: "modified",
    language: "tsx",
    original: `type Props = {
  entries: LogEntry[];
};

export function StatusBar({ entries }: Props) {
  return (
    <div className="status-bar">
      {entries.map((entry) => (
        <StatusRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
`,
    modified: `type Props = {
  entries: LogEntry[];
  filter?: "all" | "info" | "error";
};

export function StatusBar({ entries, filter = "all" }: Props) {
  const visible = entries.filter((entry) => {
    if (filter === "info") return entry.level === "info";
    if (filter === "error") return entry.level === "error";
    return true;
  });

  return (
    <div className="status-bar">
      <StatusToolbar filter={filter} />
      {visible.map((entry) => (
        <StatusRow key={entry.id} entry={entry} />
      ))}
    </div>
  );
}
`,
  },
  {
    path: "src/components/FileTree.tsx",
    additions: 18,
    deletions: 5,
    status: "modified",
    language: "tsx",
    original: `export function FileTree({ files, onOpenFile }: Props) {
  return (
    <div className="file-tree">
      {files.map((file) => (
        <button key={file.path} onClick={() => onOpenFile(file.path)}>
          {file.path}
        </button>
      ))}
    </div>
  );
}
`,
    modified: `export function FileTree({ files, onOpenFile }: Props) {
  return (
    <div className="file-tree">
      {files.map((file) => (
        <button
          key={file.path}
          className="file-tree-row"
          onClick={() => onOpenFile(file.path)}
        >
          <FileIcon filename={file.path} />
          <span className="file-tree-label">{file.path}</span>
          {file.status && <span className="file-tree-status">{file.status}</span>}
        </button>
      ))}
    </div>
  );
}
`,
  },
  {
    path: "src/styles/app.css",
    additions: 11,
    deletions: 1,
    status: "modified",
    language: "css",
    original: `.status-bar {
  padding: 12px;
}

.file-tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
`,
    modified: `.status-bar {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.status-toolbar {
  display: flex;
  gap: 8px;
  padding-bottom: 8px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
}

.file-tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
  border-radius: 6px;
}
`,
  },
];

export const workspaceUnifiedDiff = `diff --git a/src/components/StatusBar.tsx b/src/components/StatusBar.tsx
index 1e14dd1..78b4aa2 100644
--- a/src/components/StatusBar.tsx
+++ b/src/components/StatusBar.tsx
@@ -1,13 +1,25 @@
-type Props = {
-  entries: LogEntry[];
-};
+type Props = {
+  entries: LogEntry[];
+  filter?: "all" | "info" | "error";
+};

-export function StatusBar({ entries }: Props) {
+export function StatusBar({ entries, filter = "all" }: Props) {
+  const visible = entries.filter((entry) => {
+    if (filter === "info") return entry.level === "info";
+    if (filter === "error") return entry.level === "error";
+    return true;
+  });
+
   return (
     <div className="status-bar">
-      {entries.map((entry) => (
+      <StatusToolbar filter={filter} />
+      {visible.map((entry) => (
         <StatusRow key={entry.id} entry={entry} />
       ))}
     </div>
   );
 }
diff --git a/src/components/FileTree.tsx b/src/components/FileTree.tsx
index 0d3ad66..3b18c51 100644
--- a/src/components/FileTree.tsx
+++ b/src/components/FileTree.tsx
@@ -1,10 +1,18 @@
 export function FileTree({ files, onOpenFile }: Props) {
   return (
     <div className="file-tree">
       {files.map((file) => (
-        <button key={file.path} onClick={() => onOpenFile(file.path)}>
-          {file.path}
+        <button
+          key={file.path}
+          className="file-tree-row"
+          onClick={() => onOpenFile(file.path)}
+        >
+          <FileIcon filename={file.path} />
+          <span className="file-tree-label">{file.path}</span>
+          {file.status && <span className="file-tree-status">{file.status}</span>}
         </button>
       ))}
     </div>
   );
 }
diff --git a/src/styles/app.css b/src/styles/app.css
index 8fe32ab..1f53ee7 100644
--- a/src/styles/app.css
+++ b/src/styles/app.css
@@ -1,8 +1,18 @@
 .status-bar {
-  padding: 12px;
+  display: grid;
+  gap: 12px;
+  padding: 14px;
+}
+
+.status-toolbar {
+  display: flex;
+  gap: 8px;
+  padding-bottom: 8px;
+  border-bottom: 1px solid rgba(255, 255, 255, 0.08);
 }

 .file-tree-row {
   display: flex;
   align-items: center;
   gap: 8px;
+  border-radius: 6px;
 }
`;

export const exampleFileTree: CodeFileTreeItem[] = [
  {
    path: "src",
    type: "folder",
    children: [
      { path: "src/App.tsx", type: "file" },
      { path: "src/index.ts", type: "file" },
      {
        path: "src/components",
        type: "folder",
        children: [
          { path: "src/components/TaskList.tsx", type: "file" },
          { path: "src/components/StatusBar.tsx", type: "file" },
          { path: "src/components/FileTree.tsx", type: "file" },
        ],
      },
      {
        path: "src/styles",
        type: "folder",
        children: [{ path: "src/styles/app.css", type: "file" }],
      },
    ],
  },
  {
    path: "api",
    type: "folder",
    children: [{ path: "api/server.py", type: "file" }],
  },
  {
    path: "repo",
    type: "folder",
    children: [
      { path: "README.md", type: "file" },
      { path: "package.json", type: "file" },
      { path: "vite.config.ts", type: "file" },
      { path: ".gitignore", type: "file" },
    ],
  },
];

const traceFixtureSamples = [
  {
    id: "trajectory-format.json",
    title: "Trajectory Format",
    path: "traces/trajectory/trajectory-format.json",
    raw: trajectoryTraceRaw,
  },
  {
    id: "codex-cli.raw.jsonl",
    title: "Codex CLI",
    path: "traces/codex/codex-cli.raw.jsonl",
    raw: codexTraceRaw,
  },
  {
    id: "claude-code.raw.jsonl",
    title: "Claude Code",
    path: "traces/claude/claude-code.raw.jsonl",
    raw: claudeCodeTraceRaw,
  },
  {
    id: "gemini-cli.raw.json",
    title: "Gemini CLI",
    path: "traces/gemini/gemini-cli.raw.json",
    raw: geminiTraceRaw,
  },
  {
    id: "opencode.raw.json",
    title: "OpenCode",
    path: "traces/opencode/opencode.raw.json",
    raw: openCodeTraceRaw,
  },
  {
    id: "mini-swe-agent.raw.json",
    title: "mini-swe-agent",
    path: "traces/mini-swe-agent/mini-swe-agent.raw.json",
    raw: miniSweAgentTraceRaw,
  },
] as const;

export const traceSamples: TraceSample[] = traceFixtureSamples.map((sample) => ({
  ...sample,
  turns: parseAgentTrace(sample.raw),
}));

export const traceFileTree: CodeFileTreeItem[] = [
  {
    path: "traces",
    type: "folder",
    children: [
      {
        path: "traces/trajectory",
        type: "folder",
        children: [{ path: "traces/trajectory/trajectory-format.json", type: "file" }],
      },
      {
        path: "traces/codex",
        type: "folder",
        children: [{ path: "traces/codex/codex-cli.raw.jsonl", type: "file" }],
      },
      {
        path: "traces/claude",
        type: "folder",
        children: [{ path: "traces/claude/claude-code.raw.jsonl", type: "file" }],
      },
      {
        path: "traces/gemini",
        type: "folder",
        children: [{ path: "traces/gemini/gemini-cli.raw.json", type: "file" }],
      },
      {
        path: "traces/opencode",
        type: "folder",
        children: [{ path: "traces/opencode/opencode.raw.json", type: "file" }],
      },
      {
        path: "traces/mini-swe-agent",
        type: "folder",
        children: [{ path: "traces/mini-swe-agent/mini-swe-agent.raw.json", type: "file" }],
      },
    ],
  },
];

export function getExampleFileByPath(path: string) {
  return exampleFiles.find((file) => file.path === path);
}

export function getExampleFileById(id: string) {
  return exampleFiles.find((file) => file.id === id);
}

export function getExampleDiffFile(path: string) {
  return exampleDiffFiles.find((file) => file.path === path);
}

export function getTraceSampleById(id: string) {
  return traceSamples.find((sample) => sample.id === id);
}

export function getTraceSampleByPath(path: string) {
  return traceSamples.find((sample) => sample.path === path);
}
