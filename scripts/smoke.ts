// Packs the built library, installs the tarball into a scratch project, and checks it the way a
// consumer would: runtime under `node`, types under `tsc --module nodenext`. Run after `bun run build`.
import { $ } from "bun";
import { mkdtemp, mkdir, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";

const root = resolve(import.meta.dir, "..");
const pkg = await Bun.file(join(root, "package.json")).json();
const scratch = await mkdtemp(join(tmpdir(), "promptlib-smoke-"));
const installDir = join(scratch, "node_modules", ...pkg.name.split("/"));

const tarball = (await $`npm pack --silent --pack-destination ${scratch}`.cwd(root).text()).trim();
await mkdir(installDir, { recursive: true });
await $`tar -xzf ${join(scratch, tarball)} -C ${installDir} --strip-components 1`;

await writeFile(join(scratch, "package.json"), JSON.stringify({ type: "module", private: true }));

await writeFile(
  join(scratch, "consumer.mjs"),
  `import assert from "node:assert/strict";
import { assistant, chatPrompt, fromJSON, messages, textPrompt, registry, system, toOpenAI, user } from "${pkg.name}";

const greet = textPrompt("Hello {{name}}.");
assert.equal(greet.format({ name: "Ada" }), "Hello Ada.");
assert.equal(fromJSON(JSON.stringify(greet)).format({ name: "Ada" }), "Hello Ada.");

const chat = chatPrompt([system("Be {{tone}}."), messages("history"), user("{{question}}")]);
const out = chat.format({ tone: "brief", history: [{ role: "assistant", content: "Hi" }], question: "Why?" });
assert.deepEqual(toOpenAI(out, { systemRole: "developer" }), [
  { role: "developer", content: "Be brief." },
  { role: "assistant", content: "Hi" },
  { role: "user", content: "Why?" },
]);
assert.equal(registry({ greet }).get("greet"), greet);
assert.equal(typeof assistant, "function");
assert.ok(import.meta.resolve("${pkg.name}/package.json").endsWith("package.json"));
console.log("runtime ok on node " + process.version);
`,
);

await writeFile(
  join(scratch, "consumer.ts"),
  `import { chatPrompt, messages, textPrompt, system, type Message } from "${pkg.name}";

const greet = textPrompt("Hello {{name}}.");
const text: string = greet.format({ name: "Ada" });
// @ts-expect-error missing variable
greet.format({});

const chat = chatPrompt([system("Be {{tone}}."), messages("history")]);
const msgs: Message[] = chat.format({ tone: "brief", history: [] });
export { text, msgs };
`,
);

const tsc = join(root, "node_modules", "typescript", "bin", "tsc");
await $`node ${tsc} --strict --noEmit --module nodenext --target es2022 consumer.ts`.cwd(scratch);
console.log("types ok under --module nodenext");

await $`node consumer.mjs`.cwd(scratch);
await $`rm -rf ${scratch}`;
