import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
  type ReactNode,
  type CSSProperties,
} from "react";
import type { Highlighter } from "shiki";
import type {
  AgentTraceToolCall,
  AgentTraceToolResult,
  AgentTraceTurn,
} from "../types/agentTrace";

interface AgentTraceViewerProps {
  turns: AgentTraceTurn[];
  batch?: string;
  label?: string;
}

interface Step {
  index: number;
  assistant: AgentTraceTurn;
  toolResults: AgentTraceTurn[];
}

const TOOL_ICON_STYLE: CSSProperties = {
  display: "inline-flex",
  width: 12,
  height: 12,
  verticalAlign: "middle",
};

const INLINE_CODE_STYLE: CSSProperties = {
  fontSize: "0.846em",
  padding: "1px 3px",
  background: "rgba(110,118,129,0.25)",
  fontFamily: "var(--mosaic-font-family-mono)",
};

const HIGHLIGHT_PRE_STYLE: CSSProperties = {
  padding: "8px 12px",
  maxHeight: 300,
  overflow: "auto",
  lineHeight: "1.5em",
  whiteSpace: "pre-wrap",
  wordBreak: "break-word",
  fontSize: 11,
  color: "#cccccc",
  fontFamily: "var(--mosaic-font-family-mono)",
  margin: 0,
  background: "transparent",
};

const SHIKI_CSS = `
.shiki-container pre {
  margin: 0 !important;
  padding: 0 !important;
  background: transparent !important;
  white-space: pre-wrap !important;
  word-break: break-word !important;
}
.shiki-container pre code {
  background: transparent !important;
  font-family: inherit !important;
}
.shiki-container .shiki {
  background-color: transparent !important;
}
`;

const HighlighterContext = createContext<Highlighter | null>(null);

let shikiCssInjected = false;

function ensureShikiCss() {
  if (shikiCssInjected || typeof document === "undefined") return;
  shikiCssInjected = true;
  const style = document.createElement("style");
  style.textContent = SHIKI_CSS;
  document.head.appendChild(style);
}

function groupIntoSteps(turns: AgentTraceTurn[]) {
  const preamble: AgentTraceTurn[] = [];
  const steps: Step[] = [];
  let stepIndex = 0;
  let index = 0;

  while (index < turns.length && turns[index].type !== "assistant") {
    preamble.push(turns[index]);
    index += 1;
  }

  while (index < turns.length) {
    const turn = turns[index];
    if (turn.type === "assistant") {
      const step: Step = { index: stepIndex++, assistant: turn, toolResults: [] };
      index += 1;
      while (index < turns.length && turns[index].type === "tool_result") {
        step.toolResults.push(turns[index]);
        index += 1;
      }
      steps.push(step);
    } else {
      steps.push({ index: stepIndex++, assistant: turn, toolResults: [] });
      index += 1;
    }
  }

  return { steps, preamble };
}

function ChevronIcon({ open }: { open: boolean }) {
  return (
    <svg
      width="10"
      height="10"
      viewBox="0 0 16 16"
      fill="currentColor"
      style={{ transition: "transform 100ms", transform: open ? "rotate(90deg)" : "rotate(0deg)" }}
    >
      <path d="M6 4l4 4-4 4" />
    </svg>
  );
}

function getToolCategory(name: string): "read" | "write" | "execute" | "search" | "list" | "other" {
  const lower = name.toLowerCase();
  if (lower.includes("read") || lower.includes("cat") || lower.includes("view")) return "read";
  if (lower.includes("write") || lower.includes("edit") || lower.includes("create") || lower.includes("replace") || lower.includes("insert") || lower.includes("patch")) return "write";
  if (lower.includes("bash") || lower.includes("exec") || lower.includes("run") || lower.includes("shell") || lower.includes("terminal") || lower.includes("command")) return "execute";
  if (lower.includes("search") || lower.includes("grep") || lower.includes("find")) return "search";
  if (lower.includes("glob") || lower.includes("list")) return "list";
  return "other";
}

function ToolIcon({ category }: { category: string }) {
  const size = 12;

  switch (category) {
    case "read":
      return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={TOOL_ICON_STYLE}><path d="M2.5 2C1.67157 2 1 2.67157 1 3.5V12.5C1 13.3284 1.67157 14 2.5 14H6C6.8178 14 7.54389 13.6073 8 13.0002C8.45612 13.6073 9.1822 14 10 14H13.5C14.3284 14 15 13.3284 15 12.5V3.5C15 2.67157 14.3284 2 13.5 2H10C9.1822 2 8.45612 2.39267 8 2.99976C7.54389 2.39267 6.8178 2 6 2H2.5ZM7.5 4.5V11.5C7.5 12.3284 6.82843 13 6 13H2.5C2.22386 13 2 12.7761 2 12.5V3.5C2 3.22386 2.22386 3 2.5 3H6C6.82843 3 7.5 3.67157 7.5 4.5ZM8.5 11.5V4.5C8.5 3.67157 9.17157 3 10 3H13.5C13.7761 3 14 3.22386 14 3.5V12.5C14 12.7761 13.7761 13 13.5 13H10C9.17157 13 8.5 12.3284 8.5 11.5Z" /></svg>;
    case "write":
      return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={TOOL_ICON_STYLE}><path d="M14.236 1.76386C13.2123 0.740172 11.5525 0.740171 10.5289 1.76386L2.65722 9.63549C2.28304 10.0097 2.01623 10.4775 1.88467 10.99L1.01571 14.3755C0.971767 14.5467 1.02148 14.7284 1.14646 14.8534C1.27144 14.9783 1.45312 15.028 1.62432 14.9841L5.00978 14.1151C5.52234 13.9836 5.99015 13.7168 6.36433 13.3426L14.236 5.47097C15.2596 4.44728 15.2596 2.78755 14.236 1.76386Z" /></svg>;
    case "execute":
      return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={TOOL_ICON_STYLE}><path d="M1 3.5L1 12.5C1 13.3284 1.67157 14 2.5 14H13.5C14.3284 14 15 13.3284 15 12.5V3.5C15 2.67157 14.3284 2 13.5 2H2.5C1.67157 2 1 2.67157 1 3.5ZM4.146 5.146a.5.5 0 0 1 .708 0l2.5 2.5a.5.5 0 0 1 0 .708l-2.5 2.5a.5.5 0 0 1-.708-.708L6.293 8 4.146 5.854a.5.5 0 0 1 0-.708ZM8 10.5a.5.5 0 0 1 .5-.5h3a.5.5 0 0 1 0 1h-3a.5.5 0 0 1-.5-.5Z" /></svg>;
    case "search":
    case "list":
      return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={TOOL_ICON_STYLE}><path d="M10.0195 10.7266C9.06578 11.5217 7.83875 12 6.5 12C3.46243 12 1 9.53757 1 6.5C1 3.46243 3.46243 1 6.5 1C9.53757 1 12 3.46243 12 6.5C12 7.83875 11.5217 9.06578 10.7266 10.0195L13.8535 13.1464C14.0488 13.3417 14.0488 13.6583 13.8535 13.8536C13.6583 14.0488 13.3417 14.0488 13.1464 13.8536L10.0195 10.7266Z" /></svg>;
    default:
      return <svg width={size} height={size} viewBox="0 0 16 16" fill="currentColor" style={TOOL_ICON_STYLE}><path d="M5.66901 0.999997C5.52101 0.945997 5.34701 0.968997 5.21401 1.062C5.08101 1.155 5.00201 1.308 5.00201 1.47V3.286C5.00201 3.561 4.77701 3.786 4.50201 3.786C4.22701 3.786 4.00201 3.561 4.00201 3.286V1.47C4.00201 1.308 3.92301 1.156 3.79001 1.062C3.65801 0.967997 3.48501 0.945997 3.33501 0.999997C1.93901 1.495 1.00201 2.816 1.00201 4.287C1.00201 5.646 1.79201 6.876 3.00201 7.449V13.5C3.00201 14.327 3.67501 15 4.50201 15C5.32901 15 6.00201 14.327 6.00201 13.5V7.449C7.21201 6.876 8.00201 5.646 8.00201 4.287C8.00201 2.816 7.06401 1.495 5.66901 0.999997Z" /></svg>;
  }
}

function getToolLabelParts(toolCall: AgentTraceToolCall) {
  const name = toolCall.name.toLowerCase();
  try {
    const parsed = JSON.parse(toolCall.input);
    if (name.includes("bash") || name.includes("exec") || name.includes("run") || name.includes("command")) {
      const command = (parsed.command || parsed.cmd || "").split("\n")[0].slice(0, 80);
      return { prefix: "Ran", code: command || undefined };
    }
    if (name.includes("read")) return { prefix: "Read", code: parsed.file_path || parsed.path || "file" };
    if (name.includes("write")) return { prefix: "Wrote", code: parsed.file_path || parsed.path || "file" };
    if (name.includes("edit") || name.includes("replace") || name.includes("patch")) return { prefix: "Edited", code: parsed.file_path || parsed.path || "file" };
    if (name.includes("grep")) return { prefix: "Searched for", code: parsed.pattern || "pattern" };
    if (name.includes("glob") || name.includes("find")) return { prefix: "Searched for files matching", code: parsed.pattern || parsed.path || "pattern" };
    if (name.includes("search")) return { prefix: "Searched", code: parsed.query || parsed.pattern || undefined };
    if (name.includes("list")) return { prefix: "Listed", code: parsed.path || parsed.directory || undefined };
    if (parsed.file_path) return { prefix: toolCall.name, code: parsed.file_path };
    if (parsed.command) return { prefix: toolCall.name, code: String(parsed.command).slice(0, 60) };
    if (parsed.path) return { prefix: toolCall.name, code: parsed.path };
    if (parsed.pattern) return { prefix: toolCall.name, code: parsed.pattern };
  } catch {
    return { prefix: toolCall.name };
  }

  return { prefix: toolCall.name };
}

function ShikiBlock({ html }: { html: string }) {
  return (
    <div
      className="shiki-container"
      style={{ padding: "8px 12px", maxHeight: 300, overflow: "auto", fontSize: 11, lineHeight: "1.5em", fontFamily: "var(--mosaic-font-family-mono)" }}
      dangerouslySetInnerHTML={{ __html: html }}
    />
  );
}

function HighlightedInput({ content }: { content: string }) {
  const highlighter = useContext(HighlighterContext);
  const [html, setHtml] = useState<string | null>(null);

  useEffect(() => {
    if (!highlighter) return;
    ensureShikiCss();
    try {
      const formatted = JSON.stringify(JSON.parse(content), null, 2);
      setHtml(highlighter.codeToHtml(formatted, { lang: "json", theme: "github-dark" }));
    } catch {
      setHtml(null);
    }
  }, [content, highlighter]);

  if (html) return <ShikiBlock html={html} />;
  return <pre style={HIGHLIGHT_PRE_STYLE}>{content}</pre>;
}

function HighlightedOutput({ content, toolName }: { content: string; toolName: string }) {
  const highlighter = useContext(HighlighterContext);
  const [html, setHtml] = useState<string | null>(null);
  const category = getToolCategory(toolName);

  useEffect(() => {
    if (!highlighter) return;
    ensureShikiCss();
    try {
      if (category === "execute") {
        setHtml(highlighter.codeToHtml(content, { lang: "ansi", theme: "github-dark" }));
        return;
      }
      const formatted = JSON.stringify(JSON.parse(content), null, 2);
      setHtml(highlighter.codeToHtml(formatted, { lang: "json", theme: "github-dark" }));
    } catch {
      setHtml(null);
    }
  }, [category, content, highlighter]);

  if (html) return <ShikiBlock html={html} />;
  return <pre style={HIGHLIGHT_PRE_STYLE}>{content}</pre>;
}

function renderInlineMarkdown(text: string, keyPrefix: string): ReactNode[] {
  return text.split(/(\*\*[^*]+\*\*|`[^`]+`)/g).map((token, index) => {
    if (token.startsWith("**") && token.endsWith("**")) {
      return <strong key={`${keyPrefix}-${index}`} style={{ fontWeight: 600 }}>{token.slice(2, -2)}</strong>;
    }
    if (token.startsWith("`") && token.endsWith("`")) {
      return <code key={`${keyPrefix}-${index}`} style={{ ...INLINE_CODE_STYLE, color: "#ce9178" }}>{token.slice(1, -1)}</code>;
    }
    return token;
  });
}

function renderFormattedText(text: string) {
  const parts = text.split(/(```[\s\S]*?```)/g);
  const elements: ReactNode[] = [];

  parts.forEach((part, partIndex) => {
    if (part.startsWith("```") && part.endsWith("```")) {
      const inner = part.slice(3, -3);
      const newlineIndex = inner.indexOf("\n");
      const language = newlineIndex > 0 ? inner.slice(0, newlineIndex).trim() : "";
      const code = newlineIndex > 0 ? inner.slice(newlineIndex + 1) : inner;
      elements.push(
        <div key={`code-${partIndex}`} style={{ margin: "16px 0", border: "1px solid #3c3c3c", background: "#1a1a1a", overflow: "hidden" }}>
          {language && <div style={{ padding: "4px 12px", fontSize: 11, color: "#6e6e6e", background: "#252526", borderBottom: "1px solid #3c3c3c", fontFamily: "var(--mosaic-font-family-mono)" }}>{language}</div>}
          <pre style={{ padding: "8px 12px", fontSize: 12, fontFamily: "var(--mosaic-font-family-mono)", color: "#d4d4d4", overflowX: "auto", lineHeight: 1.5, margin: 0 }}>{code}</pre>
        </div>,
      );
      return;
    }

    if (!part.trim()) return;
    const lines = part.split("\n");
    let buffer: string[] = [];

    const flushParagraph = () => {
      if (buffer.length === 0) return;
      const joined = buffer.join("\n").trim();
      buffer = [];
      if (!joined) return;
      elements.push(<p key={`p-${partIndex}-${elements.length}`} style={{ margin: 0 }}>{renderInlineMarkdown(joined, `p-${partIndex}-${elements.length}`)}</p>);
    };

    for (let lineIndex = 0; lineIndex < lines.length; lineIndex += 1) {
      const line = lines[lineIndex];
      const headerMatch = line.match(/^(#{1,3})\s+(.*)/);
      if (headerMatch) {
        flushParagraph();
        const level = headerMatch[1].length;
        const fontSizes: Record<number, string> = { 1: "1.538em", 2: "1.231em", 3: "1.077em" };
        elements.push(
          <div key={`h-${partIndex}-${lineIndex}`} style={{ fontSize: fontSizes[level] || "1.077em", fontWeight: 600, margin: "1.5em 0 0.875em 0", lineHeight: "1.3em" }}>
            {renderInlineMarkdown(headerMatch[2], `h-${partIndex}-${lineIndex}`)}
          </div>,
        );
        continue;
      }

      const listMatch = line.match(/^(\s*)[*-]\s+(.*)/);
      if (listMatch) {
        flushParagraph();
        const items: { indent: number; content: string }[] = [];
        let nextIndex = lineIndex;
        while (nextIndex < lines.length) {
          const match = lines[nextIndex].match(/^(\s*)[*-]\s+(.*)/);
          if (!match) break;
          items.push({ indent: match[1].length, content: match[2] });
          nextIndex += 1;
        }
        lineIndex = nextIndex - 1;
        elements.push(
          <ul key={`ul-${partIndex}-${lineIndex}`} style={{ margin: "0 0 16px 0", paddingLeft: 24, listStyleType: "disc" }}>
            {items.map((item, itemIndex) => (
              <li key={itemIndex} style={{ marginLeft: item.indent > 0 ? item.indent * 8 : 0, lineHeight: "1.5em", marginBottom: 2 }}>
                {renderInlineMarkdown(item.content, `li-${partIndex}-${lineIndex}-${itemIndex}`)}
              </li>
            ))}
          </ul>,
        );
        continue;
      }

      if (!line.trim()) {
        flushParagraph();
        continue;
      }

      buffer.push(line);
    }

    flushParagraph();
  });

  return elements;
}

function CompactToolCall({
  toolCall,
  result,
  isFirst,
  isLast,
  isOnly,
}: {
  toolCall: AgentTraceToolCall;
  result?: AgentTraceToolResult;
  isFirst: boolean;
  isLast: boolean;
  isOnly: boolean;
}) {
  const [open, setOpen] = useState(false);
  const category = getToolCategory(toolCall.name);
  const labelParts = getToolLabelParts(toolCall);
  const resultText = result ? result.content : "";
  const isError = !!result && (result.isError || resultText.toLowerCase().includes("error") || resultText.toLowerCase().includes("traceback"));
  const resultLines = resultText ? resultText.split("\n").length : 0;

  return (
    <div style={{ position: "relative", padding: "4px 12px 4px 24px" }}>
      <div
        style={{
          position: "absolute",
          left: 10.5,
          top: 0,
          bottom: 0,
          width: 1,
          background: "#454545",
          ...(isOnly ? { display: "none" } : {}),
          ...(isFirst && !isLast ? { maskImage: "linear-gradient(to bottom, transparent 0 25px, #000 25px 100%)" } : {}),
          ...(isLast && !isFirst ? { maskImage: "linear-gradient(to bottom, #000 0 5px, transparent 5px 100%)" } : {}),
        }}
      />
      <div
        onClick={() => setOpen(!open)}
        style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 12, color: open ? "#cccccc" : "#858585", marginBottom: open ? 6 : 2, cursor: "pointer", userSelect: "none" }}
      >
        <span
          style={{
            display: "inline-flex",
            alignItems: "center",
            justifyContent: "center",
            width: 14,
            height: 14,
            flexShrink: 0,
            marginLeft: -20,
            color: "#858585",
            pointerEvents: "none",
            position: "relative",
            zIndex: 1,
          }}
        >
          <ToolIcon category={category} />
        </span>
        <span style={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap", minWidth: 0 }}>
          {labelParts.prefix}
          {labelParts.code && <> <code style={INLINE_CODE_STYLE}>{labelParts.code}</code></>}
        </span>
        {isError && <span style={{ fontSize: 10, flexShrink: 0, fontFamily: "var(--mosaic-font-family-mono)", color: "#f14c4c" }}>ERR</span>}
        <span className="tool-chevron" style={{ display: "inline-flex", width: 12, height: 12, alignItems: "center", justifyContent: "center", flexShrink: 0, opacity: open ? 0.6 : 0, transition: "opacity 100ms" }}>
          <ChevronIcon open={open} />
        </span>
      </div>

      {open && (
        <div style={{ paddingBottom: 4 }}>
          <div style={{ border: "1px solid #454545", background: "#1e1e1e", margin: "4px 0", overflow: "hidden" }}>
            <div style={{ padding: "8px 12px", background: "#252526", borderBottom: "1px solid #454545", fontSize: 12, color: "#858585" }}>Input</div>
            <HighlightedInput content={toolCall.input} />
          </div>
          {result && (
            <div style={{ border: "1px solid #454545", background: "#1e1e1e", margin: "4px 0", overflow: "hidden" }}>
              <div style={{ padding: "8px 12px", background: "#252526", borderBottom: "1px solid #454545", fontSize: 12, color: "#858585", display: "flex", alignItems: "center", gap: 6 }}>
                <span>Output ({resultLines} lines)</span>
                {isError && <span style={{ fontSize: 10, fontFamily: "var(--mosaic-font-family-mono)", color: "#f14c4c" }}>ERR</span>}
              </div>
              <HighlightedOutput content={resultText} toolName={toolCall.name} />
            </div>
          )}
        </div>
      )}
    </div>
  );
}

function PreambleTurn({ turn }: { turn: AgentTraceTurn }) {
  const [open, setOpen] = useState(turn.type === "system");
  const text = turn.text ?? "";

  if (turn.type === "system") {
    return (
      <div style={{ padding: "12px 16px" }}>
        <button onClick={() => setOpen(!open)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: "#6e6e6e", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
          <ChevronIcon open={open} />
          <span>System prompt</span>
          <span style={{ fontWeight: "normal", marginLeft: 4 }}>({text.length.toLocaleString()} chars)</span>
        </button>
        {open && (
          <pre style={{ marginTop: 8, whiteSpace: "pre-wrap", wordBreak: "break-word", fontSize: 12, color: "#d4d4d4", maxHeight: 400, overflow: "auto", fontFamily: "var(--mosaic-font-family-mono)", lineHeight: 1.6, marginLeft: 14, padding: 12, background: "#1a1a1a", border: "1px solid #3c3c3c" }}>
            {text}
          </pre>
        )}
      </div>
    );
  }

  return (
    <div style={{ padding: "5px 16px", display: "flex", flexDirection: "column", alignItems: "flex-end" }}>
      <div style={{ fontSize: 13, color: "#d4d4d4", whiteSpace: "pre-wrap", lineHeight: "1.5em", background: "rgba(38,79,120,0.3)", padding: "8px 12px", maxWidth: "90%", width: "fit-content", marginLeft: "auto" }}>
        {text}
      </div>
    </div>
  );
}

function StepView({ step }: { step: Step }) {
  const [reasoningOpen, setReasoningOpen] = useState(true);
  const turn = step.assistant;
  const isAssistant = turn.type === "assistant";

  const pairedTools = useMemo(() => {
    if (!turn.toolCalls) return [];
    const resultMap = new Map<string, AgentTraceToolResult>();
    for (const toolResultTurn of step.toolResults) {
      toolResultTurn.toolResults?.forEach((result) => resultMap.set(result.toolUseId, result));
    }
    return turn.toolCalls.map((toolCall) => ({ call: toolCall, result: resultMap.get(toolCall.id) }));
  }, [step.toolResults, turn.toolCalls]);

  if (turn.type === "exit") {
    return (
      <div id={`step-${step.index}`} style={{ padding: "8px 16px", margin: "8px 0" }}>
        <div style={{ fontSize: 12, color: "#d4d4d4", whiteSpace: "pre-wrap", wordBreak: "break-word", lineHeight: "1.5em", background: "rgba(200,45,72,0.12)", border: "1px solid rgba(200,45,72,0.3)", padding: "10px 12px", fontFamily: "var(--mosaic-font-family-mono)" }}>
          <div style={{ fontSize: 11, color: "#c74e39", fontWeight: 600, marginBottom: 6, fontFamily: "inherit" }}>Session Exit</div>
          {renderFormattedText(turn.text ?? "")}
        </div>
      </div>
    );
  }

  if (!isAssistant) {
    return (
      <div id={`step-${step.index}`} style={{ padding: "5px 16px", display: "flex", flexDirection: "column", alignItems: "flex-end", borderBottom: "1px solid rgba(60,60,60,0.3)" }}>
        <div style={{ fontSize: 13, color: "#d4d4d4", whiteSpace: "pre-wrap", lineHeight: "1.5em", background: "rgba(38,79,120,0.3)", padding: "8px 12px", maxWidth: "90%", width: "fit-content", marginLeft: "auto" }}>
          {turn.text}
        </div>
      </div>
    );
  }

  return (
    <div id={`step-${step.index}`} style={{ padding: "0 16px", marginTop: step.index > 0 && (turn.text || turn.reasoning) ? 16 : 0 }}>
      {turn.text && (
        <div style={{ fontSize: 13, color: "#d4d4d4", lineHeight: "1.5em", width: "100%", display: "flex", flexDirection: "column", gap: 6 }}>
          {renderFormattedText(turn.text)}
        </div>
      )}

      {turn.reasoning && (
        <div style={{ marginBottom: 4 }}>
          <button onClick={() => setReasoningOpen(!reasoningOpen)} style={{ display: "flex", alignItems: "center", gap: 4, fontSize: 11, color: reasoningOpen ? "#c586c0" : "rgba(197,134,192,0.5)", background: "none", border: "none", cursor: "pointer", padding: 0, fontFamily: "inherit" }}>
            <ChevronIcon open={reasoningOpen} />
            <span>Thinking ({turn.reasoning.length.toLocaleString()} chars)</span>
          </button>
          {reasoningOpen && (
            <div style={{ marginTop: 4, fontSize: 13, color: "#b0b0b0", lineHeight: "1.5em", marginLeft: 14, borderLeft: "1px solid #454545", paddingLeft: 12, display: "flex", flexDirection: "column", gap: 6 }}>
              {renderFormattedText(turn.reasoning)}
            </div>
          )}
        </div>
      )}

      {pairedTools.length > 0 && (
        <div style={{ marginBottom: 4 }}>
          {pairedTools.map((pairedTool, index) => (
            <CompactToolCall
              key={`${step.index}-tool-${index}`}
              toolCall={pairedTool.call}
              result={pairedTool.result}
              isFirst={index === 0}
              isLast={index === pairedTools.length - 1}
              isOnly={pairedTools.length === 1}
            />
          ))}
        </div>
      )}
    </div>
  );
}

function parseAgentLabel(batch: string): string {
  const isJ3 = batch.startsWith("J3_");
  const withoutPrefix = batch.replace(/^[A-Za-z]+\d*_/, "");
  if (isJ3) {
    const patterns: [RegExp, string][] = [
      [/^mini_swe_agent_opus_4_6_spec_strict/, "Mini SWE J3 Spec-Strict (Opus 4.6)"],
      [/^mini_swe_agent_sonnet_4_6_spec_strict/, "Mini SWE J3 Spec-Strict (Sonnet 4.6)"],
      [/^mini_swe_agent_gpt_5_4_spec_strict/, "Mini SWE J3 Spec-Strict (GPT-5.4)"],
      [/^mini_swe_agent_gpt_5_3_codex_spec_strict/, "Mini SWE J3 Spec-Strict (GPT-5.3-codex)"],
    ];
    for (const [pattern, template] of patterns) {
      if (pattern.test(withoutPrefix)) return template;
    }
  }

  const patterns: [RegExp, string][] = [
    [/^claude_code_opus_4_6/, "Claude Code (Opus 4.6)"],
    [/^claude_code_sonnet_4_6/, "Claude Code (Sonnet 4.6)"],
    [/^codex_cli_gpt_5_4/, "Codex CLI (GPT-5.4)"],
    [/^codex_cli_gpt_5_3_codex/, "Codex CLI (GPT-5.3-codex)"],
    [/^gemini_cli_gemini_3_1_pro/, "Gemini CLI (Pro)"],
    [/^gemini_cli_gemini_3_flash/, "Gemini CLI (Flash)"],
    [/^opencode_gemini_3_1_pro/, "OpenCode (Gemini Pro)"],
    [/^mini_swe_agent_opus_4_6/, "Mini SWE (Opus 4.6)"],
    [/^mini_swe_agent_sonnet_4_6/, "Mini SWE (Sonnet 4.6)"],
    [/^mini_swe_agent_gpt_5_4/, "Mini SWE (GPT-5.4)"],
  ];

  for (const [pattern, template] of patterns) {
    const match = withoutPrefix.match(pattern);
    if (match) return template.replace("$1", (match[1] ?? "").replace(/_/g, " "));
  }

  return withoutPrefix.replace(/_/g, " ");
}

export function AgentTraceViewer({ turns, batch, label }: AgentTraceViewerProps) {
  const scrollRef = useRef<HTMLDivElement>(null);
  const [highlighter, setHighlighter] = useState<Highlighter | null>(null);

  useEffect(() => {
    let cancelled = false;
    import("shiki")
      .then(({ createHighlighter }) => createHighlighter({ themes: ["github-dark"], langs: ["json", "ansi"] }))
      .then((instance) => {
        if (!cancelled) setHighlighter(instance);
      })
      .catch(() => {
        // degrade gracefully without syntax highlighting
      });

    return () => {
      cancelled = true;
    };
  }, []);

  const { steps, preamble } = useMemo(() => groupIntoSteps(turns), [turns]);

  const scrollToStep = useCallback((index: number) => {
    const element = document.getElementById(`step-${index}`);
    if (element) element.scrollIntoView({ behavior: "smooth", block: "start" });
  }, []);

  if (!turns.length) {
    return (
      <div style={{ display: "flex", alignItems: "center", justifyContent: "center", height: "100%", fontSize: 13, color: "#858585" }}>
        No trajectory data available
      </div>
    );
  }

  const totalToolCalls = turns.reduce((count, turn) => count + (turn.toolCalls?.length ?? 0), 0);
  const heading = label || (batch ? parseAgentLabel(batch) : undefined);

  return (
    <HighlighterContext.Provider value={highlighter}>
      <div style={{ display: "flex", flexDirection: "column", height: "100%", fontFamily: "var(--mosaic-font-family)" }}>
        <div
          style={{
            flexShrink: 0,
            display: "flex",
            alignItems: "center",
            gap: 8,
            padding: "0 16px",
            height: 28,
            background: "#252526",
            borderBottom: "1px solid #3c3c3c",
            fontSize: 11,
            color: "#8b949e",
            userSelect: "none",
          }}
        >
          {heading && (
            <span style={{ color: "#c9d1d9", fontWeight: 500 }}>
              {heading}
            </span>
          )}
          <span>{steps.length} steps</span>
          <span style={{ color: "#555" }}>·</span>
          <span>{totalToolCalls} tool calls</span>
          {steps.length > 10 && (
            <div style={{ marginLeft: "auto", display: "flex", gap: 2 }}>
              <button onClick={() => scrollToStep(0)} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", padding: "0 5px", fontFamily: "inherit", fontSize: "inherit" }}>Top</button>
              <button onClick={() => scrollToStep(steps.length - 1)} style={{ background: "none", border: "none", color: "#8b949e", cursor: "pointer", padding: "0 5px", fontFamily: "inherit", fontSize: "inherit" }}>End</button>
            </div>
          )}
        </div>
        <div style={{ flex: 1, overflow: "auto" }} ref={scrollRef}>
          <div style={{ maxWidth: 950, margin: "0 auto", paddingBottom: "60vh" }}>
            {preamble.map((turn) => <PreambleTurn key={turn.id} turn={turn} />)}
            {preamble.length > 0 && steps.length > 0 && <div style={{ height: 8 }} />}
            {steps.map((step) => <StepView key={step.index} step={step} />)}
          </div>
        </div>
      </div>
    </HighlighterContext.Provider>
  );
}
