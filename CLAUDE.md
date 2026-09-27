# promptlib

A TypeScript library for typed LLM prompt templates, published as `@saumitrash/promptlib`. Consumers run it on Node, Bun, Deno, browsers, and edge runtimes. Public API and usage live in `README.md`.

## Tooling

Use Bun for the dev loop: `bun install`, `bun test`, `bun run <script>`, `bunx`. Scripts are in `package.json`.

Library code in `src/` is **portable**: plain ES2022 plus `console`. Bun, Node, and DOM APIs stay out of `src/`, including `Bun.file`. File I/O is the consumer's job.

The package has **zero runtime dependencies**. Keep `dependencies` empty; dev tooling goes in `devDependencies`.

## Workflow: tests first

Every behavior change goes **red** before it goes green:

1. Write the test. Run it and watch it fail for the expected reason.
2. Implement until it passes.
3. Run `bun test` and `bun run typecheck`. Both must pass before a commit.

Two kinds of test:

- Runtime tests are `test/*.test.ts`, run by `bun test`. Coverage is on by default (`bunfig.toml`) and the run fails below 100% lines or functions. Cover a new branch with a test.
- Type tests are `test/types.test-d.ts`, checked only by `tsc` (`bun run typecheck`), never by `bun test`. Use `assert<Equal<A, B>>()` for exact types and `// @ts-expect-error <reason>` for calls that must not compile. Any change to a public signature or a type-level helper gets a type test.

Tests call the public API from `src/index.ts`. To simulate an untyped caller (plain JS, or a prompt loaded from JSON), cast through the local `js()` helper in the test file.

## Architecture

| File | Owns |
|---|---|
| `src/template.ts` | `{{name}}` parsing (type-level `Placeholders` and runtime `parse`), rendering, missing-variable reporting |
| `src/prompt.ts` | `textPrompt()`, the text prompt |
| `src/chat.ts` | `chatPrompt()`, roles, `messages()` slots, chat variable types, name-conflict check |
| `src/json.ts` | `PromptJSON`, `fromJSON()` validation, `AnyPrompt` |
| `src/registry.ts` | `registry()`, name-based lookup |
| `src/openai.ts` | `toOpenAI()` adapter |
| `src/index.ts` | The public surface. Export every new public name here. |

### Invariants

- **Lockstep parsers.** The type-level `Placeholders` and the runtime `parse` in `src/template.ts` implement one grammar: `{{` `}}` delimiters, `\{{` escape, trim of space/tab/newline/CR only. Change both together and add a runtime test and a type test for the case.
- **Placeholder names** are identifiers (`[A-Za-z_][A-Za-z0-9_]*`). Invalid names throw at definition time, never at format time.
- **Wide templates.** A template typed as `string` yields loose vars (`Record<string, ...>`). A template with no placeholders yields `NoVars` (`Record<string, never>`) so `format()` takes no arguments and rejects extra keys.
- **One name, one variable.** A name repeated across messages is one key. A name used as both text and a `messages()` slot is a compile error (the message is carried in the `chatPrompt` parameter type so tsc prints it) and a definition-time throw.
- **Missing values** (`undefined`, `null`, or an inherited key) go through `reportMissing`, once per name per `format` call. Default is warn and leave `{{name}}` in the output. Only own properties count as values (`Object.hasOwn`).
- **Serialized shape.** `toJSON()` on each prompt returns `PromptJSON` with `version: 1`, and the chat `parts` are the same objects `system()`/`messages()` build. A breaking shape change bumps `version` and keeps `fromJSON` able to read version 1.
- **Boundaries.** `fromJSON` is the only place that validates untrusted input. Internal code trusts its types.
- **Errors** start with `[promptlib] `.

## Build and release

`bun run build` runs `tsc -p tsconfig.build.json` and emits per-module ES2022 `.js` plus `.d.ts` into `dist/`. Keep `tsc` as the build. `bun build` honors the package's own `"sideEffects": false` and emitted an empty bundle, and `--no-bundle` fails with several entry points.

Source imports use `.js` extensions (`./template.js`) so emitted files resolve under Node ESM and `moduleResolution: nodenext`.

`bun run smoke` (after a build) proves the built artifact works outside Bun: it packs the tarball, installs it into a scratch project, runs a `.mjs` consumer under `node`, and typechecks a `.ts` consumer with `--module nodenext`. `bun run check:package` runs `publint` and `attw` on the packed package. CI (`.github/workflows/ci.yml`) runs both, the smoke test on each supported Node version.

`engines.node` in `package.json` and the Node matrix in `ci.yml` move together: the lowest version in the matrix is the lowest version `engines` claims.

When bumping a GitHub Action, confirm the tag exists (`gh api repos/<owner>/<repo>/git/ref/tags/<tag>`). `changesets/action` publishes only full versions (`v2.1.2`), not a floating `v2`.

Versioning uses Changesets. A PR that changes what consumers get (runtime behavior, public types, or package contents) adds one with `bun run changeset`. Docs, tests, and CI changes don't. On `main`, `.github/workflows/version.yml` keeps a "Version Packages" PR open that bumps `package.json` and writes `CHANGELOG.md`. That PR is opened with the workflow token, so CI doesn't run on it; admins merge it through the ruleset bypass. Publishing to npm and JSR is not wired up yet (issue #1).

## Branches

`main` is protected by a repository ruleset: every change lands through a PR, the four CI checks must pass, and force-push and deletion are blocked. Work on a branch, open a PR with `gh pr create`, and never push to `main`.

## Roadmap context

Deferred on purpose, so check with the user before starting any of these:

- Codegen CLI that scans a prompts directory and writes a typed registry.
- Provider adapters beyond OpenAI.
- Per-variable value types beyond `string | number | boolean`.
- A filesystem entry point (`@saumitrash/promptlib/fs`).
