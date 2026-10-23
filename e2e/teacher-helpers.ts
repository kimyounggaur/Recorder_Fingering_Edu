import { expect, type Page } from "@playwright/test";

export async function openTool(page: Page, menu: string, item: string) {
  await page.getByRole("button", { name: menu, exact: true }).click();
  await page.getByRole("button", { name: item, exact: true }).click();
}

export async function closeTool(page: Page, title: string) {
  await page.getByRole("button", { name: `${title} 닫기`, exact: true }).click();
}

export async function openNotes(page: Page, bank: "low" | "high" | "chromatic" = "low") {
  await openTool(page, "음 선택", { low: "낮은 계이름", high: "높은 계이름", chromatic: "반음" }[bank]);
  await expect(page.getByRole("dialog", { name: "음 선택", exact: true })).toBeVisible();
}

export async function chooseNote(page: Page, digit: number, bank: "low" | "high" | "chromatic" = "low") {
  await openNotes(page, bank);
  await page.getByTestId(bank === "low" ? `note-button-${digit}` : `note-button-${bank}-${digit}`).click();
  await closeTool(page, "음 선택");
}

export async function waitForLesson(page: Page) {
  await expect(page.locator("#current-note-heading")).toBeVisible();
  await expect.poll(() => page.evaluate(() => localStorage.getItem("recorder-learning.preferences.v1"))).not.toBeNull();
}
