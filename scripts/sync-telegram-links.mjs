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
const LIVE = process.argv.includes("--live");
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

const flattenExportText = (value) =>
  (Array.isArray(value) ? value : [value])
    .map((part) =>
      typeof part === "string" ? part : typeof part?.text === "string" ? part.text : "",
    )
    .join("")
    .trim();

const findTelegramExport = async () => {
  if (process.env.TELEGRAM_EXPORT_PATH) {
    return path.resolve(process.env.TELEGRAM_EXPORT_PATH);
  }
  const exportsRoot = path.join(
    process.env.USERPROFILE || "",
    "Downloads",
    "Telegram Desktop",
  );
  let entries = [];
  try {
    entries = await fs.readdir(exportsRoot, { withFileTypes: true });
  } catch {
    return "";
  }
  const candidates = [];
  for (const entry of entries) {
    if (!entry.isDirectory() || !entry.name.startsWith("ChatExport_")) continue;
    const file = path.join(exportsRoot, entry.name, "result.json");
    try {
      candidates.push({ file, modified: (await fs.stat(file)).mtimeMs });
    } catch {
      // Ignore incomplete export folders.
    }
  }
  return candidates.sort((left, right) => right.modified - left.modified)[0]?.file || "";
};

const readTelegramExport = async () => {
  const exportPath = await findTelegramExport();
  if (!exportPath) return { posts: [], exportPath: "" };
  const exported = JSON.parse(await fs.readFile(exportPath, "utf8"));
  if (exported.type !== "public_channel" || !Array.isArray(exported.messages)) {
    throw new Error(`Unexpected Telegram export format: ${exportPath}`);
  }
  const posts = exported.messages
    .filter((message) => message.type === "message" && Number.isFinite(message.id))
    .map((message) => ({
      id: message.id,
      url: `${CHANNEL_URL}/${message.id}`,
      text: flattenExportText(message.text),
      documents:
        message.file_name && !/^(video|audio)\//i.test(message.mime_type || "")
          ? [message.file_name]
          : [],
      datetime: message.date_unixtime
        ? new Date(Number(message.date_unixtime) * 1000).toISOString()
        : message.date || "",
    }))
    .sort((left, right) => left.id - right.id);
  return { posts, exportPath };
};

const readNavigator = async (posts) => {
  const entries = [];
  for (const catalogPost of CATALOG_POST_IDS) {
    const exportedPost = posts.find((post) => post.id === catalogPost);
    let text = exportedPost?.text || "";
    if (!text) {
      const html = await fetchHtml(
        `${CHANNEL_URL}/${catalogPost}?embed=1&mode=tme`,
      );
      const $ = cheerio.load(html);
      $(".tgme_widget_message_text br").replaceWith("\n");
      text = $(".tgme_widget_message_text").text();
    }
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
const exportedChannel = LIVE
  ? { posts: [], exportPath: "" }
  : await readTelegramExport();
const posts = exportedChannel.posts.length
  ? exportedChannel.posts
  : await crawlChannel();
const telegramSource = exportedChannel.posts.length
  ? exportedChannel.exportPath
  : CHANNEL_URL;
const navigator = await readNavigator(posts);
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
  const key = `file-${post.id}`;
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

const extractVseosvitaIds = (value) =>
  [
    ...String(value || "").matchAll(
      /vseosvita\.ua\/library\/[^\s"'<>]*?-(\d+)\.html/giu,
    ),
  ].map((match) => match[1]);

const extractSeriesSignature = (value) => {
  const normalized = normalize(value);
  return {
    lesson:
      normalized.match(/(?:^| )урок\s*(\d+)(?: |$)/u)?.[1] || "",
    part:
      normalized.match(/(?:^| )(?:ч|частина)\s*\.?\s*(\d+)(?: |$)/u)?.[1] ||
      "",
  };
};

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

const materialById = new Map(
  materials.map((material) => [String(material.id), material]),
);

// A link to the exact Vseosvita material inside a Telegram post is the
// strongest possible evidence. These announcements are often text/photo
// posts rather than document posts, so they must be checked separately.
for (const post of posts) {
  for (const materialId of new Set(extractVseosvitaIds(post.text))) {
    const material = materialById.get(materialId);
    if (!material) continue;
    matches.push({
      slug: material.slug,
      title: material.title,
      telegramUrl: post.url,
      directPostId: post.id,
      score: 1,
      evidence: "vseosvita-url",
      documents: post.documents,
      navigatorLabel: "",
      contextPostId: post.id,
    });
  }
}

// Many channel publications do not contain a Vseosvita URL. Match only
// highly distinctive titles published at practically the same time as the
// material. The strict rare-token and lesson/part checks intentionally leave
// ambiguous items unmatched instead of showing a wrong Telegram button.
const datedTextPosts = meaningfulTextPosts.filter(
  (post) =>
    !CATALOG_POST_IDS.includes(post.id) &&
    post.text.length <= 3500 &&
    !/що завантажити цього тижня/iu.test(post.text),
);

for (const material of materials) {
  const materialTime = Date.parse(material.createdAt);
  if (!Number.isFinite(materialTime)) continue;
  const titleTokens = [...new Set(tokenize(material.title))];
  const rareTitleTokens = titleTokens.filter((token) => idf(token) >= 3.4);
  const materialSignature = extractSeriesSignature(material.title);
  const candidates = datedTextPosts
    .filter((post) => {
      const postTime = Date.parse(post.datetime);
      return (
        Number.isFinite(postTime) &&
        Math.abs(postTime - materialTime) <= 36 * 60 * 60 * 1000
      );
    })
    .map((post) => {
      const sourceTokens = new Set(tokenize(post.text));
      const titleCoverage = weightedCoverage(material.title, sourceTokens);
      const sourceSignature = extractSeriesSignature(post.text);
      const seriesMatches =
        (!materialSignature.lesson ||
          sourceSignature.lesson === materialSignature.lesson) &&
        (!materialSignature.part ||
          !sourceSignature.part ||
          sourceSignature.part === materialSignature.part);
      const title = normalize(material.title);
      const source = normalize(post.text);
      const exactTitle =
        title.length >= 8 && containsWholePhrase(source, title);
      const rareMatched = rareTitleTokens.filter((token) =>
        sourceTokens.has(token),
      );
      const rareMissing = rareTitleTokens.filter(
        (token) => !sourceTokens.has(token),
      );
      return {
        post,
        exactTitle,
        rareMatched,
        rareMissing,
        seriesMatches,
        titleCoverage,
      };
    })
    .sort(
      (left, right) =>
        right.titleCoverage.coverage - left.titleCoverage.coverage ||
        Math.abs(Date.parse(left.post.datetime) - materialTime) -
          Math.abs(Date.parse(right.post.datetime) - materialTime),
    );

  const best = candidates[0];
  if (!best) continue;
  const secondCoverage = candidates[1]?.titleCoverage.coverage || 0;
  const margin = best.titleCoverage.coverage - secondCoverage;
  const distinctiveMatch =
    best.rareMatched.length >= 3 && best.rareMissing.length === 0;
  const accepted =
    best.seriesMatches &&
    best.titleCoverage.coverage >= 0.78 &&
    (best.exactTitle || (distinctiveMatch && margin >= 0.08));
  if (!accepted) continue;

  matches.push({
    slug: material.slug,
    title: material.title,
    telegramUrl: best.post.url,
    directPostId: best.post.id,
    score: best.titleCoverage.coverage,
    evidence: "dated-text",
    documents: best.post.documents,
    navigatorLabel: "",
    contextPostId: best.post.id,
  });
}

for (const group of documentGroups) {
  const navigatorLabel =
    navigatorByTarget.get(group.directPostId)?.label ||
    navigatorByTarget.get(group.context?.id)?.label ||
    "";
  const contextHeader = (group.context?.text || "").slice(0, 240);
  const files = group.documents.map(fileBase);
  const filesText = files.join(" ");
  const entryText = group.entries.map((entry) => entry.text).join(" ");
  const source = `${navigatorLabel} ${contextHeader} ${entryText} ${filesText}`.trim();
  const linkedMaterialIds = new Set(
    [...source.matchAll(/vseosvita\.ua\/library\/[^\s"'<>]*?-(\d+)\.html/giu)].map(
      (match) => match[1],
    ),
  );
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
      const exactVseosvitaUrl = linkedMaterialIds.has(String(material.id));
      const score =
        titleCoverage.coverage * 0.48 +
        labelCoverage.coverage * 0.3 +
        titleDice * 0.22;
      const evidenceRank =
        Number(exactVseosvitaUrl) * 8 +
        Number(fileContain) * 3 +
        Number(exactTitle) * 2 +
        Number(Boolean(uniquePhrase)) * 1.5 +
        score;
      return {
        material,
        score,
        evidenceRank,
        titleCoverage,
        exactVseosvitaUrl,
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
      candidate.exactVseosvitaUrl ||
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
    const evidence = candidate.exactVseosvitaUrl
      ? "vseosvita-url"
      : candidate.fileContain
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
      evidence: candidate.exactVseosvitaUrl
        ? "vseosvita-url"
        : candidate.fileContain
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
  if (
    match.evidence === "vseosvita-url" ||
    match.evidence === "dated-text"
  ) {
    continue;
  }
  for (const duplicate of duplicateTitles.get(normalize(match.title)) || []) {
    if (duplicate.slug === match.slug) continue;
    matches.push({ ...match, slug: duplicate.slug, title: duplicate.title });
  }
}

const evidenceWeight = {
  "vseosvita-url": 6,
  filename: 4,
  "exact-title": 3,
  "dated-text": 2.5,
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
  source: telegramSource,
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
