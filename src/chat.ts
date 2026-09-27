import type { PromptJSON } from "./json.js";
import {
  namesOf,
  parse,
  render,
  reportMissing,
  type FormatArgs,
  type FormatOptions,
  type Placeholders,
  type Segment,
  type Simplify,
  type NoVars,
  type Value,
} from "./template.js";

export type Role = "system" | "user" | "assistant";

export interface Message {
  role: Role;
  content: string;
}

export interface MessageTemplate<R extends Role = Role, T extends string = string> {
  readonly type: "message";
  readonly role: R;
  readonly template: T;
}

export interface MessagesSlot<N extends string = string> {
  readonly type: "messages";
  readonly name: N;
}

export type Part = MessageTemplate | MessagesSlot;

export const system = <const T extends string>(template: T): MessageTemplate<"system", T> => ({
  type: "message",
  role: "system",
  template,
});

export const user = <const T extends string>(template: T): MessageTemplate<"user", T> => ({
  type: "message",
  role: "user",
  template,
});

export const assistant = <const T extends string>(template: T): MessageTemplate<"assistant", T> => ({
  type: "message",
  role: "assistant",
  template,
});

export const messages = <const N extends string>(name: N): MessagesSlot<N> => ({ type: "messages", name });

type TextNames<P extends Part> = P extends MessageTemplate<Role, infer T> ? Placeholders<T> : never;
type SlotNames<P extends Part> = P extends MessagesSlot<infer N> ? N : never;
type IsWide<P extends Part> = P extends MessageTemplate<Role, infer T> ? (string extends T ? true : never) : never;

export type ChatVars<P extends Part> = [IsWide<P>] extends [never]
  ? [TextNames<P> | SlotNames<P>] extends [never]
    ? NoVars
    : Simplify<{ [K in TextNames<P>]: Value } & { [K in SlotNames<P>]: readonly Message[] }>
  : Record<string, Value | readonly Message[]>;

type Conflict<P extends Part> = Extract<TextNames<P>, SlotNames<P>>;

type ConflictGuard<P extends Part> = [Conflict<P>] extends [never]
  ? unknown
  : { error: `"${Conflict<P>}" is used as both a text variable and a messages slot` };

export interface ChatPrompt<V> {
  readonly kind: "chat";
  readonly parts: readonly Part[];
  readonly variables: readonly string[];
  format(...args: FormatArgs<V>): Message[];
  formatText(...args: FormatArgs<V>): string;
  toJSON(): PromptJSON;
}

const LABELS: Record<Role, string> = { system: "System", user: "User", assistant: "Assistant" };

const isMessage = (x: unknown): x is Message =>
  typeof x === "object" &&
  x !== null &&
  "role" in x &&
  typeof x.role === "string" &&
  Object.hasOwn(LABELS, x.role) &&
  "content" in x &&
  typeof x.content === "string";

type Compiled = { role: Role; segments: Segment[] } | { slot: string };

export function chatPrompt<const P extends readonly Part[]>(
  parts: P & ConflictGuard<P[number]>,
): ChatPrompt<ChatVars<P[number]>> {
  const compiled: Compiled[] = parts.map((part) =>
    part.type === "messages" ? { slot: part.name } : { role: part.role, segments: parse(part.template) },
  );
  const textNames = new Set(compiled.flatMap((c) => ("segments" in c ? namesOf(c.segments) : [])));
  const slotNames = new Set(compiled.flatMap((c) => ("slot" in c ? [c.slot] : [])));
  for (const name of slotNames) {
    if (textNames.has(name)) {
      throw new Error(`[promptlib] "${name}" is used as both a text variable and a messages slot`);
    }
  }

  const format = (vars: Readonly<Record<string, unknown>> = {}, options: FormatOptions = {}): Message[] => {
    const reported = new Set<string>();
    return compiled.flatMap((c): Message[] => {
      if ("segments" in c) return [{ role: c.role, content: render(c.segments, vars, options, reported) }];
      const history = Object.hasOwn(vars, c.slot) ? vars[c.slot] : undefined;
      if (history === undefined || history === null) {
        reportMissing(c.slot, options.onMissing);
        return [];
      }
      if (!Array.isArray(history)) throw new TypeError(`[promptlib] Variable "${c.slot}" must be an array of messages`);
      history.forEach((item: unknown, i) => {
        if (!isMessage(item)) {
          throw new TypeError(
            `[promptlib] Variable "${c.slot}" item ${i} is not a message. Expected { role, content } with role system, user, or assistant.`,
          );
        }
      });
      return history;
    });
  };

  return {
    kind: "chat",
    parts,
    variables: compiled.flatMap((c) => ("slot" in c ? [c.slot] : namesOf(c.segments))).filter(
      (name, i, all) => all.indexOf(name) === i,
    ),
    format,
    formatText: (vars?: Readonly<Record<string, unknown>>, options?: FormatOptions) =>
      format(vars, options)
        .map((m) => `${LABELS[m.role]}: ${m.content}`)
        .join("\n\n"),
    toJSON: () => ({ version: 1, kind: "chat", parts: parts.map((part) => ({ ...part })) }),
  };
}
