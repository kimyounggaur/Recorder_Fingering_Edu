import { expect, test } from "@playwright/test";

test("1920 classroom is readable, keyboard controlled and restores selection and focus", async ({ page }) => {
  await page.setViewportSize({ width: 1920, height: 1080 });
  await page.goto("/");
  await page.getByTestId("note-button-2").click();
  await page.getByRole("switch", { name: /고대비/ }).check();
  await page.getByTestId("note-button-2").focus();
  await page.keyboard.press("t");
  await expect(page.locator("body")).toHaveAttribute("data-classroom", "true");
  await page.keyboard.press("5");
  await expect(page.locator(".classroom-solfege")).toHaveText("솔");
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", /sol.png$/);
  const stage = await page.locator(".recorder-pose-stage").boundingBox();
  const hole = await page.locator('[data-hole-id="L1"] .fingering-map__disc-outline').boundingBox();
  expect(stage!.height).toBeGreaterThanOrEqual(900);
  expect(hole!.width).toBeGreaterThanOrEqual(44);
  expect(Number(await page.locator(".classroom-solfege").evaluate(element => parseFloat(getComputedStyle(element).fontSize)))).toBeGreaterThanOrEqual(120);
  await page.keyboard.press("s");
  await page.keyboard.press("m");
  await page.keyboard.press("c");
  await page.keyboard.press("c");
  await page.screenshot({ path: "output/screenshots/p10/classroom-verified.png" });
  await page.keyboard.press("Escape");
  await expect(page.locator("body")).not.toHaveAttribute("data-classroom");
  await expect(page.getByTestId("note-button-2")).toBeFocused();
  await expect(page.getByTestId("note-button-2")).toHaveAttribute("aria-pressed", "true");
  await expect(page.getByRole("radio", { name: "보통", exact: true })).toBeChecked();
  await expect(page.locator("html")).toHaveAttribute("data-theme", "high-contrast");
});

test("classroom falls back when fullscreen is rejected", async ({ page }) => {
  await page.addInitScript(() => { document.documentElement.requestFullscreen = async () => { throw new Error("Fullscreen unavailable"); }; });
  await page.goto("/");
  await page.getByRole("button", { name: "수업 모드", exact: true }).click();
  await expect(page.locator("body")).toHaveAttribute("data-classroom", "true");
  await page.getByRole("button", { name: "나가기", exact: true }).click();
  await expect(page.locator("body")).not.toHaveAttribute("data-classroom");
});
