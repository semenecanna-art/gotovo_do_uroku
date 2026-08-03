"use client";

import {
  CheckCircle2,
  Download,
  FileArchive,
  Grid2X2,
  ImageIcon,
  Lightbulb,
  LockKeyhole,
  RefreshCw,
  Share2,
  Sparkles,
  Trash2,
  Upload,
} from "lucide-react";
import {
  type ChangeEvent,
  type DragEvent,
  useEffect,
  useRef,
  useState,
} from "react";

const MAX_FILE_BYTES = 50 * 1024 * 1024;
const MAX_IMAGE_PIXELS = 100_000_000;
const MAX_GRID = 12;

const presets = [
  { columns: 2, rows: 2 },
  { columns: 3, rows: 2 },
  { columns: 3, rows: 3 },
  { columns: 4, rows: 3 },
  { columns: 6, rows: 4 },
];

const teacherIdeas = [
  "Розріж великий постер на сітку 2 × 2, роздрукуй частини на А4 та склади яскраву наочність для дошки.",
  "Зроби пазл 3 × 3: розріж тематичну картинку, перемішай фрагменти й запропонуй дітям відновити її в парах.",
  "Підготуй гру «Знайди свою частинку»: роздай дітям фрагменти кількох картинок, щоб вони об’єдналися в команди.",
  "Для ранкової зустрічі розріж спільне зображення на кількість груп — кожна група відкриє свою частину підказки.",
  "Створи велике поле для настільної гри: розділи макет 3 × 2, роздрукуй і склей частини прозорою стрічкою.",
  "Розріж ілюстрацію до твору на 4 частини та відкривай їх поступово, щоб діти передбачали тему або події.",
];

type LoadedImage = {
  element: HTMLImageElement;
  file: File;
  objectUrl: string;
};

type OutputFormat = {
  extension: "jpg" | "png" | "webp";
  label: "JPG" | "PNG" | "WEBP";
  mime: "image/jpeg" | "image/png" | "image/webp";
};

type ZipFolder = {
  file: (name: string, data: Blob | string) => void;
};

type ZipInstance = {
  folder: (name: string) => ZipFolder | null;
  generateAsync: (
    options: {
      type: "blob";
      compression: "DEFLATE";
      compressionOptions: { level: number };
    },
    onUpdate: (metadata: { percent: number }) => void,
  ) => Promise<Blob>;
};

declare global {
  interface Window {
    JSZip?: new () => ZipInstance;
  }
}

function clampGridValue(value: number) {
  if (!Number.isFinite(value)) return 1;
  return Math.min(MAX_GRID, Math.max(1, Math.trunc(value)));
}

function formatBytes(bytes: number) {
  if (bytes < 1024) return `${bytes} Б`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} КБ`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} МБ`;
}

function safeBaseName(name: string) {
  const cleaned = name
    .replace(/\.[^/.]+$/, "")
    .normalize("NFKD")
    .replace(/[\\/:*?"<>|]+/g, "-")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
  return cleaned || "zobrazhennia";
}

function pluralParts(number: number) {
  const mod10 = number % 10;
  const mod100 = number % 100;
  if (mod10 === 1 && mod100 !== 11) return "частина";
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) {
    return "частини";
  }
  return "частин";
}

function getOutputFormat(file: File | null): OutputFormat {
  if (file?.type === "image/jpeg") {
    return { mime: "image/jpeg", extension: "jpg", label: "JPG" };
  }
  if (file?.type === "image/webp") {
    return { mime: "image/webp", extension: "webp", label: "WEBP" };
  }
  return { mime: "image/png", extension: "png", label: "PNG" };
}

function canvasToBlob(canvas: HTMLCanvasElement, mime: OutputFormat["mime"]) {
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (blob) =>
        blob
          ? resolve(blob)
          : reject(new Error("Не вдалося створити файл зображення.")),
      mime,
      mime === "image/jpeg" || mime === "image/webp" ? 0.95 : undefined,
    );
  });
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob);
  const link = document.createElement("a");
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  link.remove();
  window.setTimeout(() => URL.revokeObjectURL(url), 1500);
}

export function ImageSplitter() {
  const inputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const editorRef = useRef<HTMLDivElement>(null);
  const [loaded, setLoaded] = useState<LoadedImage | null>(null);
  const [columns, setColumns] = useState(2);
  const [rows, setRows] = useState(2);
  const [busy, setBusy] = useState(false);
  const [dragActive, setDragActive] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("Готуємо частини");
  const [message, setMessage] = useState("");
  const [messageError, setMessageError] = useState(false);
  const [ideaIndex, setIdeaIndex] = useState(0);

  const total = columns * rows;
  const format = getOutputFormat(loaded?.file ?? null);

  useEffect(() => {
    const canvas = canvasRef.current;
    const image = loaded?.element;
    if (!canvas || !image) return;

    const sourceWidth = image.naturalWidth;
    const sourceHeight = image.naturalHeight;
    const scale = Math.min(1, 1400 / Math.max(sourceWidth, sourceHeight));
    const width = Math.max(1, Math.round(sourceWidth * scale));
    const height = Math.max(1, Math.round(sourceHeight * scale));
    const context = canvas.getContext("2d");
    if (!context) return;

    canvas.width = width;
    canvas.height = height;
    canvas.style.aspectRatio = `${sourceWidth} / ${sourceHeight}`;
    context.clearRect(0, 0, width, height);
    context.drawImage(image, 0, 0, width, height);
    context.save();
    context.strokeStyle = "rgba(7, 91, 216, 0.96)";
    context.lineWidth = Math.max(2, Math.min(width, height) * 0.004);
    context.setLineDash([Math.max(8, width * 0.014), Math.max(5, width * 0.008)]);
    context.shadowColor = "rgba(255,255,255,0.96)";
    context.shadowBlur = Math.max(2, context.lineWidth * 1.2);

    for (let column = 1; column < columns; column += 1) {
      const x = Math.round((column * width) / columns);
      context.beginPath();
      context.moveTo(x, 0);
      context.lineTo(x, height);
      context.stroke();
    }
    for (let row = 1; row < rows; row += 1) {
      const y = Math.round((row * height) / rows);
      context.beginPath();
      context.moveTo(0, y);
      context.lineTo(width, y);
      context.stroke();
    }
    context.restore();
  }, [columns, loaded, rows]);

  useEffect(
    () => () => {
      if (loaded?.objectUrl) URL.revokeObjectURL(loaded.objectUrl);
    },
    [loaded],
  );

  function showMessage(text: string, isError = false) {
    setMessage(text);
    setMessageError(isError);
  }

  async function acceptFile(file?: File) {
    if (!file || busy) return;
    try {
      if (!new Set(["image/png", "image/jpeg", "image/webp"]).has(file.type)) {
        throw new Error("Обери зображення у форматі PNG, JPG або WEBP.");
      }
      if (file.size > MAX_FILE_BYTES) {
        throw new Error("Файл завеликий. Максимальний розмір — 50 МБ.");
      }

      const objectUrl = URL.createObjectURL(file);
      const image = await new Promise<HTMLImageElement>((resolve, reject) => {
        const element = new Image();
        element.onload = () => resolve(element);
        element.onerror = () => reject(new Error("Не вдалося прочитати це зображення."));
        element.src = objectUrl;
      });

      if (image.naturalWidth * image.naturalHeight > MAX_IMAGE_PIXELS) {
        URL.revokeObjectURL(objectUrl);
        throw new Error(
          "Зображення має надто велику роздільність. Обери файл до 100 мегапікселів.",
        );
      }

      setLoaded((previous) => {
        if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
        return { element: image, file, objectUrl };
      });
      showMessage("Зображення додано. Тепер обери кількість частин.");
      window.setTimeout(
        () => editorRef.current?.scrollIntoView({ behavior: "smooth", block: "start" }),
        80,
      );
    } catch (error) {
      showMessage(
        error instanceof Error ? error.message : "Не вдалося відкрити зображення.",
        true,
      );
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  function resetImage() {
    if (busy) return;
    setLoaded((previous) => {
      if (previous?.objectUrl) URL.revokeObjectURL(previous.objectUrl);
      return null;
    });
    if (inputRef.current) inputRef.current.value = "";
    setMessage("");
  }

  function updateColumns(value: number) {
    setColumns(clampGridValue(value));
  }

  function updateRows(value: number) {
    setRows(clampGridValue(value));
  }

  async function createPieces() {
    if (!loaded) return [];
    const pieces: Array<{ blob: Blob; filename: string }> = [];
    const sourceWidth = loaded.element.naturalWidth;
    const sourceHeight = loaded.element.naturalHeight;
    let completed = 0;

    for (let row = 0; row < rows; row += 1) {
      const sourceTop = Math.round((row * sourceHeight) / rows);
      const sourceBottom = Math.round(((row + 1) * sourceHeight) / rows);
      for (let column = 0; column < columns; column += 1) {
        const sourceLeft = Math.round((column * sourceWidth) / columns);
        const sourceRight = Math.round(((column + 1) * sourceWidth) / columns);
        const pieceWidth = sourceRight - sourceLeft;
        const pieceHeight = sourceBottom - sourceTop;
        const canvas = document.createElement("canvas");
        canvas.width = pieceWidth;
        canvas.height = pieceHeight;
        const context = canvas.getContext("2d", { alpha: format.mime !== "image/jpeg" });
        if (!context) throw new Error("Браузер не підтримує обробку цього зображення.");

        if (format.mime === "image/jpeg") {
          context.fillStyle = "#ffffff";
          context.fillRect(0, 0, pieceWidth, pieceHeight);
        }
        context.drawImage(
          loaded.element,
          sourceLeft,
          sourceTop,
          pieceWidth,
          pieceHeight,
          0,
          0,
          pieceWidth,
          pieceHeight,
        );
        const blob = await canvasToBlob(canvas, format.mime);
        pieces.push({
          blob,
          filename: `chastyna-r${String(row + 1).padStart(2, "0")}-c${String(
            column + 1,
          ).padStart(2, "0")}.${format.extension}`,
        });
        canvas.width = 1;
        canvas.height = 1;
        completed += 1;
        setProgress(Math.round((completed / total) * 72));
        if (completed % 3 === 0) {
          await new Promise<void>((resolve) => requestAnimationFrame(() => resolve()));
        }
      }
    }
    return pieces;
  }

  async function splitImage() {
    if (!loaded || busy) return;
    setBusy(true);
    setProgress(0);
    setProgressLabel("Готуємо частини");
    showMessage("");
    try {
      const pieces = await createPieces();
      const baseName = safeBaseName(loaded.file.name);
      if (!window.JSZip) {
        throw new Error("ZIP-модуль ще завантажується. Спробуй ще раз за кілька секунд.");
      }
      const zip = new window.JSZip();
      const folder = zip.folder(`${baseName}-${columns}x${rows}`);
      if (!folder) throw new Error("Не вдалося створити ZIP-архів.");
      pieces.forEach((piece) => folder.file(piece.filename, piece.blob));
      folder.file(
        "prochytai-mene.txt",
        [
          "Готово до уроку — розрізане зображення",
          "",
          `Початковий файл: ${loaded.file.name}`,
          `Сітка: ${columns} частин по ширині × ${rows} частин по висоті`,
          `Усього частин: ${pieces.length}`,
          "Порядок: зліва направо, зверху вниз.",
          "",
          "https://gotovo-do-uroku.com.ua/rozrizaty-zobrazhennya/",
          "gotovo_do_uroku",
        ].join("\r\n"),
      );
      setProgressLabel("Створюємо ZIP");
      const zipBlob = await zip.generateAsync(
        { type: "blob", compression: "DEFLATE", compressionOptions: { level: 6 } },
        ({ percent }) => setProgress(72 + Math.round((percent / 100) * 28)),
      );
      downloadBlob(zipBlob, `${baseName}-${columns}x${rows}-gotovo-do-uroku.zip`);
      setProgress(100);
      showMessage(`Готово! Створено ${pieces.length} ${pluralParts(pieces.length)}.`);
    } catch (error) {
      console.error(error);
      showMessage(
        error instanceof Error ? error.message : "Не вдалося розрізати зображення.",
        true,
      );
    } finally {
      window.setTimeout(() => setBusy(false), 500);
    }
  }

  async function shareTool() {
    const data = {
      title: "Готово до уроку — розрізати зображення",
      text: "Безкоштовний сервіс для розрізання зображень на частини — для плакатів, ігор і наочності.",
      url: "https://gotovo-do-uroku.com.ua/rozrizaty-zobrazhennya/",
    };
    try {
      if (navigator.share) {
        await navigator.share(data);
        return;
      }
      await navigator.clipboard.writeText(data.url);
      showMessage("Посилання скопійовано. Можна надіслати колегам!");
    } catch (error) {
      if (error instanceof DOMException && error.name === "AbortError") return;
      showMessage("Не вдалося скопіювати посилання.", true);
    }
  }

  const pieceWidth = loaded
    ? `${Math.floor(loaded.element.naturalWidth / columns)}–${Math.ceil(
        loaded.element.naturalWidth / columns,
      )}`
    : "—";
  const pieceHeight = loaded
    ? `${Math.floor(loaded.element.naturalHeight / rows)}–${Math.ceil(
        loaded.element.naturalHeight / rows,
      )}`
    : "—";

  return (
    <>
      <section className="splitter-card" aria-label="Інструмент для розрізання зображення">
        <div className="splitter-step-title">
          <span>1</span>
          <h2>Додай зображення</h2>
        </div>

        {!loaded ? (
          <label
            className={`splitter-upload${dragActive ? " is-dragging" : ""}`}
            htmlFor="splitter-file"
            onDragEnter={(event) => {
              event.preventDefault();
              setDragActive(true);
            }}
            onDragOver={(event) => event.preventDefault()}
            onDragLeave={(event) => {
              event.preventDefault();
              setDragActive(false);
            }}
            onDrop={(event: DragEvent<HTMLLabelElement>) => {
              event.preventDefault();
              setDragActive(false);
              void acceptFile(event.dataTransfer.files[0]);
            }}
          >
            <input
              ref={inputRef}
              id="splitter-file"
              data-testid="splitter-file"
              type="file"
              accept="image/png,image/jpeg,image/webp"
              onChange={(event: ChangeEvent<HTMLInputElement>) =>
                void acceptFile(event.target.files?.[0])
              }
            />
            <span className="splitter-upload-icon">
              <ImageIcon size={38} aria-hidden="true" />
            </span>
            <strong>Перетягни картинку сюди</strong>
            <span>або вибери її на своєму пристрої</span>
            <span className="button button-primary splitter-upload-button">
              <Upload size={19} aria-hidden="true" />
              Вибрати зображення
            </span>
            <small>PNG, JPG або WEBP · до 50 МБ</small>
          </label>
        ) : (
          <div className="splitter-editor" ref={editorRef}>
            <div className="splitter-file-row">
              <span className="splitter-file-icon">
                <ImageIcon size={24} aria-hidden="true" />
              </span>
              <div>
                <strong>{loaded.file.name}</strong>
                <small>
                  {loaded.element.naturalWidth} × {loaded.element.naturalHeight} пікселів ·{" "}
                  {formatBytes(loaded.file.size)}
                </small>
              </div>
              <button
                className="splitter-icon-button"
                type="button"
                aria-label="Прибрати зображення"
                onClick={resetImage}
                disabled={busy}
              >
                <Trash2 size={21} aria-hidden="true" />
              </button>
            </div>

            <div className="splitter-workspace">
              <section className="splitter-preview" aria-labelledby="splitter-preview-title">
                <div className="splitter-panel-heading">
                  <h3 id="splitter-preview-title">Попередній перегляд</h3>
                  <span className="splitter-grid-badge">
                    {columns} × {rows} · {total} {pluralParts(total)}
                  </span>
                </div>
                <div className="splitter-canvas-wrap">
                  <canvas
                    ref={canvasRef}
                    aria-label="Зображення з лініями майбутнього розрізання"
                  />
                </div>
              </section>

              <section className="splitter-controls" aria-labelledby="splitter-controls-title">
                <div className="splitter-panel-heading">
                  <h3 id="splitter-controls-title">Обери сітку</h3>
                  <Grid2X2 size={24} aria-hidden="true" />
                </div>
                <div className="splitter-presets" aria-label="Швидкий вибір сітки">
                  {presets.map((preset) => (
                    <button
                      key={`${preset.columns}x${preset.rows}`}
                      className={
                        preset.columns === columns && preset.rows === rows
                          ? "is-active"
                          : ""
                      }
                      type="button"
                      onClick={() => {
                        setColumns(preset.columns);
                        setRows(preset.rows);
                      }}
                      disabled={busy}
                    >
                      {preset.columns} × {preset.rows}
                    </button>
                  ))}
                </div>
                <div className="splitter-number-fields">
                  <label>
                    Частин по ширині
                    <input
                      aria-label="Частин по ширині"
                      type="number"
                      min="1"
                      max="12"
                      value={columns}
                      onChange={(event) => updateColumns(Number(event.target.value))}
                      disabled={busy}
                    />
                  </label>
                  <label>
                    Частин по висоті
                    <input
                      aria-label="Частин по висоті"
                      type="number"
                      min="1"
                      max="12"
                      value={rows}
                      onChange={(event) => updateRows(Number(event.target.value))}
                      disabled={busy}
                    />
                  </label>
                </div>
                <div className="splitter-summary">
                  <span>Усього частин <strong>{total}</strong></span>
                  <span>
                    Розмір частини <strong>{pieceWidth} × {pieceHeight} px</strong>
                  </span>
                  <span>Формат <strong>{format.label}</strong></span>
                </div>
                <button
                  className="button button-primary splitter-download"
                  type="button"
                  onClick={() => void splitImage()}
                  disabled={busy}
                >
                  <Download size={20} aria-hidden="true" />
                  {busy ? "Готуємо файли…" : "Розрізати й завантажити ZIP"}
                </button>
                <button
                  className="splitter-change"
                  type="button"
                  onClick={() => inputRef.current?.click()}
                  disabled={busy}
                >
                  <RefreshCw size={17} aria-hidden="true" />
                  Вибрати інше зображення
                </button>
                <input
                  ref={inputRef}
                  className="sr-only"
                  type="file"
                  accept="image/png,image/jpeg,image/webp"
                  onChange={(event) => void acceptFile(event.target.files?.[0])}
                />
              </section>
            </div>
          </div>
        )}

        {busy && (
          <div className="splitter-progress" aria-live="polite">
            <div><span style={{ width: `${progress}%` }} /></div>
            <p>{progressLabel}: {progress}%</p>
          </div>
        )}
        {message && (
          <p className={`splitter-message${messageError ? " is-error" : ""}`} role="status">
            {messageError ? null : <CheckCircle2 size={19} aria-hidden="true" />}
            {message}
          </p>
        )}
      </section>

      <section className="splitter-benefits" aria-label="Переваги сервісу">
        <article>
          <LockKeyhole aria-hidden="true" />
          <div><h2>Приватно</h2><p>Зображення обробляється у твоєму браузері й нікуди не надсилається.</p></div>
        </article>
        <article>
          <Grid2X2 aria-hidden="true" />
          <div><h2>Будь-яка сітка</h2><p>Від 1 × 1 до 12 × 12 — для плакатів, пазлів, ігор і великих наочностей.</p></div>
        </article>
        <article>
          <FileArchive aria-hidden="true" />
          <div><h2>Один ZIP-архів</h2><p>Усі частини мають зрозумілі назви й завантажуються одним файлом.</p></div>
        </article>
      </section>

      <section className="splitter-idea">
        <span><Lightbulb size={28} aria-hidden="true" /></span>
        <div>
          <small>Швидка підказка</small>
          <h2>Ідея для уроку</h2>
          <p>{teacherIdeas[ideaIndex]}</p>
        </div>
        <button
          className="button button-secondary button-small"
          type="button"
          onClick={() => setIdeaIndex((ideaIndex + 1) % teacherIdeas.length)}
        >
          <Sparkles size={17} aria-hidden="true" />
          Ще одна ідея
        </button>
      </section>

      <section className="splitter-share">
        <div>
          <small>Корисно для колег?</small>
          <h2>Поділися безкоштовним інструментом</h2>
          <p>Надішли посилання вчителям — нехай підготовка плакатів і наочності стане простішою.</p>
        </div>
        <button className="button button-light" type="button" onClick={() => void shareTool()}>
          <Share2 size={19} aria-hidden="true" />
          Поділитися
        </button>
      </section>
    </>
  );
}
