import type { Message } from "./chat.js";

export interface OpenAIMessage {
  role: "system" | "developer" | "user" | "assistant";
  content: string;
}

export interface OpenAIOptions {
  /** Newer OpenAI reasoning models take instructions as "developer" messages. */
  systemRole?: "system" | "developer";
}

export function toOpenAI(messages: readonly Message[], options: OpenAIOptions = {}): OpenAIMessage[] {
  const systemRole = options.systemRole ?? "system";
  return messages.map((m) => ({ role: m.role === "system" ? systemRole : m.role, content: m.content }));
}
