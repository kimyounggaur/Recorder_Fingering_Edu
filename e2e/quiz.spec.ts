import { expect, test } from "@playwright/test";

test("build quiz scores three toggled holes and completes ten questions", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/quiz");
  await page.getByRole("radio", { name: "계이름 보고 구멍 막기" }).check();
  await page.getByRole("button", { name: "퀴즈 시작" }).click();
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByRole("heading", { name: `문제 ${i}/10`, exact: true })).toBeVisible();
    if (i === 1) for (const number of [0, 1, 2]) await page.getByRole("button", { name: new RegExp(`^${number}번 구멍`) }).click();
    await page.getByRole("button", { name: "확인", exact: true }).click();
    await expect(page.getByText(/8개 중 \d개!/)).toBeVisible();
    await expect(page.getByRole("button", { name: /^0번 구멍/ })).toHaveAttribute("aria-disabled", "true");
    await page.getByRole("button", { name: i === 10 ? "결과 보기" : "다음 문제" }).click();
  }
  await expect(page.getByText("10문제 완료")).toBeVisible();
  expect(errors).toEqual([]);
});

test("identify quiz accepts number keys and completes ten questions", async ({ page }) => {
  await page.goto("/quiz");
  await page.getByRole("button", { name: "퀴즈 시작" }).click();
  for (let i = 1; i <= 10; i++) {
    await expect(page.getByRole("heading", { name: `문제 ${i}/10`, exact: true })).toBeVisible();
    await page.keyboard.press(String(i % 4 + 1));
    await expect(page.locator(".quiz-feedback")).toBeVisible();
  }
  await expect(page.getByText("10문제 완료")).toBeVisible();
  const stored = await page.evaluate(() => JSON.parse(localStorage.getItem("recorder-learning.preferences.v1")!));
  expect(stored).not.toHaveProperty("score");
  await page.reload();
  await expect(page.getByRole("button", { name: "퀴즈 시작" })).toBeVisible();
});
