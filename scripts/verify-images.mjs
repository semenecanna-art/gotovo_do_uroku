import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const root = process.cwd();
const materials = JSON.parse(
  await fs.readFile(path.join(root, "data", "materials.json"), "utf8"),
);
const imageUrls = Array.from(
  new Set(materials.flatMap((material) => material.images ?? []).filter(Boolean)),
);
const localUrls = imageUrls.filter((url) => url.startsWith("/"));
const remoteUrls = imageUrls.filter((url) => /^https:\/\//i.test(url));
const failures = [];
let checkedRemote = 0;

for (const url of localUrls) {
  const file = path.join(root, "public", url.replace(/^\/+/, ""));
  try {
    const stats = await fs.stat(file);
    if (!stats.isFile() || stats.size === 0) {
      failures.push({ url, reason: "Порожній або не є файлом" });
    }
  } catch {
    failures.push({ url, reason: "Локальний файл не знайдено" });
  }
}

const checkRemote = async (url) => {
  let lastReason = "Невідома помилка";
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 15_000);
    try {
      const response = await fetch(url, {
        method: "HEAD",
        redirect: "follow",
        signal: controller.signal,
        headers: {
          "user-agent": "Mozilla/5.0 GotovoDoUrokuImageCheck/1.0",
          accept: "image/avif,image/webp,image/apng,image/*,*/*;q=0.8",
        },
      });
      const type = response.headers.get("content-type") ?? "";
      if (response.ok && type.startsWith("image/")) return;
      lastReason = `HTTP ${response.status}; content-type: ${type || "немає"}`;
    } catch (error) {
      lastReason = error instanceof Error ? error.message : String(error);
    } finally {
      clearTimeout(timeout);
    }
  }
  failures.push({ url, reason: lastReason });
};

let cursor = 0;
const workers = Array.from({ length: 32 }, async () => {
  while (cursor < remoteUrls.length) {
    const current = cursor;
    cursor += 1;
    await checkRemote(remoteUrls[current]);
    checkedRemote += 1;
    if (checkedRemote % 500 === 0 || checkedRemote === remoteUrls.length) {
      console.log(`Перевірено віддалених зображень: ${checkedRemote}/${remoteUrls.length}`);
    }
  }
});
await Promise.all(workers);

const report = {
  materials: materials.length,
  uniqueImages: imageUrls.length,
  localImages: localUrls.length,
  remoteImages: remoteUrls.length,
  failures,
  generatedAt: new Date().toISOString(),
};

await fs.mkdir(path.join(root, "test-results"), { recursive: true });
await fs.writeFile(
  path.join(root, "test-results", "image-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify({ ...report, failures: failures.slice(0, 20) }, null, 2));
if (failures.length) process.exitCode = 1;
