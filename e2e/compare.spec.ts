import { expect, test } from "@playwright/test";

test("comparison selects the German system and returns to the fa pose", async ({ page }) => {
  await page.goto("/compare");
  await expect(page.getByTestId("recorder-scene")).toHaveCount(2);
  await expect(page.getByTestId("recorder-scene").first().locator('[data-hole-id="R6"]')).toHaveAttribute("data-hole-state", "open");
  await expect(page.getByTestId("recorder-scene").last().locator('[data-hole-id="R6"]')).toHaveAttribute("data-hole-state", "closed");
  await page.getByRole("button", { name: "독일식으로 배우기" }).click();
  await expect(page).toHaveURL(/note=fa&bank=low/);
  await expect(page.getByRole("radio", { name: "독일식" })).toBeChecked();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-note", "fa");
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", /fa-german.png$/);
});
