import { afterEach, describe, expect, spyOn, test } from "bun:test";
import { assistant, chatPrompt, messages, system, user, type FormatOptions, type Message } from "../src/index.js";

const js = (p: unknown) =>
  p as {
    format(vars: object, options?: FormatOptions): Message[];
    formatText(vars: object, options?: FormatOptions): string;
  };

const warn = spyOn(console, "warn").mockImplementation(() => {});
afterEach(() => warn.mockClear());

const history: Message[] = [
  { role: "user", content: "Hi" },
  { role: "assistant", content: "Hello!" },
];

describe("chatPrompt", () => {
  test("formats each message in order", () => {
    const chat = chatPrompt([
      system("You are a {{persona}}."),
      user("Summarize: {{text}}"),
      assistant("Sure, here's a summary:"),
    ]);
    expect(chat.format({ persona: "pirate", text: "the news" })).toEqual([
      { role: "system", content: "You are a pirate." },
      { role: "user", content: "Summarize: the news" },
      { role: "assistant", content: "Sure, here's a summary:" },
    ]);
  });

  test("a name shared across messages is one variable", () => {
    const chat = chatPrompt([system("You are {{persona}}."), user("As {{persona}}, say hi.")]);
    expect(chat.variables).toEqual(["persona"]);
    expect(chat.format({ persona: "Ada" }).map((m) => m.content)).toEqual(["You are Ada.", "As Ada, say hi."]);
  });

  test("a messages slot splices in history", () => {
    const chat = chatPrompt([system("Be brief."), messages("history"), user("{{question}}")]);
    expect(chat.variables).toEqual(["history", "question"]);
    expect(chat.format({ history, question: "Why?" })).toEqual([
      { role: "system", content: "Be brief." },
      ...history,
      { role: "user", content: "Why?" },
    ]);
  });

  test("an empty history splices in nothing", () => {
    const chat = chatPrompt([messages("history"), user("hi")]);
    expect(chat.format({ history: [] })).toEqual([{ role: "user", content: "hi" }]);
  });

  test("history content is not treated as a template", () => {
    const chat = chatPrompt([messages("history")]);
    const raw: Message[] = [{ role: "user", content: "{{nope}}" }];
    expect(chat.format({ history: raw })).toEqual(raw);
    expect(warn).not.toHaveBeenCalled();
  });

  test("a missing slot warns and splices in nothing", () => {
    const chat = chatPrompt([messages("history"), user("hi")]);
    expect(js(chat).format({})).toEqual([{ role: "user", content: "hi" }]);
    expect(warn).toHaveBeenCalledWith('[promptlib] Missing variable "history"');
  });

  test("a slot given a non-array throws", () => {
    const chat = chatPrompt([messages("history")]);
    expect(() => js(chat).format({ history: "oops" })).toThrow('Variable "history" must be an array of messages');
  });

  test.each([
    ["null", null],
    ["a string", "hi"],
    ["a message without content", { role: "user" }],
    ["a message with non-string content", { role: "user", content: 1 }],
    ["an unknown role", { role: "tool", content: "hi" }],
    ["an inherited role", { role: "toString", content: "hi" }],
  ])("a slot given %s as an item throws", (_, item) => {
    const chat = chatPrompt([messages("history")]);
    expect(() => js(chat).format({ history: [history[0], item] })).toThrow(
      '[promptlib] Variable "history" item 1 is not a message. Expected { role, content } with role system, user, or assistant.',
    );
  });

  test("a missing text variable is reported once across messages", () => {
    const chat = chatPrompt([system("{{a}}"), user("{{a}}")]);
    js(chat).format({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test("onMissing passes through", () => {
    const chat = chatPrompt([user("{{a}}")]);
    expect(() => js(chat).format({}, { onMissing: "throw" })).toThrow('Missing variable "a"');
  });

  test("a name used as both text and slot is rejected", () => {
    const parts = [system("Context: {{history}}"), messages("history")] as const;
    expect(() => chatPrompt(parts as typeof parts & { error: never })).toThrow(
      `"history" is used as both a text variable and a messages slot`,
    );
  });

  test("placeholder errors surface at definition", () => {
    expect(() => chatPrompt([user("{{bad name}}")])).toThrow(/Invalid placeholder name/);
  });

  test("a prompt without variables formats with no arguments", () => {
    expect(chatPrompt([user("hi")]).format()).toEqual([{ role: "user", content: "hi" }]);
  });
});

describe("formatText", () => {
  test("flattens messages into labelled turns", () => {
    const chat = chatPrompt([system("Be {{tone}}."), messages("history"), user("Bye")]);
    expect(chat.formatText({ tone: "kind", history })).toBe(
      "System: Be kind.\n\nUser: Hi\n\nAssistant: Hello!\n\nUser: Bye",
    );
  });
});
