import { expect, test, type Page } from "@playwright/test";
import { chooseNote, closeTool, openNotes, openTool, waitForLesson } from "./teacher-helpers";

type FingeringSystem = "baroque" | "german";
const NOTES = [
  { digit: 1, solfege: "도", subject: "도가", name: "C4", pose: "do.png" },
  { digit: 2, solfege: "레", subject: "레가", name: "D4", pose: "re.png" },
  { digit: 3, solfege: "미", subject: "미가", name: "E4", pose: "mi.png" },
  { digit: 4, solfege: "파", subject: "파가", name: "F4", pose: "fa-german.png" },
  { digit: 5, solfege: "솔", subject: "솔이", name: "G4", pose: "sol.png" },
  { digit: 6, solfege: "라", subject: "라가", name: "A4", pose: "la.png" },
  { digit: 7, solfege: "시", subject: "시가", name: "B4", pose: "si.png" },
  { digit: 8, solfege: "높은 도", subject: "높은 도가", name: "C5", pose: "high-do.png" },
] as const;

function watchForBrowserErrors(page: Page): string[] {
  const errors: string[] = [];
  page.on("pageerror", error => errors.push(`pageerror: ${error.message}`));
  page.on("console", message => { if (message.type() === "error") errors.push(`console: ${message.text()}`); });
  page.on("requestfailed", request => {
    if (decodeURIComponent(request.url()).includes("/fingering/poses-focused/")) errors.push(`pose request failed: ${request.url()}`);
  });
  page.on("response", response => {
    if (decodeURIComponent(response.url()).includes("/fingering/poses-focused/") && !response.ok()) errors.push(`pose response ${response.status()}: ${response.url()}`);
  });
  return errors;
}

async function openAppAndChoose(page: Page, system: FingeringSystem) {
  await page.goto("/");
  await waitForLesson(page);
  await page.getByRole("radio", { name: new RegExp(system === "baroque" ? "바로크식" : "독일식") }).check();
  await page.getByRole("heading", { level: 1 }).click();
}

function hole(page: Page, id: string) { return page.locator(`[data-hole-id="${id}"]`); }

test.beforeEach(async ({ page }) => { await page.addInitScript(() => localStorage.clear()); });

test("main keeps only the three captured panels and tools open through nested menus", async ({ page }) => {
  await openAppAndChoose(page, "baroque");
  await expect(page.locator(".scene-card")).toBeVisible();
  await expect(page.locator(".note-card")).toBeVisible();
  await expect(page.locator(".settings-card")).toBeVisible();
  for (const selector of [".keypad-card", ".instruction-card", ".course-panel", ".onboarding-banner"]) {
    await expect(page.locator(selector)).toHaveCount(0);
  }
  await expect(page.getByRole("switch", { name: /고대비/ })).toHaveCount(0);
  await expect(page.getByTestId("step-mode-toggle")).toHaveCount(0);
  await openNotes(page);
  await expect(page.getByTestId("note-button-8")).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "음 선택", exact: true })).toBeFocused();
  await openTool(page, "환경 설정", "화면·소리 설정");
  await expect(page.getByRole("switch", { name: /고대비/ })).toBeVisible();
  await closeTool(page, "화면·소리 설정");
  await openTool(page, "환경 설정", "리코더 체계 안내");
  await page.getByRole("button", { name: /^독일식/ }).click();
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("radio", { name: /독일식/ })).toBeChecked();
});

test("menu selection keeps all eight notes, staff and poses synchronized", async ({ page }) => {
  test.setTimeout(60_000);
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "german");
  for (const note of NOTES) {
    await chooseNote(page, note.digit);
    await expect(page.locator("#current-note-heading")).toHaveText(note.solfege);
    await expect(page.locator(".note-name")).toHaveText(`음 이름 ${note.name}`);
    await expect(page.getByTestId("live-region")).toContainText(`${note.subject} 선택되었습니다.`);
    await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", `/fingering/poses-focused/${note.pose}`);
  }
  await page.getByRole("button", { name: "높은 도 소리 듣기", exact: true }).click();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled");
  expect(errors).toEqual([]);
});

test("파 changes only the expected holes when switching to German fingering", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await chooseNote(page, 4);
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", "/fingering/poses-focused/fa-baroque.png");
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-closed-holes", "T0 L1 L2 L3 R4 R6 R7");
  await expect(hole(page, "R5")).toHaveAttribute("data-hole-state", "open");
  await page.getByRole("radio", { name: /독일식/ }).check();
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-closed-holes", "T0 L1 L2 L3 R4");
  for (const id of ["R5", "R6", "R7"]) await expect(hole(page, id)).toHaveAttribute("data-hole-state", "open");
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", "/fingering/poses-focused/fa-german.png");
  expect(errors).toEqual([]);
});

test("keyboard note shortcuts still work from the main screen", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("5");
  await expect(page.locator("#current-note-heading")).toHaveText("솔");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#current-note-heading")).toHaveText("라");
  await page.keyboard.press("ArrowLeft");
  await expect(page.locator("#current-note-heading")).toHaveText("솔");
  await page.getByRole("radio", { name: "느리게", exact: true }).check();
  await expect(page.getByRole("radio", { name: "느리게", exact: true })).toBeChecked();
  expect(errors).toEqual([]);
});

test("high and chromatic shortcuts retain half and partial hole states", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await page.keyboard.press("Shift+Digit4");
  await expect(page.locator("#current-note-heading")).toHaveText("높은 파");
  await expect(hole(page, "T0")).toHaveAttribute("data-hole-state", "half");
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", "/fingering/poses-focused/f5-baroque.png");
  await page.keyboard.press("Alt+Digit1");
  await expect(page.locator("#current-note-heading")).toHaveText("도♯/레♭");
  await expect(hole(page, "R7")).toHaveAttribute("data-hole-state", "partial");
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", "/fingering/poses-focused/cs4.png");
  await page.evaluate(() => window.dispatchEvent(new KeyboardEvent("keydown", { key: "5", code: "Digit5", ctrlKey: true, bubbles: true, cancelable: true })));
  await expect(page.locator("#current-note-heading")).toHaveText("솔");
  expect(errors).toEqual([]);
});

test("rapid 1→8→4→5 input settles on the final 솔 fingering", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  for (const digit of [1, 8, 4, 5]) await page.keyboard.press(String(digit));
  await expect(page.locator("#current-note-heading")).toHaveText("솔");
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-closed-holes", "T0 L1 L2 L3");
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled");
  await expect(page.locator(".recorder-pose-stage")).toHaveAttribute("data-rendered-source", "/fingering/poses-focused/sol.png");
  expect(errors).toEqual([]);
});

test("transition guidance collapses after the hand and hole map settle", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await page.getByRole("radio", { name: "느리게", exact: true }).check();
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("8");
  await expect(page.locator(".recorder-scene__changes")).toBeVisible();
  await expect(page.locator(".scene-match-status")).toHaveCount(0);
  await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled", { timeout: 5_000 });
  await expect(page.locator(".recorder-scene__changes")).toHaveCount(0);
  await expect(page.locator(".scene-match-status")).toBeVisible();
  expect(errors).toEqual([]);
});

test("menus and dialogs block background shortcuts and restore focus", async ({ page }) => {
  await openAppAndChoose(page, "baroque");
  const menu = page.getByRole("button", { name: "음 선택", exact: true });
  await menu.click();
  await page.keyboard.press("5");
  await page.keyboard.press("ArrowRight");
  await expect(page.locator("#current-note-heading")).toHaveText("도");
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
  await openNotes(page);
  const close = page.getByRole("button", { name: "음 선택 닫기", exact: true });
  await expect(close).toBeFocused();
  await page.keyboard.press("5");
  await expect(page.locator("#current-note-heading")).toHaveText("도");
  await page.keyboard.press("Shift+Tab");
  await expect(page.getByTestId("note-button-8")).toBeFocused();
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(menu).toBeFocused();
});

test("help dialog traps focus and blocks background shortcuts", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await openTool(page, "환경 설정", "도움말");
  const close = page.getByRole("button", { name: "도움말 닫기" });
  await expect(close).toBeFocused();
  await page.keyboard.press("5");
  await expect(page.locator("#current-note-heading")).toHaveText("도");
  for (const name of ["운지 체계 비교", "퀴즈", "기초 배우기"]) {
    await page.keyboard.press("Tab");
    await expect(page.getByRole("dialog").getByRole("link", { name, exact: true })).toBeFocused();
  }
  await page.keyboard.press("Tab");
  await expect(close).toBeFocused();
  await page.keyboard.press("Escape");
  await expect(page.getByRole("dialog")).toHaveCount(0);
  await expect(page.getByRole("button", { name: "환경 설정", exact: true })).toBeFocused();
  expect(errors).toEqual([]);
});

test("interrupted motion instructions remain available from the tools menu", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await page.getByRole("radio", { name: "느리게", exact: true }).check();
  await page.getByRole("heading", { level: 1 }).click();
  await page.keyboard.press("8");
  await page.keyboard.press("4");
  await openTool(page, "수업 도구", "손가락 안내");
  await expect(page.getByText(/지금 자세에서 파 운지로 바꿔요/)).toBeVisible();
  await expect(page.getByText("5번 · 오른손 가운데손가락")).toBeVisible();
  await expect(page.locator(".finger-chip-row.close")).toHaveCount(0);
  expect(errors).toEqual([]);
});

for (const viewport of [
  { width: 390, height: 844 },
  { width: 768, height: 1024 },
  { width: 844, height: 390 },
  { width: 1024, height: 768 },
  { width: 1440, height: 900 },
]) {
  test(`${viewport.width}×${viewport.height} keeps teacher controls accessible without horizontal scrolling`, async ({ page }) => {
    const errors = watchForBrowserErrors(page);
    await page.setViewportSize(viewport);
    await openAppAndChoose(page, "baroque");
    await expect(page.locator(".scene-card")).toBeVisible();
    await expect(page.locator(".keypad-card")).toHaveCount(0);
    await openNotes(page);
    await expect(page.getByTestId("note-button-8")).toBeVisible();
    await closeTool(page, "음 선택");
    await expect(page.getByTestId("recorder-scene")).toHaveAttribute("data-phase", "settled");
    await expect(page.locator(".scene-heading .fingering-legend")).toHaveCount(1);
    await expect(page.locator(".scene-match-status")).toHaveText("손 모양과 구멍 지도가 일치했어요.");
    await expect(page.locator(".scene-match-status")).toBeVisible();
    await expect(page.locator(".recorder-scene__changes")).toHaveCount(0);
    const dimensions = await page.evaluate(() => {
      const viewportWidth = document.documentElement.clientWidth;
      const horizontalCutoffs: string[] = [];
      for (const selector of [
        ".scene-card",
        ".settings-card",
        ".note-card",
        ".recorder-stage-frame",
        ".recorder-scene",
        ".recorder-pose-panel",
        ".fingering-map-panel",
      ]) {
        for (const element of document.querySelectorAll<HTMLElement>(selector)) {
          const bounds = element.getBoundingClientRect();
          if (bounds.width > 0 && (bounds.left < -1 || bounds.right > viewportWidth + 1)) horizontalCutoffs.push(selector);
        }
      }
      const localOverflow: string[] = [];
      for (const selector of [
        ".scene-heading__title",
        ".scene-heading__legend",
        ".scene-heading__status",
        ".settings-card",
        ".note-card",
        ".segmented-control",
        ".segment-option",
        ".note-short-instruction",
      ]) {
        for (const element of document.querySelectorAll<HTMLElement>(selector)) {
          if (element.clientWidth > 0 && element.scrollWidth > element.clientWidth + 1) localOverflow.push(selector);
        }
      }
      return {
        client: viewportWidth,
        scroll: document.documentElement.scrollWidth,
        body: document.body.scrollWidth,
        horizontalCutoffs,
        localOverflow,
      };
    });
    expect(dimensions.scroll).toBeLessThanOrEqual(dimensions.client);
    expect(dimensions.body).toBeLessThanOrEqual(dimensions.client);
    expect(dimensions.horizontalCutoffs).toEqual([]);
    expect(dimensions.localOverflow).toEqual([]);
    const scene = await page.getByTestId("recorder-scene").boundingBox();
    const map = await page.locator(".fingering-map-panel").boundingBox();
    expect(scene!.y + scene!.height - (map!.y + map!.height)).toBeLessThanOrEqual(24);
    const sceneStyles = await page.getByTestId("recorder-scene").evaluate((element) => {
      const style = getComputedStyle(element);
      return { gap: parseFloat(style.columnGap), padding: parseFloat(style.paddingLeft) };
    });
    const sceneCardPadding = await page.locator(".scene-card").evaluate((element) => parseFloat(getComputedStyle(element).paddingLeft));
    if (viewport.width <= 760) {
      expect(sceneCardPadding).toBe(12);
      expect(sceneStyles).toEqual({ gap: 8, padding: 8 });
    } else {
      expect(sceneCardPadding).toBe(4);
      expect(sceneStyles).toEqual({ gap: 3, padding: 3 });
    }
    const headingParts = await page.locator(".scene-heading__title, .scene-heading__legend, .scene-heading__status").evaluateAll((elements) => elements.flatMap((element) => {
      const bounds = element.getBoundingClientRect();
      const style = getComputedStyle(element);
      return style.display === "none" || bounds.width === 0 || bounds.height === 0
        ? []
        : [{ left: bounds.left, right: bounds.right, top: bounds.top, bottom: bounds.bottom }];
    }));
    for (let first = 0; first < headingParts.length; first += 1) {
      for (let second = first + 1; second < headingParts.length; second += 1) {
        const a = headingParts[first];
        const b = headingParts[second];
        expect(a.right <= b.left || b.right <= a.left || a.bottom <= b.top || b.bottom <= a.top).toBe(true);
      }
    }
    if (viewport.width !== 844) {
      await expect(page.locator(".scene-heading .fingering-legend")).toBeVisible();
      const card = await page.locator(".scene-card").boundingBox();
      const legend = await page.locator(".scene-heading .fingering-legend").boundingBox();
      expect(legend!.x).toBeGreaterThanOrEqual(card!.x);
      expect(legend!.x + legend!.width).toBeLessThanOrEqual(card!.x + card!.width);
    }
    if (viewport.width === 844) {
      await expect(page.locator(".scene-heading .fingering-legend")).toBeHidden();
      await expect(page.locator(".scene-status")).toBeHidden();
    } else if (viewport.width !== 390) {
      const match = await page.locator(".scene-match-status").boundingBox();
      const status = await page.locator(".scene-status").boundingBox();
      expect(match!.x + match!.width).toBeLessThanOrEqual(status!.x);
    }
    const sceneCard = await page.locator(".scene-card").boundingBox();
    const settings = await page.locator(".settings-card").boundingBox();
    const currentNote = await page.locator(".note-card").boundingBox();
    const firstSegmentOptions = await page.locator(".settings-card .segmented-control").first().locator(".segment-option").evaluateAll((elements) => elements.map((element) => {
      const bounds = element.getBoundingClientRect();
      return { x: bounds.x, y: bounds.y, width: bounds.width, height: bounds.height };
    }));
    if (viewport.width > 760) {
      expect(settings!.width).toBeGreaterThanOrEqual(159);
      expect(settings!.width).toBeLessThanOrEqual(201);
      expect(currentNote!.width).toBeCloseTo(settings!.width, 0);
      expect(currentNote!.x).toBeCloseTo(settings!.x, 0);
      expect(sceneCard!.x + sceneCard!.width).toBeLessThanOrEqual(settings!.x);
      expect(sceneCard!.width).toBeGreaterThan(settings!.width);
      expect(firstSegmentOptions[1].x).toBeCloseTo(firstSegmentOptions[0].x, 0);
      expect(firstSegmentOptions[1].y).toBeGreaterThanOrEqual(firstSegmentOptions[0].y + firstSegmentOptions[0].height - 1);
    } else {
      expect(settings!.y).toBeGreaterThanOrEqual(sceneCard!.y + sceneCard!.height);
      expect(firstSegmentOptions[1].y).toBeCloseTo(firstSegmentOptions[0].y, 0);
      expect(firstSegmentOptions[1].x).toBeGreaterThanOrEqual(firstSegmentOptions[0].x + firstSegmentOptions[0].width - 1);
    }
    const note = await page.locator(".note-card").boundingBox();
    const staff = await page.locator(".note-card .staff-note").boundingBox();
    expect(staff!.x).toBeGreaterThanOrEqual(note!.x);
    expect(staff!.x + staff!.width).toBeLessThanOrEqual(note!.x + note!.width);
    expect(errors).toEqual([]);
  });
}

test("sequence starts at 도 and resumes from a paused note", async ({ page }) => {
  const errors = watchForBrowserErrors(page);
  await openAppAndChoose(page, "baroque");
  await chooseNote(page, 5);
  await openTool(page, "수업 도구", "연습 코스");
  await page.getByRole("button", { name: "순서 연습 시작", exact: true }).click();
  await expect(page.locator("#current-note-heading")).toHaveText("도");
  await expect(page.locator("#current-note-heading")).toHaveText("레");
  await page.getByRole("button", { name: "일시정지", exact: true }).click();
  await expect(page.getByRole("button", { name: "이어서 연습", exact: true })).toBeVisible();
  const pausedNote = await page.locator("#current-note-heading").innerText();
  await page.waitForTimeout(1550);
  await expect(page.locator("#current-note-heading")).toHaveText(pausedNote);
  await page.getByRole("button", { name: "이어서 연습", exact: true }).click();
  await expect(page.locator("#current-note-heading")).toHaveText(pausedNote);
  expect(errors).toEqual([]);
});
