import type { PromptJSON } from "./json.js";
import { namesOf, parse, render, type FormatArgs, type FormatOptions, type TemplateVars } from "./template.js";

export interface TextPrompt<V> {
  readonly kind: "text";
  readonly template: string;
  readonly variables: readonly string[];
  format(...args: FormatArgs<V>): string;
  toJSON(): PromptJSON;
}

export function textPrompt<const T extends string>(template: T): TextPrompt<TemplateVars<T>> {
  const segments = parse(template);
  return {
    kind: "text",
    template,
    variables: [...new Set(namesOf(segments))],
    format: (vars?: Readonly<Record<string, unknown>>, options: FormatOptions = {}) => render(segments, vars ?? {}, options),
    toJSON: () => ({ version: 1, kind: "text", template }),
  };
}
