import { describe, expect, it } from "vitest";
import { ALL_HOLES, FINGERING_STATES } from "../recorder/data/fingerings";
import { ALL_NOTE_IDS } from "../recorder/data/noteMeta";
import { createQuestions, pickDistractors, scoreFingering } from "./scoring";

describe("quiz scoring", () => {
  it("selects unique distractors without the answer and fills a short pool", () => {
    for (const answer of ALL_NOTE_IDS) {
      const options = pickDistractors(answer, ALL_NOTE_IDS);
      expect(options).toHaveLength(3);
      expect(new Set(options).size).toBe(3);
      expect(options).not.toContain(answer);
    }
    expect(pickDistractors("do", ["do", "re"])).toHaveLength(3);
  });
  it("accepts the other fingering system without misclassifying shared fingerings", () => {
    expect(scoreFingering(FINGERING_STATES.german.fa, "fa", "baroque")).toMatchObject({ exact: false, crossSystemMatch: "german" });
    expect(scoreFingering(FINGERING_STATES.german.sol, "sol", "baroque")).toMatchObject({ exact: true, crossSystemMatch: null });
  });
  it("distinguishes half and partial holes from closed holes", () => {
    expect(scoreFingering({ ...FINGERING_STATES.baroque.highMi, T0: "closed" }, "highMi", "baroque").perHole.T0).toBe("wrong");
    expect(scoreFingering({ ...FINGERING_STATES.baroque.doSharp, R7: "closed" }, "doSharp", "baroque").perHole.R7).toBe("wrong");
  });
  it("matches every note and system exactly and returns eight per-hole judgments", () => {
    for (const system of ["baroque", "german"] as const) for (const note of ALL_NOTE_IDS) {
      const score = scoreFingering(FINGERING_STATES[system][note], note, system);
      expect(score).toMatchObject({ correctCount: 8, total: 8, exact: true });
      expect(Object.keys(score.perHole)).toEqual(ALL_HOLES);
    }
  });
  it("creates ten questions with no consecutive duplicate even with repeated random values", () => {
    const questions = createQuestions(ALL_NOTE_IDS, 10, () => 0);
    expect(questions).toHaveLength(10);
    questions.slice(1).forEach((note, index) => expect(note).not.toBe(questions[index]));
  });
});
