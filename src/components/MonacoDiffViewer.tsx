import { DiffEditor, type DiffEditorProps } from "@monaco-editor/react";
import { resolveMonacoLanguage, withMonacoModelSuffix } from "../utils/monacoLanguage";

interface MonacoDiffViewerProps {
  original: string;
  modified: string;
  language: string;
  path?: string;
  height?: string | number;
  options?: DiffEditorProps["options"];
}

export function MonacoDiffViewer({
  original,
  modified,
  language,
  path,
  height = "100%",
  options,
}: MonacoDiffViewerProps) {
  const monacoLanguage = resolveMonacoLanguage(language, path);

  return (
    <DiffEditor
      height={height}
      language={monacoLanguage}
      original={original}
      modified={modified}
      originalModelPath={path ? withMonacoModelSuffix(path, "original") : undefined}
      modifiedModelPath={path ? withMonacoModelSuffix(path, "modified") : undefined}
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
