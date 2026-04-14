import type { ChangedFileItem, CodeFileTreeItem } from "../index";

export interface ExampleFile {
  id: string;
  path: string;
  language: string;
  content: string;
  status?: "added" | "deleted" | "modified" | "renamed";
}

export interface ExampleDiffFile extends ChangedFileItem {
  language: string;
  original: string;
  modified: string;
}

export interface TraceSample {
  id: string;
  title: string;
  raw: string;
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
        <span className="summary-badge">K1 crest-alpha</span>
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
  {
    id: "workbench.css",
    path: "dashboard/src/styles/workbench.css",
    language: "css",
    content: `.dashboard-shell {
  display: grid;
  gap: 18px;
  padding: 24px;
}

.dashboard-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
}

.dashboard-grid {
  display: grid;
  grid-template-columns: 1.25fr 1fr;
  gap: 16px;
}
`,
    status: "modified",
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
              {
                path: "dashboard/src/components/AgentTraceViewer.tsx",
                type: "file",
                status: "modified",
              },
              {
                path: "dashboard/src/components/FileTree.tsx",
                type: "file",
                status: "modified",
              },
            ],
          },
          {
            path: "dashboard/src/styles",
            type: "folder",
            children: [
              {
                path: "dashboard/src/styles/workbench.css",
                type: "file",
                status: "modified",
              },
            ],
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

export const traceSamples: TraceSample[] = [
  {
    id: "codex-trace.jsonl",
    title: "Codex CLI",
    raw: `{"type":"session_meta","timestamp":"2026-04-14T01:00:00Z","payload":{"cwd":"/workspace"}}
{"type":"response_item","timestamp":"2026-04-14T01:00:01Z","payload":{"type":"message","role":"user","content":"Investigate why the workbench diff tab is blank."}}
{"type":"response_item","timestamp":"2026-04-14T01:00:02Z","payload":{"type":"message","role":"assistant","content":"I’ll inspect the diff viewer and related styles."}}
{"type":"response_item","timestamp":"2026-04-14T01:00:03Z","payload":{"type":"reasoning","summary":"The failure likely comes from a missing height contract or empty parsed diff state."}}
{"type":"response_item","timestamp":"2026-04-14T01:00:04Z","payload":{"type":"function_call","call_id":"call_read","name":"read_file","arguments":"{\\"path\\":\\"dashboard/src/components/DiffViewer.tsx\\"}"}}
{"type":"response_item","timestamp":"2026-04-14T01:00:05Z","payload":{"type":"function_call_output","call_id":"call_read","output":"export function DiffViewer(){ return null; }"}}
{"type":"response_item","timestamp":"2026-04-14T01:00:06Z","payload":{"type":"message","role":"assistant","content":"The component never renders parsed hunks. I’m preparing a fix."}}`,
  },
  {
    id: "claude-trace.jsonl",
    title: "Claude Code",
    raw: `{"type":"user","timestamp":"2026-04-14T02:00:00Z","message":{"role":"user","content":"Open the file tree component and add git status badges."}}
{"type":"assistant","timestamp":"2026-04-14T02:00:02Z","message":{"role":"assistant","content":[{"type":"thinking","text":"Need the file icon row plus a trailing status token."},{"type":"text","text":"I’m updating the file tree rows and keeping the drag target intact."},{"type":"tool_use","id":"toolu_1","name":"edit_file","input":{"path":"dashboard/src/components/FileTree.tsx","find":"<span>{file.path}</span>","replace":"<span>{file.path}</span><StatusBadge status={file.status} />"}}]}}
{"type":"user","timestamp":"2026-04-14T02:00:04Z","message":{"role":"user","content":[{"type":"tool_result","tool_use_id":"toolu_1","content":"Applied 1 edit to dashboard/src/components/FileTree.tsx"}]}}
{"type":"assistant","timestamp":"2026-04-14T02:00:05Z","message":{"role":"assistant","content":[{"type":"text","text":"Status badges are in place and preserve the click target."}]}}`,
  },
  {
    id: "opencode-trace.json",
    title: "OpenCode",
    raw: `[
  {"type":"step_start"},
  {"type":"tool_use","part":{"tool":"read","callID":"read_1","state":{"input":{"path":"dashboard/src/App.tsx"},"output":"<main className=\\"dashboard-shell\\">..."}}},
  {"type":"text","part":{"text":"The layout already has the main shell and summary widgets."}},
  {"type":"step_start"},
  {"type":"tool_use","part":{"tool":"write","callID":"write_1","state":{"input":{"path":"dashboard/src/styles/workbench.css"},"output":"Added toolbar spacing and active row styling."}}},
  {"type":"text","part":{"text":"The workspace styling now matches the richer review story."}}
]`,
  },
  {
    id: "gemini-trace.json",
    title: "Gemini CLI",
    raw: `{
  "sessionId": "gemini-session",
  "messages": [
    {
      "timestamp": "2026-04-14T03:00:00Z",
      "type": "user",
      "content": "Compare the original and modified workbench.css files."
    },
    {
      "timestamp": "2026-04-14T03:00:02Z",
      "type": "gemini",
      "thoughts": [
        { "subject": "Plan", "description": "Load both versions and summarize the visual contract changes." }
      ],
      "toolCalls": [
        {
          "id": "diff_1",
          "name": "read_diff_pair",
          "args": { "path": "dashboard/src/styles/workbench.css" },
          "resultDisplay": "Loaded 2 file versions and 1 unified diff."
        }
      ],
      "content": "The update adds a toolbar and stronger row affordances without changing the grid structure."
    }
  ]
}`,
  },
  {
    id: "mini-swe-agent-openai.json",
    title: "mini-swe-agent (OpenAI style)",
    raw: `{
  "trajectory_format": "mini-swe-agent/openai",
  "messages": [
    { "role": "system", "content": "You are a coding agent inside the eval harness." },
    { "role": "user", "content": "Patch the trace viewer so tool outputs are collapsible." },
    {
      "role": "assistant",
      "output": [
        { "type": "reasoning", "summary": [{ "text": "Need to preserve the existing grouping but add local disclosure state." }] },
        { "type": "function_call", "name": "read_file", "call_id": "mini_read_1", "arguments": "{\\"path\\":\\"dashboard/src/components/AgentTraceViewer.tsx\\"}" },
        { "type": "message", "role": "assistant", "content": [{ "type": "output_text", "text": "I found the tool rows and will wrap them in a disclosure panel." }] }
      ]
    },
    { "type": "function_call_output", "call_id": "mini_read_1", "output": "CompactToolCall currently renders input/output inline." },
    { "type": "exit", "content": "Submitted patch.", "extra": { "exit_status": "submitted", "submission": "diff attached" } }
  ]
}`,
  },
  {
    id: "mini-swe-agent-anthropic.json",
    title: "mini-swe-agent (Anthropic style)",
    raw: `{
  "trajectory_format": "mini-swe-agent/anthropic",
  "messages": [
    { "role": "system", "content": "You are a coding agent inside the eval harness." },
    { "role": "user", "content": "Make the file tree rows draggable into the editor groups." },
    {
      "role": "assistant",
      "reasoning_content": "Use the existing drag store plus the library drag MIME type.",
      "content": "I’m wiring drag metadata into the explorer rows.",
      "tool_calls": [
        {
          "id": "anthropic_edit_1",
          "function": {
            "name": "edit_file",
            "arguments": "{\\"path\\":\\"src/components/CodeFileTree.tsx\\",\\"summary\\":\\"add drag handling\\"}"
          }
        }
      ]
    },
    {
      "role": "tool",
      "tool_call_id": "anthropic_edit_1",
      "content": "Updated CodeFileTree.tsx with dragstart behavior."
    },
    {
      "role": "exit",
      "content": "Patch ready for validation.",
      "extra": {
        "exit_status": "submitted",
        "submission": "CodeFileTree drag support"
      }
    }
  ]
}`,
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
