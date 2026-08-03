import { access, readFile, readdir, stat } from "node:fs/promises";
import path from "node:path";
import worker from "../server/index.js";

const clientDir = path.resolve("dist/client");
const materialsDir = path.join(clientDir, "materials");
const materialEntries = (await readdir(materialsDir, { withFileTypes: true })).filter(
  (entry) => entry.isDirectory(),
);

let bytes = 0;
let duplicatePayloads = 0;

async function inspect(directory) {
  for (const entry of await readdir(directory, { withFileTypes: true })) {
    const target = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      await inspect(target);
      continue;
    }
    bytes += (await stat(target)).size;
    if (entry.name === "__next._full.txt") duplicatePayloads += 1;
  }
}

await inspect(path.resolve("dist"));
await access(path.resolve("dist/.openai/hosting.json"));
await access(path.resolve("dist/server/index.js"));
await access(path.join(clientDir, "rozrizaty-zobrazhennya", "index.html"));

if (materialEntries.length !== 896) {
  throw new Error(`Expected 896 material directories, received ${materialEntries.length}.`);
}
if (duplicatePayloads !== 0) {
  throw new Error(`Found ${duplicatePayloads} duplicate __next._full.txt payloads.`);
}

for (const entry of materialEntries) {
  const directory = path.join(materialsDir, entry.name);
  await Promise.all([
    access(path.join(directory, "index.html")),
    access(path.join(directory, "index.txt")),
  ]);
}

const assets = {
  async fetch(request) {
    const url = new URL(request.url);
    let pathname = decodeURIComponent(url.pathname);
    if (pathname === "/") pathname = "/index.html";
    if (pathname.endsWith("/")) pathname += "index.html";
    const target = path.join(clientDir, pathname.replace(/^\/+/, ""));
    try {
      return new Response(await readFile(target), { status: 200 });
    } catch {
      return new Response("Not found", { status: 404 });
    }
  },
};

const sample = materialEntries[0].name;
const routed = await worker.fetch(
  new Request(`https://example.test/materials/${sample}/__next._full.txt`),
  { ASSETS: assets },
);
const expected = await readFile(path.join(materialsDir, sample, "index.txt"));
const received = Buffer.from(await routed.arrayBuffer());

if (routed.status !== 200 || !received.equals(expected)) {
  throw new Error("The removed Next.js payload is not restored by the worker route.");
}

const notFound = await worker.fetch(
  new Request("https://example.test/storinka-yakoyi-nemaye/"),
  { ASSETS: assets },
);
if (notFound.status !== 200 || !(await notFound.text()).includes("404")) {
  throw new Error("Unknown routes do not return the exported 404 page.");
}

console.log(
  `Sites package verified: ${materialEntries.length} materials, ${(bytes / 1024 / 1024).toFixed(2)} MB, payload and 404 routing work.`,
);
