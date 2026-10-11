// Copies maplibre-gl's web worker into public/ so Expo serves it at /maplibre-gl-worker.mjs.
const fs = require("fs");
const path = require("path");
const src = path.join(__dirname, "..", "node_modules", "maplibre-gl", "dist", "maplibre-gl-worker.mjs");
const dst = path.join(__dirname, "..", "public", "maplibre-gl-worker.mjs");
if (fs.existsSync(src)) { fs.mkdirSync(path.dirname(dst), { recursive: true }); fs.copyFileSync(src, dst); console.log("Copied maplibre worker to public/"); }
