# @saumitrash/promptlib

## 0.2.0

### Minor Changes

- 556185b: Message templates from `system()`, `user()`, and `assistant()` now have `format()`, which returns one `Message`. Use it to build history in code: `history: [user("Hi {{name}}").format({ name: "Ada" })]`. Passing an unformatted template to a `messages()` slot throws with a hint to call `.format()`.
- 556185b: Rename `prompt()` to `textPrompt()`. The old name matched the global `prompt()` in browsers, Bun, and Deno, so code that forgot the import still compiled and called the global instead. Replace `prompt(` with `textPrompt(` in your imports and calls.

### Patch Changes

- 556185b: Chat `format()` now throws when a `messages()` slot item is not a `{ role, content }` message. Before, a malformed item (for example a message template) was passed through and reached the provider without `content`.
