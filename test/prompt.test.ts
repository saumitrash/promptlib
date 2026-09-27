import { afterEach, describe, expect, spyOn, test } from "bun:test";
import * as lib from "../src/index.js";
import { textPrompt, type FormatOptions } from "../src/index.js";

// Simulates an untyped caller (plain JS, or a prompt loaded from JSON).
const js = (p: unknown) => p as { format(vars: object, options?: FormatOptions): string };

const warn = spyOn(console, "warn").mockImplementation(() => {});
afterEach(() => warn.mockClear());

describe("textPrompt", () => {
  test("is not exported as `prompt`, which would shadow the global `prompt()` when the import is missing", () => {
    expect("prompt" in lib).toBe(false);
  });

  test("fills placeholders", () => {
    const p = textPrompt("Hello {{name}}, you are {{age}}.");
    expect(p.format({ name: "Ada", age: 36 })).toBe("Hello Ada, you are 36.");
  });

  test("lists its variables once, in order of first use", () => {
    const p = textPrompt("{{b}} {{a}} {{b}}");
    expect(p.variables).toEqual(["b", "a"]);
  });

  test("fills every occurrence of a repeated name", () => {
    const p = textPrompt("{{x}}-{{x}}");
    expect(p.format({ x: 1 })).toBe("1-1");
  });

  test("tolerates whitespace inside braces", () => {
    const p = textPrompt("Hi {{ name }}!");
    expect(p.variables).toEqual(["name"]);
    expect(p.format({ name: "Ada" })).toBe("Hi Ada!");
  });

  test("stringifies booleans and numbers", () => {
    expect(textPrompt("{{a}} {{b}}").format({ a: false, b: 0 })).toBe("false 0");
  });

  test("a template without placeholders formats with no arguments", () => {
    const p = textPrompt("static text");
    expect(p.variables).toEqual([]);
    expect(p.format()).toBe("static text");
  });

  test("leaves single braces alone", () => {
    const p = textPrompt('Reply as JSON: {"answer": "{{answer}}"}');
    expect(p.format({ answer: "yes" })).toBe('Reply as JSON: {"answer": "yes"}');
  });

  test("an unclosed {{ is literal text", () => {
    const p = textPrompt("a {{ b");
    expect(p.variables).toEqual([]);
    expect(p.format()).toBe("a {{ b");
  });

  test("a backslash escapes a placeholder", () => {
    const p = textPrompt("Write \\{{name}} literally, then {{name}}.");
    expect(p.variables).toEqual(["name"]);
    expect(p.format({ name: "Ada" })).toBe("Write {{name}} literally, then Ada.");
  });

  test("does not substitute inside substituted values", () => {
    const p = textPrompt("{{a}} {{b}}");
    expect(p.format({ a: "{{b}}", b: "x" })).toBe("{{b}} x");
  });

  test("rejects placeholder names that are not identifiers", () => {
    expect(() => textPrompt("{{first name}}")).toThrow(/Invalid placeholder name "first name"/);
    expect(() => textPrompt("{{}}")).toThrow(/Invalid placeholder name ""/);
  });
});

describe("missing variables", () => {
  test("warn by default and keep the placeholder visible", () => {
    const p = textPrompt("Hello {{name}}");
    const out = js(p).format({});
    expect(out).toBe("Hello {{name}}");
    expect(warn).toHaveBeenCalledWith('[promptlib] Missing variable "name"');
  });

  test("throw on request", () => {
    const p = textPrompt("Hello {{name}}");
    expect(() => js(p).format({}, { onMissing: "throw" })).toThrow(
      'Missing variable "name"',
    );
  });

  test("ignore on request", () => {
    const p = textPrompt("Hello {{name}}");
    const out = js(p).format({}, { onMissing: "ignore" });
    expect(out).toBe("Hello {{name}}");
    expect(warn).not.toHaveBeenCalled();
  });

  test("custom handler receives the name", () => {
    const seen: string[] = [];
    const p = textPrompt("{{a}} {{b}}");
    js(p).format({ a: 1 }, { onMissing: (name: string) => seen.push(name) });
    expect(seen).toEqual(["b"]);
  });

  test("undefined and null count as missing", () => {
    const p = textPrompt("{{a}}");
    js(p).format({ a: undefined });
    js(p).format({ a: null });
    expect(warn).toHaveBeenCalledTimes(2);
  });

  test("a repeated missing name is reported once per format call", () => {
    js(textPrompt("{{a}} {{a}}")).format({});
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test("inherited object keys do not count as values", () => {
    expect(js(textPrompt("{{constructor}}")).format({})).toBe("{{constructor}}");
    expect(warn).toHaveBeenCalledTimes(1);
  });

  test("extra variables are ignored", () => {
    const p = textPrompt("{{a}}");
    expect(js(p).format({ a: 1, b: 2 })).toBe("1");
  });
});
