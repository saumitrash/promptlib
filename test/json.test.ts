import { describe, expect, test } from "bun:test";
import { assistant, chatPrompt, fromJSON, messages, textPrompt, system, user, type ChatPrompt, type TextPrompt } from "../src/index.js";

describe("round-trip", () => {
  test("text prompts", () => {
    const original = textPrompt("Hello {{name}}, \\{{literal}}");
    const loaded = fromJSON<typeof original>(JSON.stringify(original));
    expect(loaded.kind).toBe("text");
    expect(loaded.variables).toEqual(original.variables);
    expect(loaded.format({ name: "Ada" })).toBe(original.format({ name: "Ada" }));
  });

  test("chat prompts", () => {
    const original = chatPrompt([system("Be {{tone}}."), messages("history"), user("{{q}}"), assistant("A:")]);
    const loaded = fromJSON<typeof original>(JSON.stringify(original));
    const vars = { tone: "brief", q: "Why?", history: [{ role: "user" as const, content: "Hi" }] };
    expect(loaded.format(vars)).toEqual(original.format(vars));
    expect(JSON.stringify(loaded)).toBe(JSON.stringify(original));
  });

  test("loaded message templates can format", () => {
    const loaded = fromJSON(JSON.stringify(chatPrompt([user("Hi {{name}}")])));
    if (loaded.kind !== "chat") throw new Error("expected a chat prompt");
    const [part] = loaded.parts;
    expect(part?.type === "message" && part.format({ name: "Ada" })).toEqual({ role: "user", content: "Hi Ada" });
  });

  test("accepts an already parsed object", () => {
    const loaded = fromJSON({ version: 1, kind: "text", template: "{{a}}" });
    expect(loaded.variables).toEqual(["a"]);
  });

  test("without a type argument the result is a loosely typed prompt", () => {
    const loaded: TextPrompt<any> | ChatPrompt<any> = fromJSON('{"version":1,"kind":"text","template":"hi"}');
    expect(loaded.kind).toBe("text");
  });
});

describe("validation", () => {
  const cases: [string, unknown, string][] = [
    ["invalid JSON", "{", "Invalid prompt JSON"],
    ["non-object", 42, "Invalid prompt JSON: expected an object"],
    ["null", null, "Invalid prompt JSON: expected an object"],
    ["unknown version", { version: 2, kind: "text", template: "" }, "Unsupported prompt version 2"],
    ["unknown kind", { version: 1, kind: "image" }, 'Unknown prompt kind "image"'],
    ["text without template", { version: 1, kind: "text" }, '"template" must be a string'],
    ["chat without parts", { version: 1, kind: "chat" }, '"parts" must be an array'],
    ["bad part type", { version: 1, kind: "chat", parts: [{ type: "tool" }] }, "parts[0] is not a valid part"],
    [
      "bad role",
      { version: 1, kind: "chat", parts: [{ type: "message", role: "robot", template: "" }] },
      "parts[0] is not a valid part",
    ],
    [
      "slot without name",
      { version: 1, kind: "chat", parts: [{ type: "messages" }] },
      "parts[0] is not a valid part",
    ],
    ["bad placeholder", { version: 1, kind: "text", template: "{{a b}}" }, "Invalid placeholder name"],
    [
      "conflicting names",
      {
        version: 1,
        kind: "chat",
        parts: [
          { type: "message", role: "user", template: "{{h}}" },
          { type: "messages", name: "h" },
        ],
      },
      "used as both",
    ],
  ];
  for (const [label, input, message] of cases) {
    test(label, () => expect(() => fromJSON(input)).toThrow(message));
  }
});
