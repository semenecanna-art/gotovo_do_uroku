import fs from "node:fs/promises";
import path from "node:path";

const root = process.cwd();
const links = JSON.parse(
  await fs.readFile(path.join(root, "data", "telegram-links.json"), "utf8"),
);
const urls = [...new Set(Object.values(links))];
const bad = [];
let index = 0;

const verify = async (url) => {
  let lastError = "";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(`${url}?embed=1&mode=tme`, {
        headers: { "user-agent": "Mozilla/5.0" },
      });
      const html = await response.text();
      if (response.ok && html.includes("tgme_widget_message")) return;
      lastError = `HTTP ${response.status}`;
    } catch (error) {
      lastError = error instanceof Error ? error.message : String(error);
    }
    if (attempt < 3) {
      await new Promise((resolve) => setTimeout(resolve, attempt * 350));
    }
  }
  bad.push({ url, error: lastError });
};

const worker = async () => {
  while (index < urls.length) {
    const url = urls[index];
    index += 1;
    await verify(url);
  }
};

await Promise.all(Array.from({ length: 12 }, worker));

console.log(
  JSON.stringify(
    {
      materials: Object.keys(links).length,
      uniqueTelegramPosts: urls.length,
      unavailable: bad,
    },
    null,
    2,
  ),
);

if (bad.length) process.exitCode = 1;
