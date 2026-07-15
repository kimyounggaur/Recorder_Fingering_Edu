import { expect, test, type Page } from "@playwright/test";

type FingeringSystem = "baroque" | "german";

const NOTES = [
  { button: 1, solfege: "도", subject: "도가", name: "C" },
  { button: 2, solfege: "레", subject: "레가", name: "D" },
  { button: 3, solfege: "미", subject: "미가", name: "E" },
  { button: 4, solfege: "파", subject: "파가", name: "F" },
  { button: 5, solfege: "솔", subject: "솔이", name: "G" },
  { button: 6, solfege: "라", subject: "라가", name: "A" },
  { button: 7, solfege: "시", subject: "시가", name: "B" },
  { button: 8, solfege: "높은 도", subject: "높은 도가", name: "C′" },
] as const;

function watchForBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", (error) => errors.push(`pageerror: ${error.message}`));
  page.on("console", (message) => {
    if (message.type() === "error") {
      errors.push(`console: ${message.text()}`);
    }
  });
  return errors;
}

async function openAppAndChoose(
  page: Page,
  system: FingeringSystem,
): Promise<void> {
  await page.goto("/");
  // The banner is present in server HTML, so wait for the first client effect
  // (which persists defaults) before clicking an onboarding handler.
  await expect
    .poll(() =>
      page.evaluate(() =>
        window.localStorage.getItem("recorder-learning.preferences.v1"),
      ),
    )
    .not.toBeNull();
  const onboarding = page.getByRole("heading", {
    level: 2,
    name: "내 리코더의 운지 체계는 무엇인가요?",
  });
  await expect(onboarding).toBeVisible();

  const label = system === "baroque" ? "바로크식" : "독일식";
  await page.getByRole("button", { name: new RegExp(`^${label}`) }).click();

  await expect(onboarding).toBeHidden();
  await expect(page.getByRole("radio", { name: new RegExp(label) })).toBeChecked();
}

function hole(page: Page, id: string) {
  return page.locator(`[data-hole-id="${id}"]`);
}

test.beforeEach(async ({ page }) => {
  await page.addInitScript(() => window.localStorage.clear());
});

test("onboarding selection and all eight notes stay synchronized", async ({
  page,
}) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "german");

  for (const note of NOTES) {
    const button = page.getByTestId(`note-button-${note.button}`);
    await button.click();
    await expect(page.locator("#current-note-heading")).toHaveText(note.solfege);
    await expect(page.locator(".note-name")).toHaveText(`음 이름 ${note.name}`);
    await expect(button).toHaveAttribute("aria-pressed", "true");
    await expect(page.getByTestId("live-region")).toContainText(
      `${note.subject} 선택되었습니다.`,
    );
  }

  await page.getByRole("button", { name: "높은 도 소리 듣기" }).click();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute(
    "data-phase",
    "settled",
  );
  expect(browserErrors).toEqual([]);
});

test("파 opens only R6 and R7 when switching to german fingering", async ({
  page,
}) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");

  await page.getByTestId("note-button-4").click();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute(
    "data-closed-holes",
    "T0 L1 L2 L3 R4 R6 R7",
  );
  await expect(hole(page, "R5")).toHaveAttribute("data-hole-state", "open");
  await expect(hole(page, "R6")).toHaveAttribute("data-hole-state", "closed");
  await expect(hole(page, "R7")).toHaveAttribute("data-hole-state", "closed");

  await page.getByRole("radio", { name: /독일식/ }).check();

  await expect(page.getByText(/독일식 파예요/)).toBeVisible();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute(
    "data-closed-holes",
    "T0 L1 L2 L3 R4",
  );
  await expect(hole(page, "R4")).toHaveAttribute("data-hole-state", "closed");
  await expect(hole(page, "R5")).toHaveAttribute("data-hole-state", "open");
  await expect(hole(page, "R6")).toHaveAttribute("data-hole-state", "open");
  await expect(hole(page, "R7")).toHaveAttribute("data-hole-state", "open");
  expect(browserErrors).toEqual([]);
});

test("keyboard 5 selects 솔 and slow viewing can be enabled", async ({ page }) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");

  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("5");

  await expect(page.locator("#current-note-heading")).toHaveText("솔");
  await expect(page.locator(".note-name")).toHaveText("음 이름 G");
  await expect(page.getByTestId("note-button-5")).toHaveAttribute(
    "aria-pressed",
    "true",
  );

  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#current-note-heading")).toHaveText("라");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#current-note-heading")).toHaveText("솔");

  const slow = page.getByRole("radio", { name: /느리게/ });
  await slow.check();
  await expect(slow).toBeChecked();
  expect(browserErrors).toEqual([]);
});

test("360px mobile viewport has no horizontal scroll", async ({ page }) => {
  const browserErrors = watchForBrowserErrors(page);
  await page.setViewportSize({ width: 360, height: 800 });
  await openAppAndChoose(page, "baroque");

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
    bodyScrollWidth: document.body.scrollWidth,
  }));

  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  expect(dimensions.bodyScrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  await expect(page.getByTestId("note-button-8")).toBeVisible();
  expect(browserErrors).toEqual([]);
});

test("rapid 1→8→4→5 input remains on the final 솔 fingering", async ({
  page,
}) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");

  for (const button of [1, 8, 4, 5]) {
    await page.getByTestId(`note-button-${button}`).click();
  }

  // Wait past every normal-speed release/press/contact timer so that a stale
  // callback would have enough time to overwrite the final state.
  await page.waitForTimeout(1_200);

  await expect(page.locator("#current-note-heading")).toHaveText("솔");
  await expect(page.locator(".note-name")).toHaveText("음 이름 G");
  await expect(page.getByTestId("note-button-5")).toHaveAttribute(
    "aria-pressed",
    "true",
  );
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute(
    "data-closed-holes",
    "T0 L1 L2 L3",
  );
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute(
    "data-phase",
    "settled",
  );
  expect(browserErrors).toEqual([]);
});

test("help dialog traps focus and blocks background shortcuts", async ({ page }) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");

  const opener = page.getByRole("button", { name: "도움말" });
  await opener.click();
  const close = page.getByRole("button", { name: "도움말 닫기" });
  await expect(close).toBeFocused();

  await page.keyboard.press("5");
  await expect(page.locator("#current-note-heading")).toHaveText("도");
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();

  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toBeHidden();
  await expect(opener).toBeFocused();
  expect(browserErrors).toEqual([]);
});

test("interrupted motion keeps text aligned with the visible diff", async ({ page }) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");

  await page.getByRole("radio", { name: /느리게/ }).check();
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        document.querySelector<HTMLElement>('[data-testid="note-button-8"]')?.click();
        window.setTimeout(() => {
          document.querySelector<HTMLElement>('[data-testid="note-button-4"]')?.click();
          resolve();
        }, 10);
      }),
  );

  await expect(page.getByText(/지금 자세에서 파 운지로 바꿔요/)).toBeVisible();
  await expect(page.getByText("5번 · 오른손 가운데손가락")).toBeVisible();
  await expect(page.locator(".finger-chip-row.close")).toHaveCount(0);
  expect(browserErrors).toEqual([]);
});

test("844×390 landscape keeps the scene and note keypad in the first view", async ({
  page,
}) => {
  const browserErrors = watchForBrowserErrors(page);
  await page.setViewportSize({ width: 844, height: 390 });
  await openAppAndChoose(page, "baroque");

  await expect(page.locator(".scene-card")).toBeInViewport();
  await expect(page.locator(".keypad-card")).toBeInViewport();
  await expect(page.getByTestId("note-button-8")).toBeInViewport();

  const dimensions = await page.evaluate(() => ({
    clientWidth: document.documentElement.clientWidth,
    scrollWidth: document.documentElement.scrollWidth,
  }));
  expect(dimensions.scrollWidth).toBeLessThanOrEqual(dimensions.clientWidth);
  expect(browserErrors).toEqual([]);
});

test("sequence starts at 도 and resumes from a paused note", async ({ page }) => {
  const browserErrors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await page.getByTestId("note-button-5").click();
  await expect(page.locator("#current-note-heading")).toHaveText("솔");

  await page.getByRole("button", { name: "순서 연습 시작" }).click();
  await expect(page.locator("#current-note-heading")).toHaveText("도");
  await page.waitForTimeout(1_550);
  await expect(page.locator("#current-note-heading")).toHaveText("레");

  await page.getByRole("button", { name: "일시정지" }).click();
  await expect(page.getByRole("button", { name: "이어서 연습" })).toBeVisible();
  await page.waitForTimeout(1_550);
  await expect(page.locator("#current-note-heading")).toHaveText("레");

  await page.getByRole("button", { name: "이어서 연습" }).click();
  await expect(page.locator("#current-note-heading")).toHaveText("레");
  expect(browserErrors).toEqual([]);
});
