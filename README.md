# promptlib

Typed prompt templates for LLMs. Zero runtime dependencies. Runs anywhere modern JavaScript runs: Node, Bun, Deno, browsers, edge.

The compiler reads the placeholders out of your template, so a missing or misspelled variable is a type error in your editor, not a surprise in production.

```sh
npm install @saumitrash/promptlib
```

```ts
import { textPrompt } from "@saumitrash/promptlib";

const greet = textPrompt("Hello {{name}}, your role is {{role}}.");

greet.format({ name: "Ada", role: "admin" }); // "Hello Ada, your role is admin."
greet.format({ name: "Ada" });                // type error: 'role' is missing
greet.format({ name: "Ada", role: "x", foo: 1 }); // type error: 'foo' does not exist
```

## Templates

- Placeholders are `{{name}}`. Whitespace inside the braces is ignored. Names must be identifiers (`[A-Za-z_][A-Za-z0-9_]*`); anything else throws when the prompt is defined.
- Single braces are plain text, so JSON examples need no escaping.
- Write `\{{name}}` for a literal `{{name}}`. In a JS string literal that is `"\\{{name}}"`.
- Values are `string | number | boolean` and are inserted with `String(value)`.
- Substituted values are never re-scanned for placeholders.
- A template typed as plain `string` (built at runtime) accepts any variables.

## Chat prompts

```ts
import { assistant, chatPrompt, messages, system, user } from "@saumitrash/promptlib";

const support = chatPrompt([
  system("You are a {{persona}}."),
  messages("history"),
  user("As {{persona}}, answer: {{question}}"),
]);

support.format({ persona: "support agent", question: "Where is my order?", history: [] });
// [{ role: "system", content: "You are a support agent." }, ...history, { role: "user", content: "..." }]

support.formatText(vars);
// "System: You are a support agent.\n\nUser: As support agent, answer: ..."
```

- The same name in several messages is one variable, filled everywhere.
- `messages("history")` is a slot for a `Message[]`, spliced in as is. History content is not treated as a template. An item that is not a `{ role, content }` message throws.
- A name used as both a text placeholder and a slot is a type error, and throws at definition time.

## Missing variables

With literal templates the compiler catches missing variables. For plain JS callers and prompts loaded from JSON, `format` checks at runtime. By default it warns once per variable and leaves `{{name}}` in the output so the gap is visible.

```ts
greet.format(vars, { onMissing: "throw" });   // or "warn" (default), "ignore", or (name) => void
```

`undefined` and `null` count as missing. A missing history slot inserts nothing.

## Loading prompts by name

```ts
import { registry } from "@saumitrash/promptlib";

export const prompts = registry({ greet, "support/triage": support });

prompts.get("greet");        // autocompletes registered names, keeps each prompt's variable types
prompts.get("nope");         // type error; throws at runtime with the known names listed
prompts.has(userInput);      // narrows a runtime string to a known name
prompts.names();
```

## Saving and loading

Prompts serialize with `JSON.stringify`. `fromJSON` takes the string (or a parsed object) and validates it.

```ts
import { fromJSON } from "@saumitrash/promptlib";

const json = JSON.stringify(greet);
// {"version":1,"kind":"text","template":"Hello {{name}}, your role is {{role}}."}

const loaded = fromJSON<typeof greet>(json);
loaded.format({ name: "Ada", role: "admin" }); // same result as greet.format(...)
```

The type argument is an unchecked claim, like the type you give `JSON.parse`. Without it you get a loosely typed prompt. Reading and writing files is left to your runtime (`fs`, `Bun.file`, `fetch`, `localStorage`), so the library stays platform neutral. `JSON.stringify(prompts)` on a registry gives an object of every prompt by name.

## Providers

```ts
import { toOpenAI } from "@saumitrash/promptlib";

openai.chat.completions.create({ model, messages: toOpenAI(support.format(vars)) });
toOpenAI(msgs, { systemRole: "developer" }); // for models that take developer messages
```

Other providers are planned.

## Roadmap

- Codegen. A CLI that scans a prompts directory and writes a typed registry, so prompts in `.json` files get the same variable checking as prompts written in code.
- More provider adapters.

## Development

```sh
bun install
bun test           # runs tests with coverage; fails below 100% lines or functions
bun run typecheck  # tsc, including the @ts-expect-error type tests in test/types.test-d.ts
bun run build      # emits dist/ (ES2022 JS + .d.ts)
bun run smoke      # installs the packed build into a scratch project and checks it under node
bun run check:package  # publint + are-the-types-wrong
bun run changeset  # describe a change for the next release
```

New behavior starts with a failing test.

## License

[MIT](LICENSE)
