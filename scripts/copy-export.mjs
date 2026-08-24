import { cp, mkdir, readFile, readdir, rm } from "node:fs/promises";
import path from "node:path";

await rm("dist", { recursive: true, force: true, maxRetries: 8, retryDelay: 250 });
await mkdir("dist/client", { recursive: true });
await cp("out", "dist/client", { recursive: true });
await mkdir("dist/server", { recursive: true });
await mkdir("dist/.openai", { recursive: true });
await cp("server/index.js", "dist/server/index.js");
await cp(".openai/hosting.json", "dist/.openai/hosting.json");

async function removeDuplicateFullPayloads(directory) {
  let removed = 0;
  const entries = await readdir(directory, { withFileTypes: true });

  const fullPayload = entries.find(
    (entry) => entry.isFile() && entry.name === "__next._full.txt",
  );
  const indexPayload = entries.find(
    (entry) => entry.isFile() && entry.name === "index.txt",
  );

  if (fullPayload && indexPayload) {
    const fullPath = path.join(directory, fullPayload.name);
    const indexPath = path.join(directory, indexPayload.name);
    const [full, index] = await Promise.all([
      readFile(fullPath),
      readFile(indexPath),
    ]);
    if (full.equals(index)) {
      await rm(fullPath);
      removed += 1;
    }
  }

  for (const entry of entries) {
    if (!entry.isDirectory()) continue;
    removed += await removeDuplicateFullPayloads(path.join(directory, entry.name));
  }
  return removed;
}

const removedPayloads = await removeDuplicateFullPayloads("dist/client");
console.log(`Removed ${removedPayloads} duplicate Next.js payloads.`);
