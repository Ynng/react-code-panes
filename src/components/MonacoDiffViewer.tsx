import { DiffEditor, type DiffEditorProps } from "@monaco-editor/react";

interface MonacoDiffViewerProps {
  original: string;
  modified: string;
  language: string;
  height?: string | number;
  options?: DiffEditorProps["options"];
}

export function MonacoDiffViewer({
  original,
  modified,
  language,
  height = "100%",
  options,
}: MonacoDiffViewerProps) {
  return (
    <DiffEditor
      height={height}
      language={language}
      original={original}
      modified={modified}
      theme="vs-dark"
      onMount={(editor) => {
        if (typeof (editor as { revealFirstDiff?: () => void }).revealFirstDiff === "function") {
          (editor as { revealFirstDiff: () => void }).revealFirstDiff();
        }
      }}
      options={{
        readOnly: true,
        renderSideBySide: true,
        minimap: { enabled: false },
        scrollBeyondLastLine: true,
        fontSize: 13,
        hideUnchangedRegions: {
          enabled: true,
          contextLineCount: 3,
          minimumLineCount: 5,
          revealLineCount: 20,
        },
        ...options,
      }}
    />
  );
}
