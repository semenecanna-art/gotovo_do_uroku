import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const materials = JSON.parse(
  await fs.readFile(path.join(root, "data", "materials.json"), "utf8"),
);
const telegramLinks = JSON.parse(
  await fs.readFile(path.join(root, "data", "telegram-links.json"), "utf8"),
);
const errors = [];
const slugs = new Set();

for (const material of materials) {
  if (!material.id || !material.slug || !material.title) {
    errors.push(`Неповний базовий запис: ${material.id || "без id"}`);
  }
  if (slugs.has(material.slug)) errors.push(`Дубльований slug: ${material.slug}`);
  slugs.add(material.slug);
  if (!/^https:\/\/vseosvita\.ua\/library\//.test(material.vseosvitaUrl)) {
    errors.push(`Некоректне посилання Всеосвіти: ${material.slug}`);
  }
  if (material.previewStatus === "local") {
    const localPath = path.join(
      root,
      "public",
      material.coverImage.replace(/^\//, ""),
    );
    try {
      await fs.access(localPath);
    } catch {
      errors.push(`Немає локального прев’ю: ${material.slug}`);
    }
  }
}

if (!materials.length) errors.push("Каталог порожній.");
for (const [slug, telegramUrl] of Object.entries(telegramLinks)) {
  if (!slugs.has(slug)) {
    errors.push(`Telegram-посилання має невідомий slug: ${slug}`);
  }
  if (
    !/^https:\/\/t\.me\/gotovo_do_uroku\/\d+$/.test(
      telegramUrl,
    )
  ) {
    errors.push(`Некоректне пряме Telegram-посилання: ${slug}`);
  }
}

if (errors.length) {
  console.error(errors.join("\n"));
  process.exitCode = 1;
} else {
  console.log(
    `Каталог перевірено: ${materials.length} матеріалів, ${Object.keys(telegramLinks).length} прямих Telegram-посилань, помилок немає.`,
  );
}
