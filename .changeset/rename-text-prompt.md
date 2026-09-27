---
"@saumitrash/promptlib": minor
---

Rename `prompt()` to `textPrompt()`. The old name matched the global `prompt()` in browsers, Bun, and Deno, so code that forgot the import still compiled and called the global instead. Replace `prompt(` with `textPrompt(` in your imports and calls.
