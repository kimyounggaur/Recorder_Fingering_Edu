import { chromium } from "@playwright/test";
import fs from "node:fs";

const base = process.argv[2] ?? "http://127.0.0.1:4173";
const browser = await chromium.launch();
const results = [];
try {
  const page = await browser.newPage({ viewport: { width: 1920, height: 1080 } });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("recorder-learning.preferences.v1", JSON.stringify({ theme: "high-contrast", onboardingCompleted: true })));
  for (const route of ["/", "/compare", "/quiz", "/basics", "/?classroom-check=1"]) {
    await page.goto(base + route);
    await page.waitForFunction(() => document.documentElement.dataset.theme === "high-contrast");
    if (route.includes("classroom-check")) await page.getByRole("button", { name: "수업 모드", exact: true }).click();
    await page.waitForTimeout(100);
    const result = await page.evaluate(() => {
      const rgba = value => {
        const channels = value.match(/[\d.]+/g)?.map(Number) ?? [0, 0, 0];
        return [...channels.slice(0, 3), channels[3] ?? 1];
      };
      const blend = (front, back) => front.slice(0, 3).map((channel, i) => channel * front[3] + back[i] * (1 - front[3]));
      const background = element => {
        const chain = [];
        for (let current = element; current; current = current.parentElement) chain.unshift(current);
        return chain.reduce((color, node) => blend(rgba(getComputedStyle(node).backgroundColor), color), [255, 255, 255]);
      };
      const luminance = color => color.map(v => v / 255).map(v => v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4).reduce((sum, v, i) => sum + v * [.2126, .7152, .0722][i], 0);
      const pairs = new Map();
      for (const element of document.querySelectorAll("body *")) {
        if (!(element instanceof HTMLElement) || !element.checkVisibility({ checkOpacity: true, checkVisibilityCSS: true })) continue;
        const text = [...element.childNodes].filter(node => node.nodeType === Node.TEXT_NODE).map(node => node.textContent.trim()).filter(Boolean).join(" ");
        if (!text) continue;
        const style = getComputedStyle(element);
        const bg = background(element), fg = blend(rgba(style.color), bg);
        const a = luminance(fg), b = luminance(bg);
        const contrast = (Math.max(a, b) + .05) / (Math.min(a, b) + .05);
        const key = `${fg.join(",")}/${bg.join(",")}`;
        if (!pairs.has(key)) pairs.set(key, { foreground: fg, background: bg, contrast, example: text.slice(0, 80) });
      }
      return [...pairs.values()];
    });
    results.push({ route, pairs: result, failures: result.filter(pair => pair.contrast < 7) });
  }
} finally { await browser.close(); }
fs.mkdirSync("output/verification/p10", { recursive: true });
fs.writeFileSync("output/verification/p10/contrast.json", JSON.stringify(results, null, 2));
console.log(JSON.stringify(results, null, 2));
if (results.some(result => result.failures.length)) process.exitCode = 1;
