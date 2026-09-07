import { act, fireEvent, render, screen } from "@testing-library/react";
import { beforeEach, expect, it, vi } from "vitest";
import { CompareApp, DIFFERENT_NOTES } from "./CompareApp";
import { getRequestedSelection } from "../recorder/hooks/usePreferences";
import { FINGERING_STATES, ALL_HOLES } from "../recorder/data/fingerings";

const push = vi.hoisted(() => vi.fn());
vi.mock("next/navigation", () => ({ useRouter: () => ({ push }) }));
beforeEach(() => { window.history.replaceState({}, "", "/compare"); });
it("derives the three differences and renders both exact hole maps", async () => {
  expect(DIFFERENT_NOTES).toEqual(["fa", "faSharp", "highFa"]);
  render(<CompareApp />);
  await act(async () => { await Promise.resolve(); });
  for (const note of DIFFERENT_NOTES) {
    fireEvent.click(screen.getByRole("radio", { name: note === "fa" ? "파" : note === "faSharp" ? "파♯/솔♭" : "높은 파" }));
    const scenes = screen.getAllByTestId("recorder-scene");
    for (const [index, system] of (["german", "baroque"] as const).entries()) {
      for (const hole of ALL_HOLES) expect(scenes[index].querySelector(`[data-hole-id="${hole}"]`)).toHaveAttribute("data-hole-state", FINGERING_STATES[system][note][hole]);
    }
  }
});
it("shows one scene when the note is shared and persists the chosen system", async () => {
  window.history.replaceState({}, "", "/compare?note=sol");
  render(<CompareApp />);
  await act(async () => { await Promise.resolve(); });
  expect(screen.getByText("이 음은 두 방식이 같아요")).toBeInTheDocument();
  expect(screen.getAllByTestId("recorder-scene")).toHaveLength(1);
  fireEvent.click(screen.getByRole("button", { name: "독일식으로 배우기" }));
  expect(push).toHaveBeenCalledWith("/?note=sol&bank=low");
  expect(JSON.parse(localStorage.getItem("recorder-learning.preferences.v1")!)).toMatchObject({ fingeringSystem: "german" });
});
it("validates note and bank deep links", () => {
  expect(getRequestedSelection(new URLSearchParams("note=highDo&bank=high"))).toEqual({ note: "highDo", bank: "high" });
  expect(getRequestedSelection(new URLSearchParams("note=faSharp&bank=low"))).toEqual({ note: "faSharp", bank: "chromatic" });
  expect(getRequestedSelection(new URLSearchParams("note=bad&bank=bad"))).toBeNull();
});
