import { chromium } from "playwright-core";
import fs from "node:fs/promises";
import path from "node:path";
import process from "node:process";

const baseUrl = process.env.TEST_BASE_URL ?? "http://127.0.0.1:4175";
const telegramPostPattern = /^https:\/\/t\.me\/gotovo_do_uroku\/\d+$/;
const telegramPostSelector = 'a[href^="https://t.me/gotovo_do_uroku/"]';
const chromePaths = [
  "C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Google\\Chrome\\Application\\chrome.exe",
  "C:\\Program Files (x86)\\Microsoft\\Edge\\Application\\msedge.exe",
  "C:\\Program Files\\Microsoft\\Edge\\Application\\msedge.exe",
];
const executablePath = await Promise.any(
  chromePaths.map(async (candidate) => {
    await fs.access(candidate);
    return candidate;
  }),
).catch(() => "");

if (!executablePath) {
  throw new Error("Chrome або Edge не знайдено.");
}

const outputDir = path.join(process.cwd(), "test-results");
await fs.mkdir(outputDir, { recursive: true });
const materialData = JSON.parse(
  await fs.readFile(path.join(process.cwd(), "data", "materials.json"), "utf8"),
);
const telegramLinkData = JSON.parse(
  await fs.readFile(
    path.join(process.cwd(), "data", "telegram-links.json"),
    "utf8",
  ),
);
const verifiedTelegramEntry = Object.entries(telegramLinkData).find(([slug]) =>
  materialData.some((material) => material.slug === slug),
);
const expectedNewestSlugs = [...materialData]
  .sort((first, second) => {
    const firstDate = Date.parse(first.createdAt) || 0;
    const secondDate = Date.parse(second.createdAt) || 0;
    return secondDate - firstDate || String(second.id).localeCompare(String(first.id), "uk");
  })
  .slice(0, 8)
  .map((material) => material.slug);
const browser = await chromium.launch({
  executablePath,
  headless: true,
  args: ["--disable-features=Translate"],
});
const desktop = await browser.newContext({
  viewport: { width: 1440, height: 1000 },
  deviceScaleFactor: 1,
});
const page = await desktop.newPage();
const errors = [];
const checks = [];
let testingNotFound = false;

page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
page.on("console", (message) => {
  if (message.type() === "error" && !testingNotFound) {
    errors.push(`console: ${message.text()}`);
  }
});
page.on("response", (response) => {
  if (
    response.status() >= 400 &&
    !response.url().includes("favicon") &&
    !response.url().includes("/storinka-yakoyi-nemaye/")
  ) {
    errors.push(`HTTP ${response.status()}: ${response.url()}`);
  }
});

const check = (condition, message) => {
  if (!condition) throw new Error(message);
  checks.push(message);
};

await page.goto(baseUrl, { waitUntil: "domcontentloaded", timeout: 60_000 });
await page.locator("h1").waitFor({ state: "visible", timeout: 30_000 });
check(await page.locator("h1").isVisible(), "Головний заголовок видно");
check(
  (await page.locator('img[alt*="Готово до уроку"]').count()) >= 2,
  "Логотип і бренд-банер завантажені",
);
check(
  (await page.locator(".home-materials .material-card").count()) >= 6,
  "На головній є щонайменше 6 реальних прев’ю",
);
check(
  await page.getByRole("heading", { name: "Новинки", exact: true }).isVisible(),
  "На головній показано розділ «Новинки»",
);
check(
  await page
    .getByLabel("Знайти матеріал за темою або класом")
    .isVisible(),
  "На головній є помітний пошук за темою або класом",
);
const homeSearchPage = await desktop.newPage();
await homeSearchPage.goto(baseUrl, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
await homeSearchPage
  .getByLabel("Знайти матеріал за темою або класом")
  .fill("Росток");
await Promise.all([
  homeSearchPage.waitForURL(/\/catalog\/?\?search=/, { timeout: 30_000 }),
  homeSearchPage.getByRole("button", { name: "Знайти", exact: true }).click(),
]);
await homeSearchPage.locator(".material-card").first().waitFor({
  state: "visible",
  timeout: 30_000,
});
check(
  (await homeSearchPage.locator(".material-card").count()) > 0 &&
    new URL(homeSearchPage.url()).searchParams.get("search") === "Росток",
  "Пошук із головної відкриває каталог із відповідними результатами",
);
await homeSearchPage.close();
const homeMaterialSlugs = await page
  .locator(".home-materials .material-card h3 a")
  .evaluateAll((links) =>
    links.map((link) => link.getAttribute("href")?.split("/").filter(Boolean).at(-1)),
  );
check(
  JSON.stringify(homeMaterialSlugs) === JSON.stringify(expectedNewestSlugs),
  "Розділ «Новинки» автоматично показує 8 найновіших матеріалів за датою",
);
const homeTelegramLinks = page
  .locator(".home-materials .material-card")
  .locator(telegramPostSelector);
check(
  (await homeTelegramLinks.evaluateAll((links) =>
    links.every(
      (link) =>
        telegramPostPattern.test(link.href) &&
        link.getAttribute("target") === "_blank" &&
        link.getAttribute("rel")?.includes("noopener"),
    ),
  )),
  "Telegram-посилання на картках ведуть на конкретні дописи й безпечно відкриваються в новій вкладці",
);
check(
  (await page.locator(
    '.home-materials .material-card a[href="https://t.me/gotovo_do_uroku"]',
  ).count()) === 0,
  "На картках немає оманливого посилання лише на головну сторінку каналу",
);
const telegramMaterialHref = verifiedTelegramEntry
  ? `/materials/${verifiedTelegramEntry[0]}/`
  : "";
check(
  Boolean(telegramMaterialHref),
  "У каталозі є матеріал із раніше перевіреним прямим Telegram-посиланням",
);
const homeImageLocators = page.locator(".home-materials img");
for (let index = 0; index < (await homeImageLocators.count()); index += 1) {
  const image = homeImageLocators.nth(index);
  await image.scrollIntoViewIfNeeded();
  await image.evaluate(
    (element) =>
      new Promise((resolve) => {
        if (element.complete) {
          resolve();
          return;
        }
        element.addEventListener("load", resolve, { once: true });
        element.addEventListener("error", resolve, { once: true });
      }),
  );
}
const homeImages = await page
  .locator(".home-materials img")
  .evaluateAll((images) =>
    images.map((image) => ({
      complete: image.complete,
      width: image.naturalWidth,
      src: image.currentSrc || image.src,
    })),
  );
check(
  homeImages.every((image) => image.complete && image.width > 0),
  "Зображення новинок не биті",
);
check(
  await page.locator('header a[href="/rozrizaty-zobrazhennya/"]').isVisible(),
  "Інструмент для розрізання зображень доступний у головному меню",
);
await page.screenshot({
  path: path.join(outputDir, "home-desktop.png"),
  fullPage: true,
});

await page.goto(`${baseUrl}/rozrizaty-zobrazhennya/`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
check(
  await page.getByRole("heading", { name: /Розріж зображення/ }).isVisible(),
  "Сторінка інструмента відкривається",
);
await page.waitForFunction(() => typeof window.JSZip === "function", null, {
  timeout: 30_000,
});
await page
  .locator('input[data-testid="splitter-file"]')
  .setInputFiles(path.join(process.cwd(), "public", "brand", "logo.png"));
await page.locator(".splitter-editor").waitFor({ state: "visible", timeout: 30_000 });
await page.getByLabel("Частин по ширині").fill("3");
await page.getByLabel("Частин по висоті").fill("2");
check(
  (await page.locator(".splitter-grid-badge").innerText()).includes("6 частин"),
  "Сітка 3 × 2 показує 6 частин",
);
const splitterDownload = page.waitForEvent("download", { timeout: 60_000 });
await page.getByRole("button", { name: "Розрізати й завантажити ZIP" }).click();
const downloadedArchive = await splitterDownload;
const archivePath = path.join(outputDir, "splitter-3x2.zip");
await downloadedArchive.saveAs(archivePath);
const archiveBinary = (await fs.readFile(archivePath)).toString("latin1");
const pieceNames = new Set(
  Array.from(
    archiveBinary.matchAll(/chastyna-r\d{2}-c\d{2}\.png/g),
    (match) => match[0],
  ),
);
check(
  pieceNames.size === 6 && archiveBinary.includes("prochytai-mene.txt"),
  "ZIP для сітки 3 × 2 містить шість PNG-частин та інструкцію",
);
await page.screenshot({
  path: path.join(outputDir, "image-splitter-desktop.png"),
  fullPage: true,
});

await Promise.all([
  page.waitForURL(/\/catalog\/?$/, { timeout: 30_000 }),
  page.locator('header a[href="/catalog/"]').first().click(),
]);
check(page.url().includes("/catalog"), "Перехід до каталогу працює");
await page
  .getByPlaceholder("Введіть тему, предмет або назву матеріалу")
  .fill("Росток");
await page.waitForTimeout(250);
const searchedCount = await page.locator(".material-card").count();
check(searchedCount > 0, "Пошук за словом «Росток» повертає результати");

await page.getByLabel("Категорія").selectOption({ label: "Математика" });
await page.waitForTimeout(150);
check(
  (await page.locator(".material-card").count()) > 0,
  "Фільтр категорії працює",
);
await page.getByLabel("Доступ").selectOption("free");
await page.waitForTimeout(150);
const statuses = await page.locator(".material-status").allTextContents();
check(
  statuses.length > 0 &&
    statuses.every((text) => text.includes("Безкоштовно")),
  "Фільтр безкоштовних матеріалів працює",
);
await page.getByRole("button", { name: "Очистити фільтри" }).click();
await page.waitForTimeout(150);
await page.getByLabel("Сортування").selectOption("popular");
await page.waitForTimeout(150);
check(
  (await page.locator(".material-card").count()) > 0,
  "Сортування за популярністю працює",
);
await Promise.all([
  page.waitForURL(/\/materials\/.+/, { timeout: 30_000 }),
  page.locator(".material-card h3 a").first().click(),
]);
check(
  await page.locator(".material-detail h1").isVisible(),
  "Пряма сторінка матеріалу відкривається",
);
check(
  await page.locator(".gallery-main-image img").isVisible(),
  "Головне зображення галереї видно",
);
await page.goto(new URL(telegramMaterialHref, baseUrl).href, {
  waitUntil: "domcontentloaded",
});
const cleanedDescription = await page.locator(".description-main").innerText();
check(
  !/;(?=[\p{L}\p{N}«“„])|:(?=[\p{L}«“„])|\.(?=[А-ЯІЇЄҐA-Z])/gu.test(
    cleanedDescription,
  ),
  "В описі матеріалу автоматично виправлені пропущені пробіли",
);
const detailTelegramLink = page
  .locator(".detail-actions")
  .locator(telegramPostSelector);
check(
  (await detailTelegramLink.count()) === 1 &&
    (await detailTelegramLink.isVisible()),
  "На сторінці доступного матеріалу є помітна кнопка Telegram",
);
check(
  telegramPostPattern.test(
    (await detailTelegramLink.getAttribute("href")) || "",
  ) &&
  (await detailTelegramLink.getAttribute("target")) === "_blank" &&
    (await detailTelegramLink.getAttribute("rel"))?.includes("noopener"),
  "Кнопка Telegram на сторінці матеріалу має пряму й безпечну адресу",
);
const directTelegramUrl = await detailTelegramLink.getAttribute("href");
const telegramPostPage = await desktop.newPage();
await telegramPostPage.goto(`${directTelegramUrl}?embed=1&mode=tme`, {
  waitUntil: "domcontentloaded",
  timeout: 60_000,
});
check(
  (await telegramPostPage.locator(".tgme_widget_message").count()) > 0 &&
    (await telegramPostPage.locator(".tgme_widget_message_error").count()) === 0,
  "Раніше перевірений прямий допис Telegram досі доступний",
);
await telegramPostPage.close();
await page.screenshot({
  path: path.join(outputDir, "material-detail-desktop.png"),
  fullPage: true,
});
if ((await page.locator(".gallery-thumbnails button").count()) > 1) {
  await page.locator(".gallery-thumbnails button").nth(1).click();
  await page.locator(".gallery-image-button").click();
  check(
    await page.locator(".gallery-modal").isVisible(),
    "Модальне збільшення працює",
  );
  await page.keyboard.press("Escape");
  check(
    !(await page.locator(".gallery-modal").isVisible()),
    "Модальне вікно закривається Escape",
  );
}
const materialUrl = page.url();

await page.goto(`${baseUrl}/contacts/`, { waitUntil: "domcontentloaded" });
const form = page.locator('form[name="contact"]');
check(await form.isVisible(), "Форма зворотного зв’язку відображається");
const netlifyMarker = await form.getAttribute("data-netlify");
check(
  netlifyMarker === "true" ||
    (baseUrl.startsWith("https://") && netlifyMarker === null),
  "Форма налаштована або вже оброблена Netlify Forms",
);
check(
  (await form.locator('input[name="form-name"]').getAttribute("value")) ===
    "contact",
  "Приховане ім’я форми налаштоване",
);
await form.locator('input[name="name"]').fill("Тестова перевірка");
await form.locator('input[name="email"]').fill("qa@example.com");
await form.locator('input[name="subject"]').fill("Перевірка форми");
await form.locator('textarea[name="message"]').fill(
  "Це локальна перевірка валідації без надсилання даних.",
);
await form.locator('input[name="privacy-consent"]').check();
check(
  await form.locator('button[type="submit"]').isEnabled(),
  "Поля форми проходять валідацію",
);
if (process.env.TEST_SUBMIT_FORM === "1") {
  await Promise.all([
    page.waitForURL(/\/success\/?$/, { timeout: 30_000 }),
    form.locator('button[type="submit"]').click(),
  ]);
  check(
    await page.locator("h1").isVisible(),
    "Netlify Forms приймає повідомлення й відкриває сторінку успіху",
  );
}

testingNotFound = true;
await page.goto(`${baseUrl}/storinka-yakoyi-nemaye/`, {
  waitUntil: "domcontentloaded",
});
check(
  (await page.locator("body").innerText()).includes("404"),
  "Сторінка 404 відкривається",
);
testingNotFound = false;

await page.goto(materialUrl, { waitUntil: "domcontentloaded" });
check(
  await page.locator(".material-detail h1").isVisible(),
  "Пряме повторне відкриття матеріалу працює",
);
check(
  await page
    .locator(".detail-actions")
    .locator(telegramPostSelector)
    .isVisible(),
  "Telegram-кнопка зберігається після прямого відкриття сторінки матеріалу",
);

const mobile = await browser.newContext({
  viewport: { width: 390, height: 844 },
  deviceScaleFactor: 2,
  isMobile: true,
  hasTouch: true,
});
const mobilePage = await mobile.newPage();
mobilePage.on("pageerror", (error) =>
  errors.push(`mobile pageerror: ${error.message}`),
);
mobilePage.on("console", (message) => {
  if (message.type() === "error") {
    errors.push(`mobile console: ${message.text()}`);
  }
});
await mobilePage.goto(baseUrl, { waitUntil: "domcontentloaded" });
check(
  await mobilePage.locator(".hero-portrait-mobile").isVisible(),
  "На телефоні широкий банер замінено компактним образом авторки",
);
check(
  !(await mobilePage.locator(".hero-banner-desktop").isVisible()),
  "Широкий бренд-банер прихований на телефоні",
);
const visibleMobileNewest = await mobilePage
  .locator(".home-materials .material-card")
  .evaluateAll((cards) =>
    cards.filter((card) => getComputedStyle(card).display !== "none").length,
  );
check(
  visibleMobileNewest === 4,
  "На телефоні показано чотири новинки та кнопку переходу до всіх матеріалів",
);
check(
  await mobilePage
    .getByLabel("Знайти матеріал за темою або класом")
    .isVisible(),
  "Пошук зручно доступний на телефоні",
);
const overflow = await mobilePage.evaluate(
  () =>
    document.documentElement.scrollWidth -
    document.documentElement.clientWidth,
);
check(overflow <= 1, "На мобільному немає горизонтального прокручування");
await mobilePage.screenshot({
  path: path.join(outputDir, "home-mobile.png"),
  fullPage: true,
});
await mobilePage.getByRole("button", { name: "Відкрити меню" }).click();
check(
  await mobilePage.locator(".mobile-menu").isVisible(),
  "Мобільне меню відкривається",
);
await mobilePage.screenshot({
  path: path.join(outputDir, "menu-mobile.png"),
  fullPage: false,
});
await Promise.all([
  mobilePage.waitForURL(/\/catalog\/?$/, { timeout: 30_000 }),
  mobilePage.locator('.mobile-menu a[href="/catalog/"]').click(),
]);
await mobilePage.getByRole("button", { name: /Фільтри/ }).click();
check(
  await mobilePage.locator(".filter-panel.open").isVisible(),
  "Мобільна панель фільтрів відкривається",
);
await mobilePage.screenshot({
  path: path.join(outputDir, "catalog-mobile.png"),
  fullPage: false,
});
await mobilePage.goto(new URL(telegramMaterialHref, baseUrl).href, {
  waitUntil: "domcontentloaded",
});
check(
  await mobilePage
    .locator(".detail-actions")
    .locator(telegramPostSelector)
    .isVisible(),
  "Telegram-кнопка видима на мобільній сторінці матеріалу",
);
const materialMobileOverflow = await mobilePage.evaluate(
  () =>
    document.documentElement.scrollWidth -
    document.documentElement.clientWidth,
);
check(
  materialMobileOverflow <= 1,
  "На мобільній сторінці матеріалу немає горизонтального прокручування",
);
await mobilePage.screenshot({
  path: path.join(outputDir, "material-detail-mobile.png"),
  fullPage: true,
});

await mobilePage.goto(`${baseUrl}/rozrizaty-zobrazhennya/`, {
  waitUntil: "domcontentloaded",
});
check(
  await mobilePage.getByRole("heading", { name: /Розріж зображення/ }).isVisible(),
  "Інструмент відкривається на мобільному",
);
const splitterMobileOverflow = await mobilePage.evaluate(
  () => document.documentElement.scrollWidth - document.documentElement.clientWidth,
);
check(
  splitterMobileOverflow <= 1,
  "На мобільній сторінці інструмента немає горизонтального прокручування",
);
await mobilePage.screenshot({
  path: path.join(outputDir, "image-splitter-mobile.png"),
  fullPage: true,
});

await desktop.close();
await mobile.close();
await browser.close();

const uniqueErrors = Array.from(new Set(errors));
const report = {
  baseUrl,
  executablePath,
  checks,
  errors: uniqueErrors,
  generatedAt: new Date().toISOString(),
};
await fs.writeFile(
  path.join(outputDir, "browser-report.json"),
  `${JSON.stringify(report, null, 2)}\n`,
);
console.log(JSON.stringify(report, null, 2));
if (uniqueErrors.length) process.exitCode = 1;
