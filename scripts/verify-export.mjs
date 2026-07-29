import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const out = path.join(root, "out");
const materials = JSON.parse(
  await fs.readFile(path.join(root, "data", "materials.json"), "utf8"),
);
const required = [
  "index.html",
  "catalog/index.html",
  "free/index.html",
  "about/index.html",
  "how-to-buy/index.html",
  "contacts/index.html",
  "success/index.html",
  "404.html",
  "robots.txt",
  "sitemap.xml",
  "manifest.webmanifest",
];
const errors = [];

for (const relative of required) {
  try {
    await fs.access(path.join(out, relative));
  } catch {
    errors.push(`В експорті немає ${relative}`);
  }
}

for (const material of materials) {
  try {
    await fs.access(path.join(out, "materials", material.slug, "index.html"));
  } catch {
    errors.push(`Немає сторінки матеріалу: ${material.slug}`);
  }
}

if (errors.length) {
  console.error(errors.slice(0, 50).join("\n"));
  if (errors.length > 50) console.error(`…ще ${errors.length - 50} помилок`);
  process.exitCode = 1;
} else {
  console.log(
    `Статичний експорт перевірено: ${materials.length} прямих сторінок матеріалів.`,
  );
}
