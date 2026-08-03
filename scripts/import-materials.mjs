import { load } from "cheerio";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";
import sharp from "sharp";

const ROOT = process.cwd();
const LIBRARY_URL = "https://vseosvita.ua/user/id9131/library";
const TELEGRAM_URL = "https://t.me/gotovo_do_uroku";
const OUTPUT_FILE = path.join(ROOT, "data", "materials.json");
const REPORT_FILE = path.join(ROOT, "data", "import-report.json");
const MATERIALS_DIR = path.join(ROOT, "public", "materials");
const SOURCE_DIR = path.join(ROOT, "source-previews");
const USER_AGENT =
  "Mozilla/5.0 (compatible; GotovoDoUrokuCatalog/1.0; public metadata importer)";

const clean = (value = "") => value.replace(/\s+/g, " ").trim();
const numberFrom = (value = "") =>
  Number.parseInt(value.replace(/[^\d]/g, ""), 10) || 0;
const absoluteUrl = (value = "") => {
  try {
    return new URL(value, "https://vseosvita.ua").href;
  } catch {
    return "";
  }
};

const slugify = (title, id) => {
  const translit = new Map(
    Object.entries({
      а: "a",
      б: "b",
      в: "v",
      г: "h",
      ґ: "g",
      д: "d",
      е: "e",
      є: "ye",
      ж: "zh",
      з: "z",
      и: "y",
      і: "i",
      ї: "yi",
      й: "i",
      к: "k",
      л: "l",
      м: "m",
      н: "n",
      о: "o",
      п: "p",
      р: "r",
      с: "s",
      т: "t",
      у: "u",
      ф: "f",
      х: "kh",
      ц: "ts",
      ч: "ch",
      ш: "sh",
      щ: "shch",
      ь: "",
      ю: "yu",
      я: "ya",
    }),
  );
  const source = title
    .toLowerCase()
    .split("")
    .map((char) => translit.get(char) ?? char)
    .join("");
  const base = source
    .replace(/['’"`]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 82);
  return `${base || "material"}-${id}`;
};

const categoryFrom = (material) => {
  const value =
    `${material.title} ${material.subject} ${material.materialType}`.toLowerCase();
  if (/перш(ий|ого) (день|урок)|1 вересня|шкільн(ий|ого) старт/.test(value)) {
    return "Перший урок";
  }
  if (/читан|літератур/.test(value)) return "Читання";
  if (/українськ|мовн|грамот|сл(о|і)в|реченн|алфавіт/.test(value)) {
    return "Українська мова";
  }
  if (/математ|росток|лічб|числ/.test(value)) return "Математика";
  if (/я досліджую світ|ядс|природ|довкіл/.test(value)) {
    return "Я досліджую світ";
  }
  if (/оформлен|класн(ої|ого)|куточок|банер|декор/.test(value)) {
    return "Оформлення класу";
  }
  if (/картк|гра|ігров|wordwall/.test(value)) return "Картки та ігри";
  if (/плакат|наочн/.test(value)) return "Наочність";
  if (/презентац/.test(value)) return "Презентації";
  if (/комплект|набір|добірк/.test(value)) return "Тематичні комплекти";
  return material.subject || "Інші матеріали";
};

async function fetchText(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: {
        "user-agent": USER_AGENT,
        accept: "text/html,application/xhtml+xml",
      },
      signal: AbortSignal.timeout(30_000),
    });
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    return await response.text();
  } catch (error) {
    if (attempt >= 4) throw error;
    await new Promise((resolve) => setTimeout(resolve, 700 * attempt));
    return fetchText(url, attempt + 1);
  }
}

async function fetchBuffer(url, attempt = 1) {
  try {
    const response = await fetch(url, {
      headers: { "user-agent": USER_AGENT, accept: "image/*" },
      signal: AbortSignal.timeout(45_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return Buffer.from(await response.arrayBuffer());
  } catch (error) {
    if (attempt >= 3) throw error;
    await new Promise((resolve) => setTimeout(resolve, 900 * attempt));
    return fetchBuffer(url, attempt + 1);
  }
}

function parseLibraryPage(html, pageIndex) {
  const $ = load(html);
  const items = [];

  $(".body_list-view .lib-items__row > .lib-item[data-key]").each(
    (_, outer) => {
      const wrapper = $(outer);
      const card = wrapper.children(".lib-item").first();
      const id = clean(wrapper.attr("data-key"));
      const titleLink = card.find(".lib-title a").first();
      const title = clean(titleLink.text());
      const vseosvitaUrl = absoluteUrl(titleLink.attr("href"));
      if (!id || !title || !vseosvitaUrl) return;

      const previewUrl = absoluteUrl(
        card.find(".library__thumbnail img").first().attr("data-src"),
      );
      const priceText = clean(card.find(".new-price").first().text());
      const subject = clean(card.find(".n-lesson .text-lib-item").first().text());
      const grade = clean(
        card.find(".vo-lib_i.cap").first().parent().find(".text-item").text(),
      );
      const materialType = clean(
        card.find(".vo-lib_i.list").first().parent().text(),
      );

      items.push({
        id,
        slug: slugify(title, id),
        title,
        shortDescription: clean(
          card.find(".text-highlights").first().text(),
        ),
        subject,
        grade,
        materialType,
        fileFormat: clean(card.find(".v-doc-icon").first().text()).toUpperCase(),
        previewUrl,
        vseosvitaUrl,
        isFree: !priceText,
        price: priceText,
        views: numberFrom(
          card.find('[title="Кількість переглядів"] b').first().text(),
        ),
        downloads: numberFrom(
          card.find('[title="Кількість завантажень"] b').first().text(),
        ),
        sourcePage: pageIndex,
      });
    },
  );

  const paginationText = clean(
    $(".library-list-view .pagination").first().text(),
  );
  const pageCount =
    numberFrom(paginationText.match(/з\s+(\d+)/i)?.[1] ?? "") || 1;
  return { items, pageCount };
}

function parseDetailPage(html) {
  const $ = load(html);
  const meta = (property) =>
    clean(
      $(`meta[property="${property}"], meta[name="${property}"]`)
        .first()
        .attr("content"),
    );
  const gallery = [];

  $(".vr-doc-preview img").each((_, image) => {
    const srcset = $(image).attr("data-srcset") ?? "";
    const highResolution =
      srcset
        .split(",")
        .map((part) => part.trim().split(/\s+/)[0])
        .find((url) => /-0x0\./.test(url)) ??
      $(image).attr("data-src") ??
      "";
    const normalized = absoluteUrl(highResolution);
    if (normalized && !gallery.includes(normalized)) gallery.push(normalized);
  });

  const pageText = clean(
    $(".lib-inside-title")
      .filter((_, element) => /показано/i.test($(element).text()))
      .first()
      .text(),
  );
  const pageMatch = pageText.match(/з\s+(\d+)\s+(?:сторінок|слайдів)/i);
  const keywords = meta("keywords")
    .split(",")
    .map(clean)
    .filter(Boolean);

  return {
    fullDescription: meta("og:description") || meta("description"),
    createdAt: meta("og:article:published_time"),
    ogImage: absoluteUrl(meta("og:image")),
    ogWidth: numberFrom(meta("og:image:width")),
    ogHeight: numberFrom(meta("og:image:height")),
    pagesCount: pageMatch ? numberFrom(pageMatch[1]) : null,
    gallery,
    keywords,
  };
}

async function inBatches(items, concurrency, worker) {
  let cursor = 0;
  const results = new Array(items.length);
  const runners = Array.from({ length: concurrency }, async () => {
    while (true) {
      const index = cursor++;
      if (index >= items.length) break;
      results[index] = await worker(items[index], index);
    }
  });
  await Promise.all(runners);
  return results;
}

async function saveCover(material, sourceUrl) {
  const publicDir = path.join(MATERIALS_DIR, material.slug);
  const sourceDir = path.join(SOURCE_DIR, material.slug);
  const webPath = `/materials/${material.slug}/cover.webp`;
  const publicFile = path.join(publicDir, "cover.webp");

  try {
    await fs.access(publicFile);
    return { coverImage: webPath, status: "local" };
  } catch {
    // Файл ще не імпортовано.
  }

  if (!sourceUrl) {
    return { coverImage: "", status: "fallback" };
  }

  const buffer = await fetchBuffer(sourceUrl);
  await fs.mkdir(publicDir, { recursive: true });
  await fs.mkdir(sourceDir, { recursive: true });
  const extension =
    new URL(sourceUrl).pathname.match(/\.(png|jpe?g|webp)$/i)?.[1] ?? "img";
  await fs.writeFile(path.join(sourceDir, `original.${extension}`), buffer);
  await sharp(buffer)
    .rotate()
    .resize({
      width: 1080,
      height: 1080,
      fit: "inside",
      withoutEnlargement: true,
    })
    .webp({ quality: 80, effort: 5 })
    .toFile(publicFile);

  return { coverImage: webPath, status: "local" };
}

async function main() {
  await fs.mkdir(path.dirname(OUTPUT_FILE), { recursive: true });
  await fs.mkdir(MATERIALS_DIR, { recursive: true });
  await fs.mkdir(SOURCE_DIR, { recursive: true });

  console.log("Перевіряю публічні сторінки бібліотеки…");
  const firstHtml = await fetchText(LIBRARY_URL);
  const first = parseLibraryPage(firstHtml, 1);
  const pageResults = [first];

  for (let page = 2; page <= first.pageCount; page += 1) {
    const html = await fetchText(`${LIBRARY_URL}?page=${page}`);
    const result = parseLibraryPage(html, page);
    pageResults.push(result);
    console.log(`Сторінка ${page}/${first.pageCount}: ${result.items.length} матеріалів`);
  }

  const unique = new Map();
  for (const { items } of pageResults) {
    for (const item of items) unique.set(item.id, item);
  }
  const cards = Array.from(unique.values());
  console.log(`Знайдено унікальних матеріалів: ${cards.length}`);

  const failedUrls = [];
  const withDetails = await inBatches(cards, 6, async (card, index) => {
    try {
      const detailHtml = await fetchText(card.vseosvitaUrl);
      const detail = parseDetailPage(detailHtml);
      if ((index + 1) % 25 === 0 || index + 1 === cards.length) {
        console.log(`Опрацьовано сторінок матеріалів: ${index + 1}/${cards.length}`);
      }
      return { ...card, ...detail };
    } catch (error) {
      failedUrls.push({
        url: card.vseosvitaUrl,
        reason: error instanceof Error ? error.message : String(error),
      });
      return {
        ...card,
        fullDescription: card.shortDescription,
        createdAt: "",
        ogImage: "",
        ogWidth: 0,
        ogHeight: 0,
        pagesCount: null,
        gallery: [],
        keywords: [],
      };
    }
  });

  const materials = await inBatches(withDetails, 5, async (item, index) => {
    const sourceImage = item.ogImage || item.previewUrl;
    let cover = { coverImage: "", status: "fallback" };
    try {
      cover = await saveCover(item, sourceImage);
    } catch (error) {
      failedUrls.push({
        url: sourceImage,
        reason: error instanceof Error ? error.message : String(error),
      });
      if (sourceImage) {
        cover = { coverImage: sourceImage, status: "remote" };
      }
    }

    if ((index + 1) % 50 === 0 || index + 1 === withDetails.length) {
      console.log(`Підготовлено прев’ю: ${index + 1}/${withDetails.length}`);
    }

    const material = {
      id: item.id,
      slug: item.slug,
      title: item.title,
      shortDescription:
        item.shortDescription ||
        item.fullDescription.slice(0, 220) ||
        "Опис матеріалу доступний на сторінці авторки у бібліотеці «Всеосвіта».",
      fullDescription:
        item.fullDescription ||
        item.shortDescription ||
        "Докладний опис матеріалу доступний на сторінці авторки у бібліотеці «Всеосвіта».",
      category: "",
      subject: item.subject,
      grade: item.grade,
      materialType: item.materialType,
      fileFormat: item.fileFormat,
      pagesCount: item.pagesCount,
      coverImage: cover.coverImage,
      images: [
        cover.coverImage,
        ...item.gallery.filter((url) => url !== sourceImage),
      ].filter(Boolean),
      imageAlt: `Прев’ю матеріалу «${item.title}»`,
      imageAspectRatio:
        item.ogWidth && item.ogHeight
          ? `${item.ogWidth}/${item.ogHeight}`
          : "1200/630",
      ogImage: cover.coverImage || sourceImage,
      tags: Array.from(new Set(item.keywords)).slice(0, 20),
      isFree: item.isFree,
      isFeatured: false,
      isNew: item.sourcePage === 1,
      isPopular: false,
      vseosvitaUrl: item.vseosvitaUrl,
      telegramUrl: TELEGRAM_URL,
      createdAt: item.createdAt,
      price: item.price,
      views: item.views,
      downloads: item.downloads,
      imageSource: "vseosvita",
      imageSourceUrl: sourceImage,
      previewStatus: cover.status,
      needsReview:
        !item.subject ||
        !item.grade ||
        !item.materialType ||
        !item.fullDescription,
    };
    material.category = categoryFrom(material);
    if (cover.status === "fallback") material.imageSource = "fallback";
    return material;
  });

  const ranked = [...materials].sort(
    (a, b) => b.views + b.downloads * 3 - (a.views + a.downloads * 3),
  );
  new Set(ranked.slice(0, 12).map((item) => item.id)).forEach((id) => {
    const material = materials.find((item) => item.id === id);
    if (material) material.isPopular = true;
  });
  new Set(ranked.slice(0, 8).map((item) => item.id)).forEach((id) => {
    const material = materials.find((item) => item.id === id);
    if (material) material.isFeatured = true;
  });

  await fs.writeFile(OUTPUT_FILE, `${JSON.stringify(materials, null, 2)}\n`);
  const report = {
    checkedPages: pageResults.length,
    foundMaterials: cards.length,
    createdCards: materials.length,
    localPreviews: materials.filter((item) => item.previewStatus === "local")
      .length,
    remotePreviews: materials.filter((item) => item.previewStatus === "remote")
      .length,
    fallbackPreviews: materials.filter(
      (item) => item.previewStatus === "fallback",
    ).length,
    detailsWithGallery: materials.filter((item) => item.images.length > 1)
      .length,
    needsReview: materials.filter((item) => item.needsReview).length,
    failedUrls,
    generatedAt: new Date().toISOString(),
  };
  await fs.writeFile(REPORT_FILE, `${JSON.stringify(report, null, 2)}\n`);
  console.log("Імпорт завершено.");
  console.log(JSON.stringify(report, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
