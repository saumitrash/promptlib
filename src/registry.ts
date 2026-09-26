import type { AnyPrompt, PromptJSON } from "./json.js";

export interface Registry<R extends Record<string, AnyPrompt>> {
  get<K extends keyof R & string>(name: K): R[K];
  has(name: string): name is keyof R & string;
  names(): (keyof R & string)[];
  toJSON(): Record<keyof R & string, PromptJSON>;
}

export function registry<const R extends Record<string, AnyPrompt>>(prompts: R): Registry<R> {
  const names = Object.keys(prompts) as (keyof R & string)[];
  const has = (name: string): name is keyof R & string => Object.hasOwn(prompts, name);
  return {
    get(name) {
      if (!has(name)) {
        throw new Error(`[promptlib] Unknown prompt "${name}". Known prompts: ${names.join(", ")}`);
      }
      return prompts[name];
    },
    has,
    names: () => [...names],
    toJSON: () => Object.fromEntries(names.map((name) => [name, prompts[name]!.toJSON()])) as Record<keyof R & string, PromptJSON>,
  };
}
