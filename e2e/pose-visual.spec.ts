import { expect, test } from "@playwright/test";
import { ALL_NOTE_IDS, NOTE_BANKS, NOTE_BANK_LABELS } from "../src/features/recorder/data/noteMeta";
import { getNoteBank } from "../src/features/recorder/data/practiceCourses";
import { getRecorderPoseSource } from "../src/features/recorder/data/poseAssets";

test("twenty aligned poses match reviewed visual baselines", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "chromium", "Fixed desktop Chromium visual baseline; functional tests cover mobile engines.");
  test.setTimeout(120_000);
  await page.setViewportSize({ width: 1440, height: 900 });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.addInitScript(() => localStorage.setItem("recorder-learning.preferences.v1", JSON.stringify({ onboardingCompleted: true, isMuted: true, speed: "normal" })));
  await page.goto("/");
  await expect(page.getByRole("radio", { name: "보통", exact: true })).toBeChecked();
  await page.evaluate(() => document.fonts.ready);
  let stageSize: { width: number; height: number } | null = null;
  for (const system of ["baroque", "german"] as const) {
    await page.getByRole("radio", { name: new RegExp(system === "baroque" ? "바로크식" : "독일식") }).check();
    const notes = system === "baroque" ? ALL_NOTE_IDS : ["fa", "faSharp", "highFa"] as const;
    for (const note of notes) {
      const bank = getNoteBank(note);
      await page.getByRole("tab", { name: new RegExp(NOTE_BANK_LABELS[bank]) }).click();
      const digit = NOTE_BANKS[bank].find(entry => entry.note === note)!.digit;
      await page.locator(".note-keypad button").nth(digit - 1).click();
      const source = getRecorderPoseSource(note, system);
      await expect(page.locator(`.recorder-pose-stage[data-ready="true"][data-rendered-source="${source}"]`)).toBeVisible();
      await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled");
      const bounds = await page.locator(".recorder-pose-stage").boundingBox();
      expect(bounds).not.toBeNull();
      stageSize ??= bounds;
      expect(bounds!.width).toBeCloseTo(stageSize!.width, 1);
      expect(bounds!.height).toBeCloseTo(stageSize!.height, 1);
      await expect(page.locator(".scene-card")).toHaveScreenshot(`${note}-${system}.png`, { maxDiffPixelRatio: 0.01, animations: "disabled" });
    }
  }
});
