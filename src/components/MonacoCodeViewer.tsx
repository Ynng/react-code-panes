import Editor, { type EditorProps } from "@monaco-editor/react";
import { resolveMonacoLanguage } from "../utils/monacoLanguage";

interface MonacoCodeViewerProps {
  value: string;
  language: string;
  path?: string;
  height?: string | number;
  options?: EditorProps["options"];
}

export function MonacoCodeViewer({
  value,
  language,
  path,
  height = "100%",
  options,
}: MonacoCodeViewerProps) {
  const monacoLanguage = resolveMonacoLanguage(language, path);

  return (
    <div style={{ width: "100%", height: "100%" }}>
      <Editor
        height={height}
        path={path}
        language={monacoLanguage}
        value={value}
        theme="vs-dark"
        options={{
          readOnly: true,
          minimap: { enabled: false },
          scrollBeyondLastLine: true,
          wordWrap: "on",
          fontSize: 13,
          lineNumbers: "on",
          folding: true,
          renderLineHighlight: "line",
          ...options,
        }}
      />
    </div>
  );
}
