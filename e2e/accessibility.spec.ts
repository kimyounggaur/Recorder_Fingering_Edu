import AxeBuilder from "@axe-core/playwright";
import { expect, test } from "@playwright/test";
import { openNotes, openTool, waitForLesson } from "./teacher-helpers";

const screens = ["onboarding", "lesson", "notes", "settings", "courses", "compare", "quiz", "quiz-build", "basics", "classroom"] as const;
for (const theme of ["default", "high-contrast"]) {
  for (const screen of screens) {
    test(`axe ${theme} ${screen}`, async ({ page }, testInfo) => {
      await page.emulateMedia({ reducedMotion: "reduce" });
      await page.addInitScript(({ theme, screen }) => {
        localStorage.setItem("recorder-learning.preferences.v1", JSON.stringify({
          theme, onboardingCompleted: screen !== "onboarding", isMuted: true,
        }));
      }, { theme, screen });
      const route = screen === "compare" || screen === "quiz" || screen === "basics" ? `/${screen}` : screen === "quiz-build" ? "/quiz" : "/";
      await page.goto(route);
      if (route === "/") await waitForLesson(page);
      if (screen === "onboarding") await openTool(page, "환경 설정", "리코더 체계 안내");
      if (screen === "notes") await openNotes(page);
      if (screen === "settings") await openTool(page, "환경 설정", "화면·소리 설정");
      if (screen === "courses") await openTool(page, "수업 도구", "연습 코스");
      if (screen === "compare") await expect(page.getByRole("button", { name: "독일식으로 배우기" })).toBeEnabled();
      if (screen === "quiz" || screen === "quiz-build") await expect(page.getByRole("button", { name: "퀴즈 시작" })).toBeEnabled();
      if (screen === "basics") await expect(page.getByRole("button", { name: "다음 카드", exact: true })).toBeEnabled();
      if (screen === "classroom") {
        await openTool(page, "수업 도구", "수업 모드");
        await expect(page.locator("body")).toHaveAttribute("data-classroom", "true");
      }
      if (screen === "quiz-build") {
        await page.getByRole("radio", { name: "계이름 보고 구멍 막기" }).check();
        await page.getByRole("button", { name: "퀴즈 시작" }).click();
        await expect(page.getByRole("button", { name: "확인", exact: true })).toBeVisible();
      }
      await expect(page.locator("html")).toHaveAttribute("data-theme", theme);
      await page.evaluate(() => document.fonts.ready);
      const result = await new AxeBuilder({ page }).analyze();
      await testInfo.attach("axe", { body: JSON.stringify(result, null, 2), contentType: "application/json" });
      const violations = result.violations.filter(({ impact }) => impact === "serious" || impact === "critical");
      expect(violations.map(({ id, nodes }) => ({ id, nodes: nodes.map(({ target, failureSummary }) => ({ target, failureSummary })) }))).toEqual([]);
    });
  }
}
