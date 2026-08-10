import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import * as cheerio from "cheerio";

const CHANNEL = "gotovo_do_uroku";
const CHANNEL_URL = `https://t.me/${CHANNEL}`;
const CATALOG_POST_IDS = [
  2065, 2066, 2067, 2068, 2069, 2070, 2071, 2072, 2073, 2074, 2075,
];
const WRITE = process.argv.includes("--write");
const root = process.cwd();

const normalize = (value) =>
  String(value || "")
    .toLocaleLowerCase("uk-UA")
    .normalize("NFC")
    .replace(/[’'`ʼ]/g, "")
    .replace(/[^\p{L}\p{N}]+/gu, " ")
    .replace(/\s+/g, " ")
    .trim();

const stopWords = new Set([
  "для",
  "та",
  "і",
  "й",
  "з",
  "із",
  "зі",
  "у",
  "в",
  "на",
  "до",
  "про",
  "як",
  "чи",
  "що",
  "це",
  "за",
  "від",
  "по",
  "під",
  "над",
  "біля",
  "або",
  "його",
  "її",
  "їх",
  "клас",
  "класу",
  "класи",
  "класів",
  "матеріал",
  "матеріали",
  "комплект",
  "набір",
  "готовий",
  "готова",
  "готове",
  "учнів",
  "початкової",
  "школи",
  "нуш",
]);

const tokenize = (value) =>
  normalize(value)
    .split(" ")
    .filter(
      (token) =>
        token &&
        !stopWords.has(token) &&
        (token.length >= 2 || /^\d+$/.test(token)),
    );

const trigrams = (value) => {
  const normalized = `  ${normalize(value)} `;
  const result = [];
  for (let index = 0; index < normalized.length - 2; index += 1) {
    result.push(normalized.slice(index, index + 3));
  }
  return result;
};

const dice = (left, right) => {
  const leftParts = trigrams(left);
  const rightParts = trigrams(right);
  const counts = new Map();
  for (const part of leftParts) counts.set(part, (counts.get(part) || 0) + 1);
  let intersection = 0;
  for (const part of rightParts) {
    const count = counts.get(part) || 0;
    if (!count) continue;
    intersection += 1;
    counts.set(part, count - 1);
  }
  return leftParts.length + rightParts.length
    ? (2 * intersection) / (leftParts.length + rightParts.length)
    : 0;
};

const fetchHtml = async (url) => {
  let lastError;
  for (let attempt = 1; attempt <= 3; attempt += 1) {
    try {
      const response = await fetch(url, {
        headers: { "user-agent": "Mozilla/5.0" },
      });
      if (!response.ok) throw new Error(`HTTP ${response.status}: ${url}`);
      return await response.text();
    } catch (error) {
      lastError = error;
      if (attempt < 3) {
        await new Promise((resolve) => setTimeout(resolve, attempt * 500));
      }
    }
  }
  throw lastError;
};

const parsePosts = (html) => {
  const $ = cheerio.load(html);
  return $(".tgme_widget_message")
    .map((_, element) => {
      const post = $(element).attr("data-post") || "";
      const id = Number(post.split("/").pop());
      return {
        id,
        url: `${CHANNEL_URL}/${id}`,
        text: $(element)
          .find(".tgme_widget_message_text")
          .text()
          .replace(/\s+/g, " ")
          .trim(),
        documents: $(element)
          .find(".tgme_widget_message_document_title")
          .map((__, document) => $(document).text().replace(/\s+/g, " ").trim())
          .get()
          .filter(Boolean),
        datetime: $(element).find("time").attr("datetime") || "",
      };
    })
    .get()
    .filter((post) => Number.isFinite(post.id));
};

const crawlChannel = async () => {
  const posts = new Map();
  let before = null;
  for (let page = 0; page < 180; page += 1) {
    const url = before
      ? `https://t.me/s/${CHANNEL}?before=${before}`
      : `https://t.me/s/${CHANNEL}`;
    const pagePosts = parsePosts(await fetchHtml(url));
    if (!pagePosts.length) break;
    let newPosts = 0;
    for (const post of pagePosts) {
      if (!posts.has(post.id)) newPosts += 1;
      posts.set(post.id, post);
    }
    const nextBefore = Math.min(...pagePosts.map((post) => post.id));
    if (!newPosts || nextBefore <= 1 || nextBefore === before) break;
    before = nextBefore;
    await new Promise((resolve) => setTimeout(resolve, 60));
  }
  return [...posts.values()].sort((left, right) => left.id - right.id);
};

const readNavigator = async () => {
  const entries = [];
  for (const catalogPost of CATALOG_POST_IDS) {
    const html = await fetchHtml(
      `${CHANNEL_URL}/${catalogPost}?embed=1&mode=tme`,
    );
    const $ = cheerio.load(html);
    $(".tgme_widget_message_text br").replaceWith("\n");
    const text = $(".tgme_widget_message_text").text();
    for (const line of text
      .split(/\n+/)
      .map((value) => value.trim())
      .filter(Boolean)) {
      const match = line.match(
        /^•\s*(.+?)\s+[—–-]\s+(https:\/\/t\.me\/gotovo_do_uroku\/(\d+))\s*$/u,
      );
      if (!match) continue;
      entries.push({
        catalogPost,
        label: match[1].trim(),
        href: match[2],
        targetId: Number(match[3]),
      });
    }
  }
  return entries;
};

const extractPhrases = (value) => {
  const phrases = [];
  for (const match of String(value || "").matchAll(/«([^»]{3,120})»/g)) {
    phrases.push(match[1]);
  }
  return [
    ...new Set(
      phrases
        .map((phrase) => phrase.trim())
        .filter((phrase) => tokenize(phrase).length >= 2),
    ),
  ];
};

const fileBase = (fileName) => fileName.replace(/\.[a-z0-9]+$/i, "");
const containsWholePhrase = (haystack, needle) =>
  haystack === needle ||
  haystack.startsWith(`${needle} `) ||
  haystack.endsWith(` ${needle}`) ||
  haystack.includes(` ${needle} `);

const materials = JSON.parse(
  await fs.readFile(path.join(root, "data", "materials.json"), "utf8"),
);
const existingTelegramLinks = JSON.parse(
  await fs.readFile(path.join(root, "data", "telegram-links.json"), "utf8"),
);
const posts = await crawlChannel();
const navigator = await readNavigator();
const navigatorByTarget = new Map(
  navigator.map((entry) => [entry.targetId, entry]),
);

const meaningfulTextPosts = posts.filter(
  (post) => post.text.length >= 20 && !/^https?:\/\//i.test(post.text),
);
const documentPosts = posts.filter(
  (post) =>
    post.documents.length &&
    !post.documents.every((file) => /\.(mov|mp4|webm)$/i.test(file)),
);
const grouped = new Map();

for (const post of documentPosts) {
  const postTime = Date.parse(post.datetime);
  const previousText = [...meaningfulTextPosts]
    .reverse()
    .find(
      (candidate) =>
        candidate.id < post.id &&
        postTime - Date.parse(candidate.datetime) >= 0 &&
        postTime - Date.parse(candidate.datetime) <= 30 * 60 * 1000,
    );
  const context =
    post.text.length >= 4 && !/^https?:\/\//i.test(post.text)
      ? post
      : previousText || null;
  const key = context ? `context-${context.id}` : `file-${post.id}`;
  if (!grouped.has(key)) grouped.set(key, { context, entries: [] });
  grouped.get(key).entries.push(post);
}

const documentGroups = [...grouped.values()].map((group) => {
  const directPostId = Math.min(...group.entries.map((entry) => entry.id));
  return {
    ...group,
    directPostId,
    directUrl: `${CHANNEL_URL}/${directPostId}`,
    documents: group.entries.flatMap((entry) => entry.documents),
  };
});

const documentFrequency = new Map();
for (const material of materials) {
  for (const token of new Set(tokenize(material.title))) {
    documentFrequency.set(token, (documentFrequency.get(token) || 0) + 1);
  }
}
const idf = (token) =>
  Math.log((materials.length + 1) / ((documentFrequency.get(token) || 0) + 1)) +
  1;

const weightedCoverage = (query, targetTokens) => {
  const queryTokens = [...new Set(tokenize(query))];
  const total = queryTokens.reduce((sum, token) => sum + idf(token), 0);
  const matched = queryTokens.filter((token) => targetTokens.has(token));
  return {
    coverage: total
      ? matched.reduce((sum, token) => sum + idf(token), 0) / total
      : 0,
    matched,
    rare: matched.filter((token) => idf(token) >= 3),
  };
};

const matches = [];
const groupReports = [];

for (const group of documentGroups) {
  const navigatorLabel =
    navigatorByTarget.get(group.context?.id)?.label || "";
  const contextHeader = (group.context?.text || "").slice(0, 240);
  const files = group.documents.map(fileBase);
  const filesText = files.join(" ");
  const source = `${navigatorLabel} ${contextHeader} ${filesText}`.trim();
  const sourceTokens = new Set(tokenize(source));
  const headerNormalized = normalize(`${navigatorLabel} ${contextHeader}`);
  const filesNormalized = normalize(filesText);
  const phrases = extractPhrases(
    `${navigatorLabel} ${(group.context?.text || "").slice(0, 150)}`,
  );
  const phraseCounts = new Map(
    phrases.map((phrase) => [
      phrase,
      materials.filter((material) => {
        const title = normalize(material.title);
        const normalizedPhrase = normalize(phrase);
        return (
          title.includes(normalizedPhrase) || normalizedPhrase.includes(title)
        );
      }).length,
    ]),
  );

  const ranked = materials
    .map((material) => {
      const title = normalize(material.title);
      const titleTokens = new Set(tokenize(material.title));
      const titleCoverage = weightedCoverage(material.title, sourceTokens);
      const labelCoverage = weightedCoverage(
        navigatorLabel || contextHeader.slice(0, 120),
        titleTokens,
      );
      const titleDice = dice(
        material.title,
        `${navigatorLabel} ${contextHeader.slice(
          0,
          Math.max(120, material.title.length * 2),
        )} ${filesText}`,
      );
      const exactTitle =
        title.length >= 8 &&
        tokenize(material.title).length >= 2 &&
        (headerNormalized.includes(title) || filesNormalized.includes(title));
      const fileContain = files.some((file) => {
        const normalizedFile = normalize(file);
        const fileTokens = tokenize(file);
        return (
          title.length >= 8 &&
          normalizedFile.length >= 8 &&
          (containsWholePhrase(normalizedFile, title) ||
            (fileTokens.length >= 3 &&
              normalizedFile.length / title.length >= 0.6 &&
              containsWholePhrase(title, normalizedFile)))
        );
      });
      const uniquePhrase =
        phrases.find((phrase) => {
          const normalizedPhrase = normalize(phrase);
          return (
            phraseCounts.get(phrase) === 1 &&
            (title.includes(normalizedPhrase) ||
              normalizedPhrase.includes(title))
          );
        }) || "";
      const score =
        titleCoverage.coverage * 0.48 +
        labelCoverage.coverage * 0.3 +
        titleDice * 0.22;
      const evidenceRank =
        Number(fileContain) * 3 +
        Number(exactTitle) * 2 +
        Number(Boolean(uniquePhrase)) * 1.5 +
        score;
      return {
        material,
        score,
        evidenceRank,
        titleCoverage,
        exactTitle,
        fileContain,
        uniquePhrase,
      };
    })
    .sort(
      (left, right) =>
        right.evidenceRank - left.evidenceRank ||
        right.score - left.score,
    );

  const best = ranked[0];
  const second = ranked[1];
  const selected = ranked.filter(
    (candidate) =>
      candidate.fileContain ||
      candidate.exactTitle ||
      candidate.uniquePhrase,
  );
  const fuzzyAccepted =
    !best.fileContain &&
    !best.exactTitle &&
    !best.uniquePhrase &&
    best.score >= 0.58 &&
    best.titleCoverage.coverage >= 0.55 &&
    best.titleCoverage.rare.length >= 2 &&
    best.score - second.score >= 0.04;
  if (fuzzyAccepted) selected.push(best);

  const uniqueSelected = [
    ...new Map(
      selected.map((candidate) => [candidate.material.slug, candidate]),
    ).values(),
  ];
  for (const candidate of uniqueSelected) {
    const evidence = candidate.fileContain
      ? "filename"
      : candidate.exactTitle
        ? "exact-title"
        : candidate.uniquePhrase
          ? "unique-phrase"
          : "fuzzy";
    matches.push({
      slug: candidate.material.slug,
      title: candidate.material.title,
      telegramUrl: group.directUrl,
      directPostId: group.directPostId,
      score: candidate.score,
      evidence,
      documents: group.documents,
      navigatorLabel,
      contextPostId: group.context?.id || null,
    });
  }

  groupReports.push({
    directPostId: group.directPostId,
    telegramUrl: group.directUrl,
    documents: group.documents,
    navigatorLabel,
    contextPostId: group.context?.id || null,
    context: contextHeader,
    selected: uniqueSelected.map((candidate) => ({
      slug: candidate.material.slug,
      title: candidate.material.title,
      score: Number(candidate.score.toFixed(4)),
      evidence: candidate.fileContain
        ? "filename"
        : candidate.exactTitle
          ? "exact-title"
          : candidate.uniquePhrase
            ? "unique-phrase"
            : "fuzzy",
    })),
    bestRejected:
      uniqueSelected.length === 0
        ? {
            title: best.material.title,
            score: Number(best.score.toFixed(4)),
          }
        : null,
  });
}

const duplicateTitles = new Map();
for (const material of materials) {
  const title = normalize(material.title);
  if (!duplicateTitles.has(title)) duplicateTitles.set(title, []);
  duplicateTitles.get(title).push(material);
}

for (const match of [...matches]) {
  for (const duplicate of duplicateTitles.get(normalize(match.title)) || []) {
    if (duplicate.slug === match.slug) continue;
    matches.push({ ...match, slug: duplicate.slug, title: duplicate.title });
  }
}

const evidenceWeight = {
  filename: 4,
  "exact-title": 3,
  "unique-phrase": 2,
  fuzzy: 1,
};
const bestBySlug = new Map();
for (const match of matches) {
  const current = bestBySlug.get(match.slug);
  const matchRank = evidenceWeight[match.evidence] + match.score;
  const currentRank = current
    ? evidenceWeight[current.evidence] + current.score
    : -1;
  if (
    !current ||
    matchRank > currentRank ||
    (matchRank === currentRank && match.directPostId > current.directPostId)
  ) {
    bestBySlug.set(match.slug, match);
  }
}

const materialSlugs = new Set(materials.map((material) => material.slug));
const preservedTelegramLinks = Object.fromEntries(
  Object.entries(existingTelegramLinks).filter(
    ([slug, telegramUrl]) =>
      materialSlugs.has(slug) &&
      /^https:\/\/t\.me\/gotovo_do_uroku\/\d+$/.test(
        telegramUrl,
      ),
  ),
);
const telegramLinks = Object.fromEntries(
  Object.entries({
    ...preservedTelegramLinks,
    ...Object.fromEntries(
      [...bestBySlug.values()].map((match) => [match.slug, match.telegramUrl]),
    ),
  }).sort(([left], [right]) => left.localeCompare(right, "uk")),
);
const report = {
  generatedAt: new Date().toISOString(),
  channel: CHANNEL_URL,
  channelPosts: posts.length,
  navigatorEntries: navigator.length,
  documentPosts: documentPosts.length,
  documentGroups: documentGroups.length,
  matchedMaterials: Object.keys(telegramLinks).length,
  links: [...bestBySlug.values()].sort((left, right) =>
    left.title.localeCompare(right.title, "uk"),
  ),
  groups: groupReports,
};

await fs.mkdir(path.join(root, "test-results"), { recursive: true });
await fs.writeFile(
  path.join(root, "test-results", "telegram-link-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);

if (WRITE) {
  await fs.writeFile(
    path.join(root, "data", "telegram-links.json"),
    `${JSON.stringify(telegramLinks, null, 2)}\n`,
  );
}

console.log(
  JSON.stringify(
    {
      write: WRITE,
      channelPosts: report.channelPosts,
      navigatorEntries: report.navigatorEntries,
      documentPosts: report.documentPosts,
      documentGroups: report.documentGroups,
      matchedMaterials: report.matchedMaterials,
      report: "test-results/telegram-link-report.json",
    },
    null,
    2,
  ),
);
