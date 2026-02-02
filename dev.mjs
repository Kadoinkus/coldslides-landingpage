import http from "http";
import path from "path";
import fs from "fs";
import { build } from "./build.mjs";

const root = process.cwd();
const port = Number(process.env.PORT || 5173);

function contentType(filePath){
  const ext = path.extname(filePath).toLowerCase();
  switch (ext) {
    case ".html": return "text/html";
    case ".css": return "text/css";
    case ".js": return "text/javascript";
    case ".json": return "application/json";
    case ".svg": return "image/svg+xml";
    case ".png": return "image/png";
    case ".jpg":
    case ".jpeg": return "image/jpeg";
    case ".webp": return "image/webp";
    default: return "application/octet-stream";
  }
}

function safePath(urlPath){
  const decoded = decodeURIComponent(urlPath.split("?")[0]);
  const rawPath = decoded === "/" ? "/index.html" : decoded;
  const fullPath = path.normalize(path.join(root, rawPath));
  if (!fullPath.startsWith(root)) return null;
  return fullPath;
}

function serveFile(filePath, res){
  fs.readFile(filePath, (err, data) => {
    if (err) {
      res.writeHead(404);
      res.end("Not found");
      return;
    }
    res.writeHead(200, { "Content-Type": contentType(filePath) });
    res.end(data);
  });
}

function startServer(){
  const server = http.createServer((req, res) => {
    const filePath = safePath(req.url || "/");
    if (!filePath) {
      res.writeHead(400);
      res.end("Bad request");
      return;
    }
    serveFile(filePath, res);
  });

  server.listen(port, () => {
    console.log(`Dev server running at http://localhost:${port}`);
  });
}

function watch(){
  let timeout = null;
  const schedule = () => {
    clearTimeout(timeout);
    timeout = setTimeout(() => {
      try {
        build();
      } catch (err) {
        console.error(err);
      }
    }, 120);
  };

  const watchPaths = [
    path.join(root, "src"),
    path.join(root, "content.json"),
  ];

  watchPaths.forEach((watchPath) => {
    if (!fs.existsSync(watchPath)) return;
    fs.watch(watchPath, { recursive: true }, (eventType, filename) => {
      if (!filename) return;
      if (filename.includes("content-data.html")) return;
      schedule();
    });
  });
}

try {
  build();
} catch (err) {
  console.error(err);
}

startServer();
watch();
