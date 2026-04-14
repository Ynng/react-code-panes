import type { AgentTraceTurn } from "../types/agentTrace";
import { parseAgentTrace } from "../utils/agentTrace";
import type { ChangedFileItem, CodeFileTreeItem } from "../index";
import claudeCodeTraceRaw from "./fixtures/claude-code-opus-4.6-max.raw.jsonl?raw";
import atifGeminiTraceRaw from "./fixtures/atif-gemini-cli-3.1-pro.trajectory.json?raw";
import codexTraceRaw from "./fixtures/codex-cli-gpt-5.4-xhigh.raw.jsonl?raw";
import geminiTraceRaw from "./fixtures/gemini-cli-3.1-pro.raw.json?raw";
import miniSweAgentTraceRaw from "./fixtures/mini-swe-agent-gpt-5.4.raw.json?raw";
import openCodeTraceRaw from "./fixtures/opencode-gemini-3.1-pro.raw.json?raw";

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
    path: "dashboard/src/App.tsx",
    language: "tsx",
    content: `import { RunSummary } from "./components/RunSummary";
import { AgentTracePanel } from "./components/AgentTracePanel";
import "./styles/workbench.css";

export function App() {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-header">
        <div>
          <h1>SWE-bench Ultra</h1>
          <p>Inspect patches, traces, and verifier output in one workbench.</p>
        </div>
        <button className="launch-button">Launch review session</button>
      </header>

      <section className="dashboard-grid">
        <RunSummary />
        <AgentTracePanel />
      </section>
    </main>
  );
}
`,
  },
  {
    id: "index.ts",
    path: "dashboard/src/index.ts",
    language: "ts",
    content: `export { App } from "./App";
export { RunSummary } from "./components/RunSummary";
export { AgentTracePanel } from "./components/AgentTracePanel";
export { buildReviewTabs } from "./lib/reviewTabs";
`,
  },
  {
    id: "RunSummary.tsx",
    path: "dashboard/src/components/RunSummary.tsx",
    language: "tsx",
    content: `const rows = [
  { label: "pass rate", value: "58.4%", tone: "good" },
  { label: "resolved", value: "132 / 226", tone: "good" },
  { label: "trace coverage", value: "100%", tone: "neutral" },
];

export function RunSummary() {
  return (
    <section className="summary-card">
      <header>
        <h2>Latest benchmark snapshot</h2>
        <span className="summary-badge">Review candidate</span>
      </header>
      <dl>
        {rows.map((row) => (
          <div key={row.label} className="summary-row">
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
    id: "AgentTraceViewer.tsx",
    path: "dashboard/src/components/AgentTraceViewer.tsx",
    language: "tsx",
    content: `type Props = {
  turns: Turn[];
  filter?: "all" | "assistant" | "tool";
};

export function AgentTraceViewer({ turns, filter = "all" }: Props) {
  const visibleTurns = turns.filter((turn) => {
    if (filter === "assistant") return turn.type === "assistant";
    if (filter === "tool") return turn.type === "tool_result";
    return true;
  });

  return (
    <div className="trace-viewer">
      <TraceToolbar filter={filter} />
      {visibleTurns.map((turn) => (
        <TraceRow key={turn.id} turn={turn} />
      ))}
    </div>
  );
}
`,
  },
  {
    id: "FileTree.tsx",
    path: "dashboard/src/components/FileTree.tsx",
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
    id: "workbench.css",
    path: "dashboard/src/styles/workbench.css",
    language: "css",
    content: `.trace-viewer {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.trace-toolbar {
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
    path: "eval/runner/server.py",
    language: "python",
    content: `from __future__ import annotations

from dataclasses import dataclass
from pathlib import Path


@dataclass
class RunRequest:
    task_id: str
    agent_name: str


def launch_run(request: RunRequest) -> Path:
    run_dir = Path("runs") / request.task_id / request.agent_name
    run_dir.mkdir(parents=True, exist_ok=True)
    return run_dir
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
- agent trajectory viewers for multiple harnesses
- bottom panel for terminal, problems, and structured output
`,
  },
  {
    id: "package.json",
    path: "package.json",
    language: "json",
    content: `{
  "name": "swe-bench-ultra-dashboard",
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
    path: "dashboard/src/components/AgentTraceViewer.tsx",
    additions: 24,
    deletions: 7,
    status: "modified",
    language: "tsx",
    original: `type Props = {
  turns: Turn[];
};

export function AgentTraceViewer({ turns }: Props) {
  return (
    <div className="trace-viewer">
      {turns.map((turn) => (
        <TraceRow key={turn.id} turn={turn} />
      ))}
    </div>
  );
}
`,
    modified: `type Props = {
  turns: Turn[];
  filter?: "all" | "assistant" | "tool";
};

export function AgentTraceViewer({ turns, filter = "all" }: Props) {
  const visibleTurns = turns.filter((turn) => {
    if (filter === "assistant") return turn.type === "assistant";
    if (filter === "tool") return turn.type === "tool_result";
    return true;
  });

  return (
    <div className="trace-viewer">
      <TraceToolbar filter={filter} />
      {visibleTurns.map((turn) => (
        <TraceRow key={turn.id} turn={turn} />
      ))}
    </div>
  );
}
`,
  },
  {
    path: "dashboard/src/components/FileTree.tsx",
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
    path: "dashboard/src/styles/workbench.css",
    additions: 11,
    deletions: 1,
    status: "modified",
    language: "css",
    original: `.trace-viewer {
  padding: 12px;
}

.file-tree-row {
  display: flex;
  align-items: center;
  gap: 8px;
}
`,
    modified: `.trace-viewer {
  display: grid;
  gap: 12px;
  padding: 14px;
}

.trace-toolbar {
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

export const workspaceUnifiedDiff = `diff --git a/dashboard/src/components/AgentTraceViewer.tsx b/dashboard/src/components/AgentTraceViewer.tsx
index 1e14dd1..78b4aa2 100644
--- a/dashboard/src/components/AgentTraceViewer.tsx
+++ b/dashboard/src/components/AgentTraceViewer.tsx
@@ -1,13 +1,25 @@
-type Props = {
-  turns: Turn[];
-};
+type Props = {
+  turns: Turn[];
+  filter?: "all" | "assistant" | "tool";
+};

-export function AgentTraceViewer({ turns }: Props) {
+export function AgentTraceViewer({ turns, filter = "all" }: Props) {
+  const visibleTurns = turns.filter((turn) => {
+    if (filter === "assistant") return turn.type === "assistant";
+    if (filter === "tool") return turn.type === "tool_result";
+    return true;
+  });
+
   return (
     <div className="trace-viewer">
-      {turns.map((turn) => (
+      <TraceToolbar filter={filter} />
+      {visibleTurns.map((turn) => (
         <TraceRow key={turn.id} turn={turn} />
       ))}
     </div>
   );
 }
diff --git a/dashboard/src/components/FileTree.tsx b/dashboard/src/components/FileTree.tsx
index 0d3ad66..3b18c51 100644
--- a/dashboard/src/components/FileTree.tsx
+++ b/dashboard/src/components/FileTree.tsx
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
diff --git a/dashboard/src/styles/workbench.css b/dashboard/src/styles/workbench.css
index 8fe32ab..1f53ee7 100644
--- a/dashboard/src/styles/workbench.css
+++ b/dashboard/src/styles/workbench.css
@@ -1,8 +1,18 @@
 .trace-viewer {
-  padding: 12px;
+  display: grid;
+  gap: 12px;
+  padding: 14px;
+}
+
+.trace-toolbar {
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
    path: "dashboard",
    type: "folder",
    children: [
      {
        path: "dashboard/src",
        type: "folder",
        children: [
          { path: "dashboard/src/App.tsx", type: "file" },
          { path: "dashboard/src/index.ts", type: "file" },
          {
            path: "dashboard/src/components",
            type: "folder",
            children: [
              { path: "dashboard/src/components/RunSummary.tsx", type: "file" },
              { path: "dashboard/src/components/AgentTraceViewer.tsx", type: "file" },
              { path: "dashboard/src/components/FileTree.tsx", type: "file" },
            ],
          },
          {
            path: "dashboard/src/styles",
            type: "folder",
            children: [{ path: "dashboard/src/styles/workbench.css", type: "file" }],
          },
        ],
      },
    ],
  },
  {
    path: "eval",
    type: "folder",
    children: [
      {
        path: "eval/runner",
        type: "folder",
        children: [{ path: "eval/runner/server.py", type: "file" }],
      },
    ],
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
    id: "atif-gemini-cli-3.1-pro.trajectory.json",
    title: "ATIF trajectory",
    path: "rollouts/atif/atif-gemini-cli-3.1-pro.trajectory.json",
    raw: atifGeminiTraceRaw,
  },
  {
    id: "codex-cli-gpt-5.4-xhigh.raw.jsonl",
    title: "Codex CLI",
    path: "rollouts/codex/codex-cli-gpt-5.4-xhigh.raw.jsonl",
    raw: codexTraceRaw,
  },
  {
    id: "claude-code-opus-4.6-max.raw.jsonl",
    title: "Claude Code",
    path: "rollouts/claude/claude-code-opus-4.6-max.raw.jsonl",
    raw: claudeCodeTraceRaw,
  },
  {
    id: "gemini-cli-3.1-pro.raw.json",
    title: "Gemini CLI",
    path: "rollouts/gemini/gemini-cli-3.1-pro.raw.json",
    raw: geminiTraceRaw,
  },
  {
    id: "opencode-gemini-3.1-pro.raw.json",
    title: "OpenCode",
    path: "rollouts/opencode/opencode-gemini-3.1-pro.raw.json",
    raw: openCodeTraceRaw,
  },
  {
    id: "mini-swe-agent-gpt-5.4.raw.json",
    title: "mini-swe-agent",
    path: "rollouts/mini-swe-agent/mini-swe-agent-gpt-5.4.raw.json",
    raw: miniSweAgentTraceRaw,
  },
] as const;

export const traceSamples: TraceSample[] = traceFixtureSamples.map((sample) => ({
  ...sample,
  turns: parseAgentTrace(sample.raw),
}));

export const traceFileTree: CodeFileTreeItem[] = [
  {
    path: "rollouts",
    type: "folder",
    children: [
      {
        path: "rollouts/atif",
        type: "folder",
        children: [{ path: "rollouts/atif/atif-gemini-cli-3.1-pro.trajectory.json", type: "file" }],
      },
      {
        path: "rollouts/codex",
        type: "folder",
        children: [{ path: "rollouts/codex/codex-cli-gpt-5.4-xhigh.raw.jsonl", type: "file" }],
      },
      {
        path: "rollouts/claude",
        type: "folder",
        children: [{ path: "rollouts/claude/claude-code-opus-4.6-max.raw.jsonl", type: "file" }],
      },
      {
        path: "rollouts/gemini",
        type: "folder",
        children: [{ path: "rollouts/gemini/gemini-cli-3.1-pro.raw.json", type: "file" }],
      },
      {
        path: "rollouts/opencode",
        type: "folder",
        children: [{ path: "rollouts/opencode/opencode-gemini-3.1-pro.raw.json", type: "file" }],
      },
      {
        path: "rollouts/mini-swe-agent",
        type: "folder",
        children: [{ path: "rollouts/mini-swe-agent/mini-swe-agent-gpt-5.4.raw.json", type: "file" }],
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
