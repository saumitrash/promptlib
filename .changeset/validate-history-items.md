---
"@saumitrash/promptlib": patch
---

Chat `format()` now throws when a `messages()` slot item is not a `{ role, content }` message. Before, a malformed item (for example a message template) was passed through and reached the provider without `content`.
