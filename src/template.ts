export type Value = string | number | boolean;

export type OnMissing = "warn" | "throw" | "ignore" | ((name: string) => void);

export interface FormatOptions {
  onMissing?: OnMissing;
}

type Whitespace = " " | "\n" | "\t" | "\r";

type Trim<S extends string> = S extends `${Whitespace}${infer R}`
  ? Trim<R>
  : S extends `${infer L}${Whitespace}`
    ? Trim<L>
    : S;

// Must stay in lockstep with `parse` below: same delimiters, same escape, same trimming.
export type Placeholders<S extends string, Found extends string = never> = S extends `${infer Before}{{${infer After}`
  ? Before extends `${string}\\`
    ? Placeholders<After, Found>
    : After extends `${infer Name}}}${infer Rest}`
      ? Placeholders<Rest, Found | Trim<Name>>
      : Found
  : Found;

export type Simplify<T> = { [K in keyof T]: T[K] } & {};

export type NoVars = Record<string, never>;

export type TemplateVars<S extends string> = string extends S
  ? Record<string, Value>
  : [Placeholders<S>] extends [never]
    ? NoVars
    : Simplify<{ [K in Placeholders<S>]: Value }>;

export type FormatArgs<V> = {} extends V ? [vars?: V, options?: FormatOptions] : [vars: V, options?: FormatOptions];

export type Segment = string | { readonly name: string };

const IDENTIFIER = /^[A-Za-z_][A-Za-z0-9_]*$/;
const TRIM = /^[ \n\t\r]+|[ \n\t\r]+$/g;

export function parse(template: string): Segment[] {
  const segments: Segment[] = [];
  let text = "";
  let cursor = 0;
  for (;;) {
    const open = template.indexOf("{{", cursor);
    if (open === -1) break;
    if (template[open - 1] === "\\") {
      text += template.slice(cursor, open - 1) + "{{";
      cursor = open + 2;
      continue;
    }
    const close = template.indexOf("}}", open + 2);
    if (close === -1) break;
    const name = template.slice(open + 2, close).replace(TRIM, "");
    if (!IDENTIFIER.test(name)) {
      throw new Error(`[promptlib] Invalid placeholder name "${name}". Names must be identifiers like {{user_name}}.`);
    }
    segments.push(text + template.slice(cursor, open), { name });
    text = "";
    cursor = close + 2;
  }
  segments.push(text + template.slice(cursor));
  return segments.filter((s) => s !== "");
}

export function namesOf(segments: readonly Segment[]): string[] {
  return segments.flatMap((s) => (typeof s === "string" ? [] : [s.name]));
}

export function reportMissing(name: string, onMissing: OnMissing = "warn"): void {
  const message = `[promptlib] Missing variable "${name}"`;
  if (typeof onMissing === "function") onMissing(name);
  else if (onMissing === "warn") console.warn(message);
  else if (onMissing === "throw") throw new Error(message);
}

export function render(
  segments: readonly Segment[],
  vars: Readonly<Record<string, unknown>>,
  options: FormatOptions,
): string {
  let out = "";
  const reported = new Set<string>();
  for (const segment of segments) {
    if (typeof segment === "string") {
      out += segment;
      continue;
    }
    const value = Object.hasOwn(vars, segment.name) ? vars[segment.name] : undefined;
    if (value === undefined || value === null) {
      if (!reported.has(segment.name)) reportMissing(segment.name, options.onMissing);
      reported.add(segment.name);
      out += `{{${segment.name}}}`;
    } else {
      out += String(value);
    }
  }
  return out;
}
