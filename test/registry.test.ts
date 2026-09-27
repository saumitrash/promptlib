import { expect, test } from "bun:test";
import { chatPrompt, textPrompt, registry, user } from "../src/index.js";

const greet = textPrompt("Hello {{name}}");
const support = chatPrompt([user("Help with {{issue}}")]);
const prompts = registry({ greet, "support/triage": support });

test("gets a prompt by name", () => {
  expect(prompts.get("greet")).toBe(greet);
  expect(prompts.get("support/triage").format({ issue: "login" })).toEqual([
    { role: "user", content: "Help with login" },
  ]);
});

test("lists names", () => {
  expect(prompts.names()).toEqual(["greet", "support/triage"]);
});

test("has() narrows runtime strings", () => {
  expect(prompts.has("greet")).toBe(true);
  expect(prompts.has("nope")).toBe(false);
  expect(prompts.has("toString")).toBe(false);
});

test("unknown names throw with the known names listed", () => {
  const get = prompts.get as (name: string) => unknown;
  expect(() => get("nope")).toThrow('[promptlib] Unknown prompt "nope". Known prompts: greet, support/triage');
});

test("serializes every prompt by name", () => {
  expect(JSON.parse(JSON.stringify(prompts))).toEqual({
    greet: { version: 1, kind: "text", template: "Hello {{name}}" },
    "support/triage": {
      version: 1,
      kind: "chat",
      parts: [{ type: "message", role: "user", template: "Help with {{issue}}" }],
    },
  });
});
