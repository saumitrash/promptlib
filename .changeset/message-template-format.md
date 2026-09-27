---
"@saumitrash/promptlib": minor
---

Message templates from `system()`, `user()`, and `assistant()` now have `format()`, which returns one `Message`. Use it to build history in code: `history: [user("Hi {{name}}").format({ name: "Ada" })]`. Passing an unformatted template to a `messages()` slot throws with a hint to call `.format()`.
