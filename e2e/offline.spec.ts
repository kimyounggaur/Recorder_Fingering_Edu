import { expect, test } from "@playwright/test";
import { NOTE_BANKS } from "../src/features/recorder/data/noteMeta";
import { getRecorderPoseSource } from "../src/features/recorder/data/poseAssets";
import { chooseNote, closeTool, openNotes, waitForLesson } from "./teacher-helpers";

const offlineBaseURL = process.env.PLAYWRIGHT_OFFLINE_BASE_URL ?? "http://127.0.0.1:4174";

test("offline after first visit keeps all 17 poses", async ({ page, context, browserName }) => {
  test.skip(browserName !== "chromium", "Service worker offline lifecycle is verified in Chromium.");
  await page.goto(`${offlineBaseURL}/`);
  await waitForLesson(page);
  await page.evaluate(async () => {
    await navigator.serviceWorker.ready;
    if (!navigator.serviceWorker.controller) await new Promise<void>(resolve => navigator.serviceWorker.addEventListener("controllerchange", () => resolve(), { once: true }));
  });
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByTestId("recorder-scene")).toBeVisible();
  await openNotes(page);
  for (const bank of ["low", "high", "chromatic"] as const) {
    await page.getByTestId(`note-bank-${bank}`).click();
    for (const { note, digit } of NOTE_BANKS[bank]) {
      await page.getByTestId(bank === "low" ? `note-button-${digit}` : `note-button-${bank}-${digit}`).click();
      await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", getRecorderPoseSource(note, "baroque"));
    }
  }
  await closeTool(page, "음 선택");
  await page.getByRole("radio", { name: /독일식/ }).check();
  for (const [bank, note] of [
    ["low", "fa"],
    ["chromatic", "faSharp"],
    ["high", "highFa"],
  ] as const) {
    const digit = NOTE_BANKS[bank].find((entry) => entry.note === note)!.digit;
    await chooseNote(page, digit, bank);
    await expect(page.locator(".recorder-pose-stage")).toHaveAttribute(
      "data-rendered-source",
      getRecorderPoseSource(note, "german"),
    );
  }
  await context.setOffline(false);
});
