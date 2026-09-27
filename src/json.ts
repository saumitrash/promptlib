import { chatPrompt, message, type ChatPrompt, type Role } from "./chat.js";
import { textPrompt, type TextPrompt } from "./prompt.js";
import type { Value } from "./template.js";
import type { Message } from "./chat.js";

export type PromptJSON =
  | { version: 1; kind: "text"; template: string }
  | { version: 1; kind: "chat"; parts: PartJSON[] };

type PartJSON = { type: "message"; role: Role; template: string } | { type: "messages"; name: string };

export type AnyPrompt = TextPrompt<Record<string, Value>> | ChatPrompt<Record<string, Value | readonly Message[]>>;

const ROLES = new Set(["system", "user", "assistant"]);

const isRecord = (x: unknown): x is Record<string, unknown> => typeof x === "object" && x !== null;

const isPart = (x: unknown): x is PartJSON =>
  isRecord(x) &&
  ((x.type === "message" && typeof x.role === "string" && ROLES.has(x.role) && typeof x.template === "string") ||
    (x.type === "messages" && typeof x.name === "string"));

const fail = (reason: string): never => {
  throw new Error(`[promptlib] Invalid prompt JSON: ${reason}`);
};

/**
 * Loads a prompt saved with `JSON.stringify(prompt)`.
 *
 * The type argument is an unchecked claim about the loaded prompt's variables, like the type you give
 * `JSON.parse`. The shape of the JSON is validated; a template that uses different variable names than
 * `P` is not caught here, only by the runtime `onMissing` handling when formatting.
 */
export function fromJSON<P extends AnyPrompt = AnyPrompt>(input: unknown): P {
  let data = input;
  if (typeof input === "string") {
    try {
      data = JSON.parse(input);
    } catch (error) {
      fail((error as Error).message);
    }
  }
  if (!isRecord(data)) return fail("expected an object");
  if (data.version !== 1) throw new Error(`[promptlib] Unsupported prompt version ${String(data.version)}`);
  if (data.kind === "text") {
    if (typeof data.template !== "string") return fail('"template" must be a string');
    return textPrompt(data.template) as P;
  }
  if (data.kind === "chat") {
    if (!Array.isArray(data.parts)) return fail('"parts" must be an array');
    const parts = data.parts.map((part: unknown, i) => {
      if (!isPart(part)) return fail(`parts[${i}] is not a valid part`);
      return part.type === "message" ? message(part.role, part.template) : part;
    });
    return chatPrompt(parts) as P;
  }
  return fail(`Unknown prompt kind "${String(data.kind)}"`);
}
