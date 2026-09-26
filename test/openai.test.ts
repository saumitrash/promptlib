import { expect, test } from "bun:test";
import { chatPrompt, messages, system, toOpenAI, user } from "../src/index.js";

const chat = chatPrompt([system("Be {{tone}}."), messages("history"), user("{{q}}")]);
const formatted = chat.format({ tone: "brief", q: "Why?", history: [{ role: "assistant", content: "Hi" }] });

test("maps messages to OpenAI chat messages", () => {
  expect(toOpenAI(formatted)).toEqual([
    { role: "system", content: "Be brief." },
    { role: "assistant", content: "Hi" },
    { role: "user", content: "Why?" },
  ]);
});

test("can send system messages as developer messages", () => {
  expect(toOpenAI(formatted, { systemRole: "developer" })[0]).toEqual({ role: "developer", content: "Be brief." });
});

test("returns copies, not the caller's objects", () => {
  const out = toOpenAI(formatted);
  expect(out[1]).not.toBe(formatted[1]!);
});
