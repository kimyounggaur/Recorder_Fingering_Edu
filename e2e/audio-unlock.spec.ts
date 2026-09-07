import { expect, test } from "@playwright/test";

test("user gesture unlocks audio without browser errors", async ({ page }) => {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(error.message));
  page.on("console", message => { if (message.type() === "error") errors.push(message.text()); });
  await page.goto("/");
  await page.getByTestId("note-button-5").click();
  await page.getByRole("button", { name: "솔 소리 듣기", exact: true }).click();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled");
  await page.getByRole("button", { name: "솔 소리 듣기", exact: true }).click();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled");
  expect(errors).toEqual([]);
});
