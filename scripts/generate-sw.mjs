import { readFile, writeFile, readdir, mkdir, access } from "node:fs/promises";
import { join, dirname } from "node:path";
import { execFileSync } from "node:child_process";
import ts from "typescript";

const output = process.argv[2];
const source = await readFile("src/features/recorder/data/poseAssets.ts", "utf8");
const compiled = ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.ESNext } }).outputText;
const { RECORDER_POSE_SOURCES } = await import(`data:text/javascript;base64,${Buffer.from(compiled).toString("base64")}`);
const urls = new Set(["/", "/manifest.webmanifest", "/favicon.svg", "/icon-192.png", "/icon-512.png", ...RECORDER_POSE_SOURCES]);
for (const route of ["compare", "quiz", "basics"]) {
  try { await access(`app/${route}/page.tsx`); urls.add(`/${route}`); } catch { /* Added in its own phase. */ }
}
async function collectAssets(directory, prefix = "") {
  for (const item of await readdir(directory, { withFileTypes: true })) {
    const relative = `${prefix}/${item.name}`;
    if (item.isDirectory()) await collectAssets(join(directory, item.name), relative);
    // The app uses system fonts. Vinext may emit stale, unused font-cache files.
    else if (/\.(?:js|css)$/.test(item.name) && !/^\/sw(?:\.template)?\.js$/.test(relative)) urls.add(relative);
  }
}
if (output) await collectAssets(output);
let revision = "local";
try { revision = execFileSync("git", ["rev-parse", "--short", "HEAD"], { encoding: "utf8" }).trim(); } catch { /* Source archives need no Git installation. */ }
const version = `${revision}-${Date.now()}`;
const template = await readFile("public/sw.template.js", "utf8");
const worker = template.replace("__CACHE_VERSION__", version).replace("__PRECACHE_URLS__", JSON.stringify([...urls].sort(), null, 2));
await writeFile("public/sw.js", worker);
if (output) {
  await writeFile(join(output, "sw.js"), worker);
  const target = join(output, ".well-known/assetlinks.json");
  await mkdir(dirname(target), { recursive: true });
  await writeFile(target, await readFile("public/.well-known/assetlinks.json"));
}
console.log(`Service worker ${version}: ${urls.size} precached URLs${output ? ` in ${output}` : ""}`);
