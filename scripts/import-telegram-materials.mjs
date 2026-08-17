import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import * as cheerio from "cheerio";
import sharp from "sharp";

const root = process.cwd();
const materialsFile = path.join(root, "data", "materials.json");
const linksFile = path.join(root, "data", "telegram-links.json");
const reportFile = path.join(root, "test-results", "telegram-link-report.json");
const channelUrl = "https://t.me/gotovo_do_uroku";
const minimumContextPostId = 2580;

const overrides = new Map([
  [2580, { title: "Геометричний конструктор «Збери картинку»", grade: "1–2 клас", subject: "математика", materialType: "Дидактична гра" }],
  [2597, { title: "Велика веселка чисел. Склад чисел 2–10", grade: "1 клас", subject: "математика", materialType: "Наочність" }],
  [2612, { title: "«Мова гідності» для 1 класу — оформлення на дошку", grade: "1 клас", subject: "виховна робота", materialType: "Оформлення класу" }],
  [2619, { title: "«Збери слово» — складові соти", grade: "1 клас", subject: "українська мова", materialType: "Дидактична гра" }],
  [2626, { title: "Великий числовий водоспад 1–100", grade: "1–2 клас", subject: "математика", materialType: "Наочність" }],
  [2633, { title: "Календар погоди — колесо та елементи для вирізання", grade: "1–4 клас", subject: "я досліджую світ", materialType: "Наочність" }],
  [2637, { title: "«Мова гідності» для 2 класу — патріотична квітка", grade: "2 клас", subject: "виховна робота", materialType: "Оформлення класу" }],
  [2655, { title: "Осіння серія «ТВОРИМО» — 9 творчих шаблонів", grade: "1–4 клас", subject: "дизайн і технології", materialType: "Шаблони для творчості" }],
  [2666, { title: "«Ланцюг обчислень» для 2–3 класу", grade: "2–3 клас", subject: "математика", materialType: "Дидактична гра" }],
  [2682, { title: "Парасолька підтримки «Як ти?»", grade: "1–4 клас", subject: "виховна робота", materialType: "Оформлення класу" }],
  [2694, { title: "Ключі до хорошого навчального року", grade: "1–4 клас", subject: "виховна робота", materialType: "Оформлення класу" }],
]);

const standaloneGroups = [
  {
    sourceId: 2653,
    groupPostIds: [2653],
    title: "Майстерня винахідника",
    grade: "1–4 клас",
    subject: "дизайн і технології",
    materialType: "Робочий аркуш",
    description:
      "Творчий аркуш «Майстерня винахідника» для дитячих ідей, ескізів і власних винаходів. Матеріал можна безкоштовно переглянути та завантажити в Telegram.",
  },
  {
    sourceId: 2672,
    groupPostIds: [2672, 2674, 2678],
    title: "«Мова гідності» для 3–4 класів — оформлення на дошку",
    grade: "3–4 клас",
    subject: "виховна робота",
    materialType: "Оформлення класу",
    description:
      "Готове оформлення на дошку до заняття «Мова гідності» для 3–4 класів. У Telegram доступні файли для друку, перегляду та завантаження.",
  },
];

const clean = (value = "") => String(value).replace(/\s+/g, " ").trim();
const escapeXml = (value = "") =>
  String(value)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");

const slugify = (title, id) => {
  const letters = {
    а: "a", б: "b", в: "v", г: "h", ґ: "g", д: "d", е: "e", є: "ye",
    ж: "zh", з: "z", и: "y", і: "i", ї: "yi", й: "i", к: "k", л: "l",
    м: "m", н: "n", о: "o", п: "p", р: "r", с: "s", т: "t", у: "u",
    ф: "f", х: "kh", ц: "ts", ч: "ch", ш: "sh", щ: "shch", ь: "",
    ю: "yu", я: "ya",
  };
  const base = title
    .toLocaleLowerCase("uk-UA")
    .split("")
    .map((letter) => letters[letter] ?? letter)
    .join("")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 78);
  return `${base || "material"}-telegram-${id}`;
};

const descriptionFrom = (value, fallback) => {
  const normalized = clean(value)
    .split(/(?:🌐|📌\s*Всеосвіта|#\p{L})/u)[0]
    .trim();
  return normalized.length >= 40 ? normalized : fallback;
};

const shortFrom = (value) =>
  value.length <= 220 ? value : `${value.slice(0, 217).trimEnd()}…`;

const wrapTitle = (value, max = 31) => {
  const words = value.split(/\s+/);
  const lines = [];
  let line = "";
  for (const word of words) {
    if (!line || `${line} ${word}`.length <= max) {
      line = line ? `${line} ${word}` : word;
      continue;
    }
    lines.push(line);
    line = word;
  }
  if (line) lines.push(line);
  if (lines.length <= 3) return lines;
  return [...lines.slice(0, 2), `${lines.slice(2).join(" ").slice(0, max - 1)}…`];
};

const fetchPostMeta = async (postId) => {
  const response = await fetch(`${channelUrl}/${postId}?embed=1&mode=tme`, {
    headers: { "user-agent": "Mozilla/5.0" },
  });
  if (!response.ok) throw new Error(`Telegram HTTP ${response.status}: ${postId}`);
  const $ = cheerio.load(await response.text());
  const style = $(".tgme_widget_message_photo_wrap").attr("style") || "";
  const photoUrl = style.match(/url\(['"]?([^'")]+)['"]?\)/i)?.[1] || "";
  return {
    datetime: $("time").attr("datetime") || "",
    photoUrl,
  };
};

const renderCover = async ({ slug, title, grade, subject, sourceId }) => {
  const folder = path.join(root, "public", "materials", slug);
  const file = path.join(folder, "cover.webp");
  await fs.mkdir(folder, { recursive: true });
  let meta = { datetime: "", photoUrl: "" };
  try {
    meta = await fetchPostMeta(sourceId);
  } catch {
    // The generated branded cover remains a reliable fallback.
  }

  const watermark = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <rect x="820" y="566" width="330" height="40" rx="20" fill="#ffffff" fill-opacity="0.86"/>
      <text x="985" y="592" text-anchor="middle" font-family="Arial, sans-serif" font-size="22" font-weight="700" fill="#6b2bbf">gotovo_do_uroku</text>
    </svg>`);

  if (meta.photoUrl) {
    try {
      const response = await fetch(meta.photoUrl, { headers: { "user-agent": "Mozilla/5.0" } });
      if (!response.ok) throw new Error(`Cover HTTP ${response.status}`);
      const source = Buffer.from(await response.arrayBuffer());
      await sharp(source)
        .rotate()
        .resize(1200, 630, { fit: "cover", position: "attention" })
        .composite([{ input: watermark }])
        .webp({ quality: 82, effort: 5 })
        .toFile(file);
      return { datetime: meta.datetime, sourceUrl: meta.photoUrl, generated: false };
    } catch {
      // Fall through to the branded text cover.
    }
  }

  const lines = wrapTitle(title);
  const titleMarkup = lines
    .map((line, index) => `<text x="600" y="${295 + index * 74}" text-anchor="middle" font-family="Arial, sans-serif" font-size="58" font-weight="800" fill="#ffffff">${escapeXml(line)}</text>`)
    .join("");
  const svg = Buffer.from(`
    <svg width="1200" height="630" xmlns="http://www.w3.org/2000/svg">
      <defs>
        <linearGradient id="bg" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stop-color="#ff2b91"/>
          <stop offset="0.52" stop-color="#8c38d8"/>
          <stop offset="1" stop-color="#125fdd"/>
        </linearGradient>
        <filter id="shadow"><feDropShadow dx="0" dy="8" stdDeviation="9" flood-opacity="0.22"/></filter>
      </defs>
      <rect width="1200" height="630" rx="36" fill="url(#bg)"/>
      <circle cx="88" cy="92" r="58" fill="#ffd332" fill-opacity="0.95"/>
      <circle cx="1090" cy="120" r="82" fill="#ff91c7" fill-opacity="0.42"/>
      <circle cx="1060" cy="520" r="128" fill="#25c7ff" fill-opacity="0.25"/>
      <path d="M30 500 C230 380 260 610 480 505 S820 430 1170 545" fill="none" stroke="#ffffff" stroke-opacity="0.22" stroke-width="18"/>
      <rect x="392" y="62" width="416" height="58" rx="29" fill="#ffffff" fill-opacity="0.93"/>
      <text x="600" y="100" text-anchor="middle" font-family="Arial, sans-serif" font-size="27" font-weight="800" fill="#e71879">НОВИНКА З TELEGRAM</text>
      <g filter="url(#shadow)">${titleMarkup}</g>
      <rect x="370" y="512" width="460" height="54" rx="27" fill="#ffffff" fill-opacity="0.93"/>
      <text x="600" y="547" text-anchor="middle" font-family="Arial, sans-serif" font-size="24" font-weight="700" fill="#172a61">${escapeXml([grade, subject].filter(Boolean).join(" • "))}</text>
      <text x="1138" y="602" text-anchor="end" font-family="Arial, sans-serif" font-size="20" font-weight="700" fill="#ffffff" fill-opacity="0.9">gotovo_do_uroku</text>
    </svg>`);
  await sharp(svg).webp({ quality: 84, effort: 5 }).toFile(file);
  return { datetime: meta.datetime, sourceUrl: `${channelUrl}/${sourceId}`, generated: true };
};

const titleFromContext = (context) => {
  const quoted = context.match(/«([^»]{4,90})»/u)?.[1];
  if (quoted) return `«${quoted}»`;
  return clean(context)
    .replace(/^[^\p{L}\p{N}]+/u, "")
    .split(/[.!?]/u)[0]
    .slice(0, 100)
    .trim();
};

const inferGrade = (value) =>
  value.match(/([1-4])\s*[–-]\s*([1-4])\s*клас/iu)?.[0]?.replace(/\s+/g, " ") ||
  value.match(/([1-4])\s*клас/iu)?.[0]?.replace(/\s+/g, " ") ||
  "1–4 клас";

const inferSubject = (value) => {
  const normalized = value.toLocaleLowerCase("uk-UA");
  if (/чис|обчис|математ|дроб|геометр/.test(normalized)) return "математика";
  if (/слово|склад|реченн|читан|мов/.test(normalized)) return "українська мова";
  if (/погод|природ/.test(normalized)) return "я досліджую світ";
  if (/твор|виріз|аплікац|шаблон/.test(normalized)) return "дизайн і технології";
  return "виховна робота";
};

const materials = JSON.parse(await fs.readFile(materialsFile, "utf8"));
const telegramLinks = JSON.parse(await fs.readFile(linksFile, "utf8"));
const report = JSON.parse(await fs.readFile(reportFile, "utf8"));
const existingIds = new Set(materials.map((material) => material.id));
const existingSourceIds = new Set(
  materials
    .map((material) => Number(material.telegramSourcePostId))
    .filter(Number.isFinite),
);

const reservedGroupPosts = new Set(
  standaloneGroups.flatMap((candidate) => candidate.groupPostIds),
);
const grouped = new Map();
for (const group of report.groups) {
  if (group.selected?.length || group.directPostId < minimumContextPostId) continue;
  if (reservedGroupPosts.has(group.directPostId)) continue;
  const contextId = Number(group.contextPostId);
  if (!Number.isFinite(contextId) || contextId < minimumContextPostId) continue;
  if (!grouped.has(contextId)) grouped.set(contextId, []);
  grouped.get(contextId).push(group);
}

const candidates = [];
for (const [sourceId, groups] of grouped) {
  const context = clean(groups[0]?.context || "");
  if (context.length < 40) continue;
  const override = overrides.get(sourceId) || {};
  const preferred =
    groups.find((group) => group.documents.some((file) => /\.zip$/i.test(file))) ||
    groups[0];
  candidates.push({
    sourceId,
    groupPostIds: groups.map((group) => group.directPostId),
    directPostId: preferred.directPostId,
    documents: groups.flatMap((group) => group.documents),
    context,
    title: override.title || titleFromContext(context),
    grade: override.grade || inferGrade(context),
    subject: override.subject || inferSubject(context),
    materialType: override.materialType || "Дидактичний матеріал",
  });
}

for (const standalone of standaloneGroups) {
  const groups = report.groups.filter((group) =>
    standalone.groupPostIds.includes(group.directPostId),
  );
  if (!groups.length) continue;
  candidates.push({
    ...standalone,
    directPostId: standalone.sourceId,
    documents: groups.flatMap((group) => group.documents),
    context: standalone.description,
  });
}

const added = [];
for (const candidate of candidates.sort((left, right) => left.sourceId - right.sourceId)) {
  const id = `telegram-${candidate.sourceId}`;
  if (existingIds.has(id) || existingSourceIds.has(candidate.sourceId)) continue;
  const slug = slugify(candidate.title, candidate.sourceId);
  const description = descriptionFrom(
    candidate.context,
    candidate.description || `Матеріал «${candidate.title}» доступний для безкоштовного перегляду та завантаження в Telegram.`,
  );
  const cover = await renderCover({ ...candidate, slug });
  const extensions = [...new Set(candidate.documents.map((file) => path.extname(file).slice(1).toUpperCase()).filter(Boolean))];
  const printableFiles = candidate.documents.filter((file) => /\.(png|jpe?g|pdf)$/i.test(file));
  const telegramUrl = `${channelUrl}/${candidate.directPostId}`;
  const material = {
    id,
    slug,
    title: candidate.title,
    shortDescription: shortFrom(description),
    fullDescription: description,
    category: candidate.materialType === "Оформлення класу" ? "Оформлення класу" : candidate.subject,
    subject: candidate.subject,
    grade: candidate.grade,
    materialType: candidate.materialType,
    fileFormat: extensions.join(", ") || "Файл",
    pagesCount: printableFiles.length || null,
    coverImage: `/materials/${slug}/cover.webp`,
    images: [`/materials/${slug}/cover.webp`],
    imageAlt: `Прев’ю матеріалу «${candidate.title}»`,
    imageAspectRatio: "1200/630",
    ogImage: `/materials/${slug}/cover.webp`,
    tags: [...new Set([candidate.grade, candidate.subject, candidate.materialType, "Telegram", "безкоштовно"].filter(Boolean))],
    isFree: true,
    isFeatured: false,
    isNew: true,
    isPopular: false,
    vseosvitaUrl: "",
    telegramUrl,
    createdAt: cover.datetime || new Date().toISOString(),
    price: "Безкоштовно",
    views: 0,
    downloads: 0,
    imageSource: cover.generated ? "fallback" : "provided",
    imageSourceUrl: cover.sourceUrl,
    previewStatus: "local",
    needsReview: false,
    telegramSourcePostId: candidate.sourceId,
    telegramFilePostIds: candidate.groupPostIds,
  };
  materials.push(material);
  telegramLinks[slug] = telegramUrl;
  existingIds.add(id);
  existingSourceIds.add(candidate.sourceId);
  added.push({ title: candidate.title, telegramUrl });
}

materials.sort((left, right) => {
  const dateDifference = (Date.parse(right.createdAt) || 0) - (Date.parse(left.createdAt) || 0);
  return dateDifference || String(right.id).localeCompare(String(left.id), "uk");
});
const sortedLinks = Object.fromEntries(
  Object.entries(telegramLinks).sort(([left], [right]) => left.localeCompare(right, "uk")),
);
await fs.writeFile(materialsFile, `${JSON.stringify(materials, null, 2)}\n`);
await fs.writeFile(linksFile, `${JSON.stringify(sortedLinks, null, 2)}\n`);

console.log(
  JSON.stringify(
    {
      scannedCandidates: candidates.length,
      addedTelegramMaterials: added.length,
      totalMaterials: materials.length,
      added,
    },
    null,
    2,
  ),
);
