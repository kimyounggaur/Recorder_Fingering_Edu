import { fireEvent, render, screen } from "@testing-library/react";
import { useState } from "react";
import { expect, it } from "vitest";
import { RecorderFingeringMap } from "../recorder/components/RecorderFingeringMap";
import type { HoleId, HoleState } from "../recorder/model/types";

function Map() {
  const [holes, setHoles] = useState<Partial<Record<HoleId, HoleState>>>({});
  return <RecorderFingeringMap interactive holeStates={holes} onHoleChange={(id, state) => setHoles(current => ({ ...current, [id]: state }))} />;
}
it("cycles regular, thumb and double holes with click and keyboard", () => {
  render(<Map />);
  const thumb = screen.getByRole("button", { name: /^0번 구멍/ });
  fireEvent.click(thumb);
  expect(thumb).toHaveAttribute("data-hole-state", "closed");
  fireEvent.keyDown(thumb, { key: "Enter" });
  expect(thumb).toHaveAttribute("data-hole-state", "half");
  fireEvent.keyDown(thumb, { key: " " });
  expect(thumb).toHaveAttribute("data-hole-state", "open");
  const double = screen.getByRole("button", { name: /^7번 구멍/ });
  fireEvent.click(double); fireEvent.click(double);
  expect(double).toHaveAttribute("data-hole-state", "partial");
  fireEvent.click(double);
  expect(double).toHaveAttribute("data-hole-state", "open");
  const regular = screen.getByRole("button", { name: /^3번 구멍/ });
  fireEvent.click(regular); fireEvent.click(regular);
  expect(regular).toHaveAttribute("data-hole-state", "open");
});
it("locks every hole after scoring", () => {
  render(<RecorderFingeringMap interactive locked />);
  for (const hole of screen.getAllByRole("button")) {
    expect(hole).toHaveAttribute("aria-disabled", "true");
    expect(hole).not.toHaveAttribute("tabindex");
  }
});
