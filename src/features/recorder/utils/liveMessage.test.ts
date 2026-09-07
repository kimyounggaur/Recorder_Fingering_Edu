import { describe, expect, it } from "vitest";
import { FINGERING_STATES } from "../data/fingerings";
import { describeFingeringForLive, withKoreanSubjectParticle } from "./liveMessage";

describe("liveMessage", () => {
  it("chooses the Korean subject particle", () => {
    expect(withKoreanSubjectParticle("솔")).toBe("솔이");
    expect(withKoreanSubjectParticle("도")).toBe("도가");
    expect(withKoreanSubjectParticle("")).toBe("");
  });
  it("announces closed holes", () => {
    expect(describeFingeringForLive(FINGERING_STATES.baroque.do)).toContain("0, 1, 2, 3, 4, 5, 6, 7번 구멍을 막습니다.");
  });
  it("distinguishes thumb half opening and partial double holes", () => {
    expect(describeFingeringForLive({ ...FINGERING_STATES.baroque.do, T0: "half", R7: "partial" })).toContain("0번 엄지구멍은 반만 엽니다. 7번 이중 구멍은 한쪽만 막습니다.");
  });
});
