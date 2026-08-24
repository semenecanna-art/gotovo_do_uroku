import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import { execFileSync } from "node:child_process";
import path from "node:path";
import sharp from "sharp";

const materialsDir = path.resolve("public/materials");
const optimizeAll = process.argv.includes("--all");

const allCovers = async () => {
  const entries = await readdir(materialsDir, { withFileTypes: true });
  return entries
    .filter((entry) => entry.isDirectory())
    .map((entry) => path.join(materialsDir, entry.name, "cover.webp"));
};

const changedCovers = async () => {
  const status = execFileSync(
    process.env.GIT_EXECUTABLE || "git",
    ["status", "--porcelain=v1", "--untracked-files=normal", "--", "public/materials"],
    { encoding: "utf8" },
  );
  const selected = new Set();
  for (const line of status.split(/\r?\n/).filter(Boolean)) {
    const relative = line.slice(3).trim().replace(/\\/g, "/").replace(/\/$/, "");
    if (!relative.startsWith("public/materials/")) continue;
    selected.add(
      relative.endsWith("/cover.webp")
        ? path.resolve(relative)
        : path.resolve(relative, "cover.webp"),
    );
  }
  const existing = [];
  for (const file of selected) {
    try {
      await stat(file);
      existing.push(file);
    } catch {
      // Ignore removed folders and material directories without a cover.
    }
  }
  return existing;
};

const covers = optimizeAll ? await allCovers() : await changedCovers();

let cursor = 0;
let originalBytes = 0;
let optimizedBytes = 0;
let changed = 0;

async function optimize(file) {
  const before = await stat(file);
  const source = await readFile(file);
  const output = await sharp(source)
    .rotate()
    .resize({
      width: 1080,
      height: 1080,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 5 })
    .toBuffer();

  originalBytes += before.size;
  optimizedBytes += Math.min(before.size, output.length);
  if (output.length >= before.size) return;

  const temporary = `${file}.optimized`;
  await writeFile(temporary, output);
  await rename(temporary, file);
  changed += 1;
}

async function worker() {
  while (true) {
    const index = cursor++;
    if (index >= covers.length) return;
    await optimize(covers[index]);
  }
}

await Promise.all(Array.from({ length: 4 }, worker));

const mb = (bytes) => (bytes / 1024 / 1024).toFixed(2);
console.log(
  `Optimized ${changed}/${covers.length} covers: ${mb(originalBytes)} MB -> ${mb(optimizedBytes)} MB.`,
);
