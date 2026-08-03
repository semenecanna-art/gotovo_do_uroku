import { readdir, readFile, rename, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import sharp from "sharp";

const materialsDir = path.resolve("public/materials");
const entries = await readdir(materialsDir, { withFileTypes: true });
const covers = entries
  .filter((entry) => entry.isDirectory())
  .map((entry) => path.join(materialsDir, entry.name, "cover.webp"));

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
