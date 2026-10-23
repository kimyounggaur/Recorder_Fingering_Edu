import { expect, test } from "@playwright/test";
import { chooseNote, closeTool, openTool, waitForLesson } from "./teacher-helpers";

test("leftHand course manual mode advances with 다 했어요 button", async ({ page }) => {
  await page.goto("/");
  await waitForLesson(page);
  await openTool(page, "수업 도구", "연습 코스");
  await page.getByTestId("course-leftHand").click();
  await page.getByRole("switch", { name: "수동 진행" }).check();
  await page.getByRole("button", { name: "순서 연습 시작" }).click();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-note", "sol");
  for (const note of ["la", "si", "highDo", "highRe"]) {
    await page.getByRole("button", { name: "다 했어요! 다음" }).click();
    await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-note", note);
  }
  await expect(page.locator("#current-note-heading")).toHaveText("높은 레");
  await page.getByRole("button", { name: "다 했어요! 다음" }).click();
  await expect(page.getByRole("heading", { name: "왼손 코스 완주!" })).toBeVisible();
  await page.getByRole("button", { name: "한 번 더" }).click();
  await closeTool(page, "연습 코스");
  await chooseNote(page, 1);
  await openTool(page, "수업 도구", "연습 코스");
  await expect(page.getByRole("button", { name: "다 했어요! 다음" })).toHaveCount(0);
});
