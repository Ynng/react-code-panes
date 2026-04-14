import type {
  AgentTraceToolCall,
  AgentTraceToolResult,
  AgentTraceTurn,
  AgentTraceTurnType,
} from "../types/agentTrace";

type ContentBlock = {
  type: string;
  text?: string;
  name?: string;
  id?: string;
  input?: Record<string, unknown>;
  tool_use_id?: string;
  content?: string | ContentBlock[];
};

type RawEvent = {
  type: string;
  message?: {
    role?: string;
    content?: string | ContentBlock[];
  };
  payload?: Record<string, unknown>;
  timestamp?: string;
};

type OpenCodeEvent = {
  type: string;
  part?: {
    text?: string;
    tool?: string;
    callID?: string;
    state?: {
      input?: Record<string, unknown>;
      output?: string;
      metadata?: { output?: string };
    };
  };
};

type GeminiCliData = {
  sessionId?: string;
  messages?: GeminiCliMessage[];
};

type GeminiCliMessage = {
  timestamp?: string;
  type?: string;
  content?: string | { text?: string }[];
  thoughts?: { subject?: string; description?: string }[];
  toolCalls?: GeminiCliToolCall[];
};

type GeminiCliToolCall = {
  id?: string;
  name?: string;
  args?: Record<string, unknown>;
  result?: {
    functionResponse?: {
      response?: { output?: string };
    };
  }[];
  resultDisplay?: string;
  status?: string;
};

type CondensedStep = {
  timestamp?: string;
  source: string;
  message: string | Record<string, unknown>;
  tool_calls?: {
    tool_call_id?: string;
    function_name?: string;
    arguments?: Record<string, unknown>;
  }[];
  observation?: {
    results?: {
      source_call_id?: string;
      content?: string;
      output?: string;
    }[];
  };
  extra?: Record<string, unknown>;
};

type MiniSweAgentData = {
  trajectory_format?: string;
  messages?: MiniSweMessage[];
  info?: Record<string, unknown>;
};

type MiniSweMessage = {
  role?: string;
  type?: string;
  content?: string | { type: string; text?: string }[];
  output?: MiniSweOutputItem[] | string;
  call_id?: string;
  tool_calls?: Record<string, unknown>[];
  reasoning_content?: string;
  thinking_blocks?: unknown[];
  tool_call_id?: string;
};

type MiniSweOutputItem = {
  type: string;
  name?: string;
  call_id?: string;
  arguments?: string;
  content?: { type: string; text?: string }[];
  summary?: unknown[];
  role?: string;
};

function parseClaudeCodeRaw(lines: string[]): AgentTraceTurn[] {
  const turns: AgentTraceTurn[] = [];
  let nextId = 1;
  const toolNames = new Map<string, string>();

  for (const line of lines) {
    let ev: RawEvent;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }

    if (ev.type === "user" && ev.message) {
      const content = ev.message.content;
      if (!content) continue;

      if (typeof content === "string") {
        if (content.trim()) turns.push({ id: nextId++, type: "user", text: content, timestamp: ev.timestamp });
        continue;
      }

      if (!Array.isArray(content)) continue;
      const toolResults: AgentTraceToolResult[] = [];
      const textParts: string[] = [];

      for (const block of content) {
        if (block.type === "tool_result") {
          const resultContent = block.content;
          const text = typeof resultContent === "string"
            ? resultContent
            : Array.isArray(resultContent)
              ? resultContent.map((c) => (typeof c === "string" ? c : c.text ?? "")).join("\n")
              : "";
          toolResults.push({
            toolUseId: block.tool_use_id ?? "",
            toolName: toolNames.get(block.tool_use_id ?? ""),
            content: text,
            isError: (block as unknown as Record<string, unknown>).is_error === true ? true : undefined,
          });
        } else if (block.type === "text" && block.text) {
          textParts.push(block.text);
        }
      }

      if (toolResults.length > 0) turns.push({ id: nextId++, type: "tool_result", toolResults, timestamp: ev.timestamp });
      if (textParts.length > 0) turns.push({ id: nextId++, type: "user", text: textParts.join("\n"), timestamp: ev.timestamp });
    } else if (ev.type === "assistant" && ev.message) {
      const content = ev.message.content;
      if (!content) continue;

      if (typeof content === "string") {
        if (content.trim()) turns.push({ id: nextId++, type: "assistant", text: content, timestamp: ev.timestamp });
        continue;
      }

      const textParts: string[] = [];
      const toolCalls: AgentTraceToolCall[] = [];
      let reasoning = "";

      for (const block of content) {
        if (block.type === "text" && block.text) {
          textParts.push(block.text);
        } else if (block.type === "tool_use") {
          const inputStr = typeof block.input === "string" ? block.input : JSON.stringify(block.input ?? {}, null, 2);
          toolCalls.push({ id: block.id ?? "", name: block.name ?? "unknown", input: inputStr });
          if (block.id && block.name) toolNames.set(block.id, block.name);
        } else if (block.type === "thinking" || block.type === "reasoning") {
          reasoning += (block.text ?? "") + "\n";
        }
      }

      if (textParts.length > 0 || toolCalls.length > 0 || reasoning) {
        turns.push({
          id: nextId++,
          type: "assistant",
          text: textParts.join("\n") || undefined,
          reasoning: reasoning.trim() || undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          timestamp: ev.timestamp,
        });
      }
    }
  }

  return turns;
}

function parseCodexRaw(lines: string[]): AgentTraceTurn[] {
  const turns: AgentTraceTurn[] = [];
  let nextId = 1;
  const callNames = new Map<string, string>();
  let pendingText = "";
  let pendingToolCalls: AgentTraceToolCall[] = [];
  let pendingReasoning = "";
  let pendingTimestamp: string | undefined;

  function flushAssistant() {
    if (pendingText || pendingToolCalls.length > 0 || pendingReasoning) {
      turns.push({
        id: nextId++,
        type: "assistant",
        text: pendingText || undefined,
        reasoning: pendingReasoning || undefined,
        toolCalls: pendingToolCalls.length > 0 ? [...pendingToolCalls] : undefined,
        timestamp: pendingTimestamp,
      });
    }
    pendingText = "";
    pendingToolCalls = [];
    pendingReasoning = "";
    pendingTimestamp = undefined;
  }

  for (const line of lines) {
    let ev: RawEvent;
    try {
      ev = JSON.parse(line);
    } catch {
      continue;
    }

    if (ev.type !== "response_item") continue;
    const payload = ev.payload;
    if (!payload) continue;

    const pType = payload.type as string;
    const pRole = payload.role as string | undefined;

    if (pType === "message" && (pRole === "developer" || pRole === "user" || pRole === "system")) {
      flushAssistant();
      const content = payload.content;
      let text = "";
      if (Array.isArray(content)) {
        text = (content as ContentBlock[]).map((c) => c.text ?? "").filter(Boolean).join("\n");
      } else if (typeof content === "string") {
        text = content;
      }
      if (text.trim()) {
        turns.push({
          id: nextId++,
          type: pRole === "system" || pRole === "developer" ? "system" : "user",
          text,
          timestamp: ev.timestamp,
        });
      }
    } else if (pType === "message" && pRole === "assistant") {
      flushAssistant();
      const content = payload.content;
      if (Array.isArray(content)) {
        pendingText = (content as ContentBlock[]).map((c) => c.text ?? "").filter(Boolean).join("\n");
      } else if (typeof content === "string") {
        pendingText = content;
      }
      pendingTimestamp = ev.timestamp;
    } else if (pType === "reasoning") {
      const content = payload.content;
      let text = "";
      if (Array.isArray(content)) {
        text = (content as ContentBlock[]).map((c) => c.text ?? "").filter(Boolean).join("\n");
      } else if (typeof payload.summary === "string") {
        text = payload.summary;
      }
      if (text.trim()) pendingReasoning += (pendingReasoning ? "\n" : "") + text;
    } else if (pType === "function_call" || pType === "custom_tool_call") {
      const name = (payload.name as string) || "tool";
      const callId = (payload.call_id as string) || "";
      const args = ((payload.arguments ?? payload.input) as string) || "{}";
      callNames.set(callId, name);
      pendingToolCalls.push({ id: callId, name, input: args });
    } else if (pType === "function_call_output" || pType === "custom_tool_call_output") {
      flushAssistant();
      const callId = (payload.call_id as string) || "";
      turns.push({
        id: nextId++,
        type: "tool_result",
        toolResults: [{
          toolUseId: callId,
          toolName: callNames.get(callId),
          content: (payload.output as string) || "",
        }],
        timestamp: ev.timestamp,
      });
    }
  }

  flushAssistant();
  return turns;
}

function parseOpenCodeRaw(events: OpenCodeEvent[]): AgentTraceTurn[] {
  const turns: AgentTraceTurn[] = [];
  let nextId = 1;
  let currentToolCalls: AgentTraceToolCall[] = [];
  let currentToolResults: AgentTraceToolResult[] = [];

  function flushStep() {
    if (currentToolCalls.length > 0) {
      turns.push({ id: nextId++, type: "assistant", toolCalls: [...currentToolCalls] });
      if (currentToolResults.length > 0) {
        turns.push({ id: nextId++, type: "tool_result", toolResults: [...currentToolResults] });
      }
    }
    currentToolCalls = [];
    currentToolResults = [];
  }

  for (const ev of events) {
    if (ev.type === "step_start") {
      flushStep();
    } else if (ev.type === "tool_use" && ev.part) {
      const toolName = ev.part.tool ?? "tool";
      const callId = ev.part.callID ?? "";
      currentToolCalls.push({
        id: callId,
        name: toolName,
        input: ev.part.state?.input ? JSON.stringify(ev.part.state.input, null, 2) : "{}",
      });
      currentToolResults.push({
        toolUseId: callId,
        toolName,
        content: ev.part.state?.output ?? ev.part.state?.metadata?.output ?? "",
      });
    } else if (ev.type === "text" && ev.part?.text) {
      flushStep();
      turns.push({ id: nextId++, type: "assistant", text: ev.part.text });
    }
  }

  flushStep();
  return turns;
}

function parseGeminiCliRaw(data: GeminiCliData): AgentTraceTurn[] {
  const messages = data.messages;
  if (!messages || !Array.isArray(messages)) return [];

  const turns: AgentTraceTurn[] = [];
  let nextId = 1;

  for (const msg of messages) {
    if (msg.type === "user") {
      const text = typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map((c) => (typeof c === "string" ? c : c.text ?? "")).filter(Boolean).join("\n")
          : "";
      if (text.trim()) turns.push({ id: nextId++, type: "user", text, timestamp: msg.timestamp });
      continue;
    }

    if (msg.type === "gemini") {
      const reasoning = msg.thoughts?.map((t) => [t.subject ? `**${t.subject}**` : "", t.description ?? ""].filter(Boolean).join("\n")).filter(Boolean).join("\n\n") ?? "";
      const text = typeof msg.content === "string" && msg.content.trim()
        ? msg.content
        : "";
      const toolCalls: AgentTraceToolCall[] = [];
      const toolResults: AgentTraceToolResult[] = [];

      if (msg.toolCalls && Array.isArray(msg.toolCalls)) {
        for (const tc of msg.toolCalls) {
          const name = tc.name ?? "tool";
          const callId = tc.id ?? "";
          toolCalls.push({ id: callId, name, input: tc.args ? JSON.stringify(tc.args, null, 2) : "{}" });
          const output = tc.resultDisplay
            ? tc.resultDisplay
            : tc.result?.map((r) => r.functionResponse?.response?.output ?? "").filter(Boolean).join("\n") ?? "";
          if (output || tc.status) {
            toolResults.push({ toolUseId: callId, toolName: name, content: output });
          }
        }
      }

      if (text || reasoning || toolCalls.length > 0) {
        turns.push({
          id: nextId++,
          type: "assistant",
          text: text || undefined,
          reasoning: reasoning || undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
          timestamp: msg.timestamp,
        });
        if (toolResults.length > 0) {
          turns.push({ id: nextId++, type: "tool_result", toolResults, timestamp: msg.timestamp });
        }
      }
    }
  }

  return turns;
}

function parseFallbackTrajectory(data: { steps?: CondensedStep[]; agent?: Record<string, unknown>; final_metrics?: Record<string, unknown> }): AgentTraceTurn[] {
  const steps = data.steps;
  if (!steps || !Array.isArray(steps)) return [];

  const turns: AgentTraceTurn[] = [];
  let nextId = 1;

  for (const step of steps) {
    const msg = typeof step.message === "string" ? step.message : JSON.stringify(step.message, null, 2);
    const type: AgentTraceTurnType = step.source === "user" ? "user" : step.source === "system" ? "system" : "assistant";
    const toolCalls: AgentTraceToolCall[] = [];

    if (step.tool_calls && Array.isArray(step.tool_calls)) {
      for (const tc of step.tool_calls) {
        toolCalls.push({
          id: tc.tool_call_id ?? "",
          name: tc.function_name ?? "tool",
          input: tc.arguments ? JSON.stringify(tc.arguments, null, 2) : "{}",
        });
      }
    }

    const displayMsg = msg === "(tool use)" && toolCalls.length > 0 ? undefined : msg.trim() || undefined;
    turns.push({ id: nextId++, type, text: displayMsg, toolCalls: toolCalls.length > 0 ? toolCalls : undefined, timestamp: step.timestamp });

    if (step.observation?.results && Array.isArray(step.observation.results)) {
      const toolResults: AgentTraceToolResult[] = step.observation.results.map((result) => ({
        toolUseId: result.source_call_id ?? "",
        toolName: toolCalls.find((toolCall) => toolCall.id === result.source_call_id)?.name,
        content: result.content ?? result.output ?? "",
      }));
      if (toolResults.length > 0) turns.push({ id: nextId++, type: "tool_result", toolResults, timestamp: step.timestamp });
    }
  }

  return turns;
}

function parseMiniSweAgentOpenAIStyle(messages: MiniSweMessage[]): AgentTraceTurn[] {
  const turns: AgentTraceTurn[] = [];
  let nextId = 1;
  const callNames = new Map<string, string>();

  for (const msg of messages) {
    if (msg.role === "system") {
      const text = typeof msg.content === "string" ? msg.content : "";
      if (text.trim()) turns.push({ id: nextId++, type: "system", text });
      continue;
    }

    if (msg.role === "user") {
      const text = typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map((c) => c.text ?? "").filter(Boolean).join("\n")
          : "";
      if (text.trim()) turns.push({ id: nextId++, type: "user", text });
      continue;
    }

    if (msg.type === "function_call_output") {
      const callId = msg.call_id ?? "";
      turns.push({
        id: nextId++,
        type: "tool_result",
        toolResults: [{
          toolUseId: callId,
          toolName: callNames.get(callId),
          content: typeof msg.output === "string" ? msg.output : Array.isArray(msg.output) ? JSON.stringify(msg.output) : String(msg.output ?? ""),
        }],
      });
      continue;
    }

    if (msg.output && Array.isArray(msg.output)) {
      let reasoning = "";
      let text = "";
      const toolCalls: AgentTraceToolCall[] = [];

      for (const item of msg.output) {
        if (item.type === "reasoning" && Array.isArray(item.summary)) {
          const summaryTexts = item.summary.map((summary: unknown) => {
            if (typeof summary === "string") return summary;
            if (summary && typeof summary === "object" && "text" in summary) return String((summary as { text: string }).text);
            return "";
          }).filter(Boolean);
          if (summaryTexts.length > 0) reasoning += summaryTexts.join("\n") + "\n";
        } else if (item.type === "message" && item.role === "assistant" && Array.isArray(item.content)) {
          for (const content of item.content) {
            if (content.type === "output_text" && content.text) text += (text ? "\n" : "") + content.text;
          }
        } else if (item.type === "function_call") {
          const callId = item.call_id ?? "";
          let args = item.arguments ?? "{}";
          try {
            args = JSON.stringify(JSON.parse(args), null, 2);
          } catch {
            // keep original string
          }
          callNames.set(callId, item.name ?? "tool");
          toolCalls.push({ id: callId, name: item.name ?? "tool", input: args });
        }
      }

      if (text || reasoning || toolCalls.length > 0) {
        turns.push({
          id: nextId++,
          type: "assistant",
          text: text || undefined,
          reasoning: reasoning.trim() || undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        });
      }
      continue;
    }

    if (msg.type === "exit" || msg.role === "exit") {
      const raw = msg as Record<string, unknown>;
      const extra = (raw.extra ?? {}) as Record<string, unknown>;
      const exitContent = typeof raw.content === "string" ? raw.content : "";
      const exitStatus = (extra.exit_status ?? raw.exit_status) as string | undefined;
      const submission = (extra.submission ?? raw.submission) as string | undefined;
      const traceback = (extra.traceback ?? raw.traceback) as string | undefined;
      const parts: string[] = [];
      if (exitStatus) parts.push(`**Exit status:** ${exitStatus}`);
      if (exitContent) parts.push(exitContent);
      if (traceback) parts.push("```\n" + traceback.trim() + "\n```");
      if (submission) parts.push(`**Submission:** ${submission}`);
      if (parts.length > 0) turns.push({ id: nextId++, type: "exit", text: parts.join("\n\n") });
    }
  }

  return turns;
}

function parseMiniSweAgentAnthropicStyle(messages: MiniSweMessage[]): AgentTraceTurn[] {
  const turns: AgentTraceTurn[] = [];
  let nextId = 1;
  const callNames = new Map<string, string>();

  for (const msg of messages) {
    if (msg.role === "system") {
      const text = typeof msg.content === "string" ? msg.content : "";
      if (text.trim()) turns.push({ id: nextId++, type: "system", text });
      continue;
    }

    if (msg.role === "user") {
      const text = typeof msg.content === "string" ? msg.content : "";
      if (text.trim()) turns.push({ id: nextId++, type: "user", text });
      continue;
    }

    if (msg.role === "assistant") {
      let reasoning = "";
      if (typeof msg.reasoning_content === "string" && msg.reasoning_content.trim()) {
        reasoning = msg.reasoning_content;
      } else if (Array.isArray(msg.thinking_blocks)) {
        reasoning = msg.thinking_blocks.map((block: unknown) => {
          if (typeof block === "string") return block;
          if (block && typeof block === "object" && "thinking" in block) return String((block as { thinking: string }).thinking);
          return "";
        }).filter(Boolean).join("\n\n");
      }

      const text = typeof msg.content === "string"
        ? msg.content
        : Array.isArray(msg.content)
          ? msg.content.map((content) => content.text ?? "").filter(Boolean).join("\n")
          : "";

      const toolCalls: AgentTraceToolCall[] = [];
      if (Array.isArray(msg.tool_calls)) {
        for (const toolCall of msg.tool_calls) {
          const fn = toolCall.function as Record<string, unknown> | undefined;
          const name = (fn?.name as string) ?? (toolCall.name as string) ?? "tool";
          const callId = (toolCall.id as string) ?? "";
          let args = (fn?.arguments as string) ?? (toolCall.arguments as string) ?? "{}";
          try {
            args = JSON.stringify(JSON.parse(args), null, 2);
          } catch {
            // keep original string
          }
          callNames.set(callId, name);
          toolCalls.push({ id: callId, name, input: args });
        }
      }

      if (text || reasoning || toolCalls.length > 0) {
        turns.push({
          id: nextId++,
          type: "assistant",
          text: text || undefined,
          reasoning: reasoning.trim() || undefined,
          toolCalls: toolCalls.length > 0 ? toolCalls : undefined,
        });
      }
      continue;
    }

    if (msg.role === "tool") {
      const callId = msg.tool_call_id ?? "";
      turns.push({
        id: nextId++,
        type: "tool_result",
        toolResults: [{
          toolUseId: callId,
          toolName: callNames.get(callId),
          content: typeof msg.content === "string" ? msg.content : "",
        }],
      });
      continue;
    }

    if (msg.role === "exit" || msg.type === "exit") {
      const raw = msg as Record<string, unknown>;
      const extra = (raw.extra ?? {}) as Record<string, unknown>;
      const exitContent = typeof raw.content === "string" ? raw.content : "";
      const exitStatus = (extra.exit_status ?? raw.exit_status) as string | undefined;
      const submission = (extra.submission ?? raw.submission) as string | undefined;
      const traceback = (extra.traceback ?? raw.traceback) as string | undefined;
      const parts: string[] = [];
      if (exitStatus) parts.push(`**Exit status:** ${exitStatus}`);
      if (exitContent) parts.push(exitContent);
      if (traceback) parts.push("```\n" + traceback.trim() + "\n```");
      if (submission) parts.push(`**Submission:** ${submission}`);
      if (parts.length > 0) turns.push({ id: nextId++, type: "exit", text: parts.join("\n\n") });
    }
  }

  return turns;
}

function parseMiniSweAgentRaw(data: MiniSweAgentData): AgentTraceTurn[] {
  const messages = data.messages;
  if (!messages || !Array.isArray(messages)) return [];
  const hasOutputArrays = messages.some((message) => Array.isArray(message.output) || message.type === "function_call_output");
  const hasRoleToolCalls = messages.some((message) => message.role === "assistant" && Array.isArray(message.tool_calls) && message.tool_calls.length > 0);
  return hasRoleToolCalls && !hasOutputArrays
    ? parseMiniSweAgentAnthropicStyle(messages)
    : parseMiniSweAgentOpenAIStyle(messages);
}

function parseJsonObjectData(data: Record<string, unknown>): AgentTraceTurn[] {
  if (data.trajectory_format?.toString().startsWith("mini-swe-agent") || (data.messages && data.info)) {
    return parseMiniSweAgentRaw(data as MiniSweAgentData);
  }

  if (data.sessionId && Array.isArray(data.messages)) {
    const hasGeminiMessages = data.messages.some((message) => typeof message === "object" && message && (message as Record<string, unknown>).type === "gemini");
    if (hasGeminiMessages) return parseGeminiCliRaw(data as GeminiCliData);
  }

  if (Array.isArray((data as { steps?: unknown[] }).steps)) {
    return parseFallbackTrajectory(data as { steps?: CondensedStep[]; agent?: Record<string, unknown>; final_metrics?: Record<string, unknown> });
  }

  return [];
}

function parseJsonlLines(lines: string[]): AgentTraceTurn[] {
  if (lines.length === 0) return [];

  try {
    const firstEvent = JSON.parse(lines[0]) as { type?: string };
    if (firstEvent.type === "session_meta" || firstEvent.type === "response_item" || firstEvent.type === "event_msg") {
      return parseCodexRaw(lines);
    }
    if (firstEvent.type === "queue-operation" || firstEvent.type === "user" || firstEvent.type === "assistant") {
      return parseClaudeCodeRaw(lines);
    }
  } catch {
    return [];
  }

  return [];
}

export function parseAgentTrace(raw: string | unknown): AgentTraceTurn[] {
  if (typeof raw === "string") {
    const trimmed = raw.trim();
    if (!trimmed) return [];

    if (trimmed.startsWith("[")) {
      try {
        const data = JSON.parse(trimmed);
        if (Array.isArray(data) && data.length > 0 && typeof data[0] === "object" && data[0] && "type" in data[0]) {
          return parseOpenCodeRaw(data as OpenCodeEvent[]);
        }
      } catch {
        return [];
      }
    }

    if (trimmed.startsWith("{")) {
      try {
        const data = JSON.parse(trimmed) as Record<string, unknown>;
        return parseJsonObjectData(data);
      } catch {
        // fall through to JSONL parsing
      }
    }

    return parseJsonlLines(trimmed.split("\n").filter((line) => line.trim().length > 0));
  }

  if (Array.isArray(raw)) {
    return parseOpenCodeRaw(raw as OpenCodeEvent[]);
  }

  if (raw && typeof raw === "object") {
    return parseJsonObjectData(raw as Record<string, unknown>);
  }

  return [];
}
