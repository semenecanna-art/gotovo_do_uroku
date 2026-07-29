import fs from "node:fs/promises";
import http from "node:http";
import path from "node:path";
import process from "node:process";

const root = path.resolve(process.cwd(), process.env.STATIC_DIR ?? "out");
const port = Number(process.env.PORT ?? 4174);
const mimeTypes = new Map([
  [".html", "text/html; charset=utf-8"],
  [".css", "text/css; charset=utf-8"],
  [".js", "text/javascript; charset=utf-8"],
  [".json", "application/json; charset=utf-8"],
  [".xml", "application/xml; charset=utf-8"],
  [".txt", "text/plain; charset=utf-8"],
  [".png", "image/png"],
  [".jpg", "image/jpeg"],
  [".jpeg", "image/jpeg"],
  [".webp", "image/webp"],
  [".svg", "image/svg+xml"],
  [".ico", "image/x-icon"],
  [".woff2", "font/woff2"],
]);

const insideRoot = (candidate) => {
  const relative = path.relative(root, candidate);
  return !relative.startsWith("..") && !path.isAbsolute(relative);
};

const resolveRequest = async (urlPath) => {
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const relative = decoded.replace(/^\/+/, "");
  const basename = path.basename(relative);
  const dirname = path.dirname(relative);
  const dottedParts = basename.split(".");
  const rscRelative =
    dottedParts[0] === "__next" && dottedParts.length >= 4
      ? path.join(
          dirname === "." ? "" : dirname,
          `${dottedParts[0]}.${dottedParts[1]}`,
          ...dottedParts.slice(2, -2),
          `${dottedParts.at(-2)}.${dottedParts.at(-1)}`,
        )
      : "";
  const candidates = [
    path.join(root, relative),
    path.join(root, relative, "index.html"),
    path.join(root, `${relative}.html`),
    ...(rscRelative ? [path.join(root, rscRelative)] : []),
  ];
  for (const candidate of candidates) {
    if (!insideRoot(candidate)) continue;
    try {
      const stats = await fs.stat(candidate);
      if (stats.isFile()) return { file: candidate, status: 200 };
    } catch {
      // Перевіряємо наступний варіант адреси.
    }
  }
  return { file: path.join(root, "404.html"), status: 404 };
};

const server = http.createServer(async (request, response) => {
  try {
    const { file, status } = await resolveRequest(request.url ?? "/");
    const body = await fs.readFile(file);
    const mime = mimeTypes.get(path.extname(file).toLowerCase()) ??
      "application/octet-stream";
    response.writeHead(status, {
      "content-type": mime,
      "cache-control": status === 200 ? "no-cache" : "no-store",
    });
    response.end(body);
  } catch (error) {
    response.writeHead(500, { "content-type": "text/plain; charset=utf-8" });
    response.end(error instanceof Error ? error.message : String(error));
  }
});

server.listen(port, "127.0.0.1", () => {
  console.log(`Статичний сайт: http://127.0.0.1:${port}`);
});
