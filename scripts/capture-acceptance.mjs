import assert from "node:assert/strict";
import { mkdirSync, writeFileSync } from "node:fs";
import { gzipSync } from "node:zlib";
import { chromium, expect } from "@playwright/test";

const base = process.argv[2] ?? "http://127.0.0.1:4174";
const directory = "docs/screenshots/v3";
mkdirSync(directory, { recursive: true });
const browser = await chromium.launch();
const results = { base, views: [], errors: [], scripts: [], assetlinks: null };
try {
  for (const [width, height, classroom] of [[360, 800, false], [844, 390, false], [1440, 900, false], [1920, 1080, true]]) {
    const page = await browser.newPage({ viewport: { width, height }, serviceWorkers: "block" });
    const scriptResponses = [];
    page.on("pageerror", error => results.errors.push(error.message));
    page.on("console", message => { if (message.type() === "error") results.errors.push(message.text()); });
    if (width === 1440) page.on("response", response => {
      if (response.request().resourceType() === "script") scriptResponses.push(response);
    });
    await page.emulateMedia({ reducedMotion: "reduce" });
    await page.addInitScript(() => localStorage.setItem("recorder-learning.preferences.v1", JSON.stringify({ onboardingCompleted: true, isMuted: true, speed: "normal" })));
    await page.goto(base);
    await expect(page.getByRole("radio", { name: "보통", exact: true })).toBeChecked();
    if (classroom) {
      await page.getByRole("switch", { name: /고대비/ }).check();
      await page.getByRole("button", { name: "수업 모드", exact: true }).click();
      await expect(page.locator("body")).toHaveAttribute("data-classroom", "true");
    }
    await expect(page.locator('.recorder-pose-stage[data-ready="true"]')).toBeVisible();
    await page.evaluate(() => document.fonts.ready);
    const dimensions = await page.evaluate(() => ({ viewport: innerWidth, content: document.documentElement.scrollWidth }));
    assert.ok(dimensions.content <= dimensions.viewport, `Horizontal overflow at ${width}`);
    const stage = await page.locator(".recorder-pose-stage").boundingBox();
    const canvasInk = await page.locator(".recorder-pose-stage canvas").evaluate(canvas => {
      const { data } = canvas.getContext("2d").getImageData(0, 0, canvas.width, canvas.height);
      let count = 0;
      for (let i = 0; i < data.length; i += 4) if (data[i + 3] > 0 && Math.min(data[i], data[i + 1], data[i + 2]) < 210) count++;
      return count;
    });
    assert.ok(canvasInk > 100, "Pose canvas is blank");
    if (classroom) {
      assert.ok(stage.height >= 900);
      const hole = await page.locator('[data-hole-id="L1"] .fingering-map__disc-outline').boundingBox();
      assert.ok(hole.width >= 44);
    }
    await page.evaluate(() => window.scrollTo(0, 0));
    const path = `${directory}/${width}${classroom ? "-classroom" : ""}.png`;
    await page.screenshot({ path, fullPage: !classroom });
    results.views.push({ width, height, classroom, dimensions, stage, canvasInk, path });
    for (const response of scriptResponses) results.scripts.push({ path: new URL(response.url()).pathname, gzip: gzipSync(await response.body()).length });
    if (width === 1440) {
      const response = await page.request.get(`${base}/.well-known/assetlinks.json`);
      assert.equal(response.status(), 200);
      assert.match(response.headers()["content-type"], /json/);
      const links = await response.json();
      assert.equal(links[0].target.package_name, "app.vercel.recorder_fingering_edu.twa");
      results.assetlinks = { status: response.status(), contentType: response.headers()["content-type"], package: links[0].target.package_name };
    }
    await page.close();
  }
} finally { await browser.close(); }
results.initialJsGzip = results.scripts.reduce((sum, script) => sum + script.gzip, 0);
assert.ok(results.initialJsGzip > 0 && results.initialJsGzip <= 250 * 1024);
assert.deepEqual(results.errors, []);
mkdirSync("output/verification/p13", { recursive: true });
writeFileSync("output/verification/p13/screenshots.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
