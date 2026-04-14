export type AgentTraceTurnType =
  | "user"
  | "assistant"
  | "tool_use"
  | "tool_result"
  | "system"
  | "reasoning"
  | "exit";

export interface AgentTraceToolCall {
  id: string;
  name: string;
  input: string;
}

export interface AgentTraceToolResult {
  toolUseId: string;
  toolName?: string;
  content: string;
  isError?: boolean;
}

export interface AgentTraceTurn {
  id: number;
  type: AgentTraceTurnType;
  text?: string;
  reasoning?: string;
  toolCalls?: AgentTraceToolCall[];
  toolResults?: AgentTraceToolResult[];
  timestamp?: string;
}
