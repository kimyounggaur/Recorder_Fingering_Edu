import { expect, test } from "@playwright/test";

test("all basics cards, posture, tonguing and return to learning", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  await page.goto("/basics");
  await page.getByRole("radio", { name: "서서" }).check();
  await expect(page.getByText("머리를 똑바로 하고 시선은 정면을 향합니다.")).toBeVisible();
  await page.getByRole("button", { name: "다음 카드" }).click();
  await expect(page.getByRole("heading", { name: "리코더 잡는 법" })).toBeVisible();
  await expect(page.locator(".map-hand-ring")).toHaveCount(8);
  await page.getByRole("button", { name: "다음 카드" }).click();
  await expect(page.getByRole("heading", { name: "입 모양", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "다음 카드" }).click();
  await page.getByRole("button", { name: "따라해 보기" }).click();
  await expect(page.locator('.tonguing-beats > [data-active="true"]')).toHaveCount(1);
  await page.getByRole("button", { name: "정지", exact: true }).click();
  await expect(page.locator('.tonguing-beats > [data-active="true"]')).toHaveCount(0);
  await page.getByRole("button", { name: "따라해 보기" }).click();
  await page.getByRole("button", { name: "다음 카드" }).click();
  await expect(page.locator(".tonguing-practice")).toHaveCount(0);
  await page.getByRole("link", { name: "운지 배우러 가기" }).click();
  await expect(page.getByTestId("recorder-scene")).toBeVisible();
  expect(errors).toEqual([]);
});
