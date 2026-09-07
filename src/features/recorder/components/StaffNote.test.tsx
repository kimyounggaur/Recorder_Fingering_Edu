import { render } from "@testing-library/react";
import { describe, expect, it } from "vitest";
import { StaffNote } from "./StaffNote";

describe("StaffNote", () => {
  it.each([[0, 106, 1], [2, 92, 0], [7, 57, 0], [11, 29, 0], [12, 22, 1], [14, 8, 2]])(
    "places staff step %i at y=%i with %i ledger lines", (step, y, ledgers) => {
      const { container, getByTestId } = render(<StaffNote step={step} label="음" />);
      expect(container.querySelector("ellipse")).toHaveAttribute("cy", String(y));
      expect(container.querySelectorAll(".staff-ledger")).toHaveLength(ledgers);
      const stem = container.querySelector(".staff-stem")!;
      expect(stem).toHaveAttribute("y2", String(y + (y < 64 ? 45 : -45)));
      expect(getByTestId("treble-clef")).toBeInTheDocument();
    },
  );
});
