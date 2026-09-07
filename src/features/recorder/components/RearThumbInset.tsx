import type { SVGProps } from "react";
import type { AnimationPhase, HoleState } from "../model/types";
import { Hole, type HoleTransition } from "./Hole";

export interface RearThumbInsetProps
  extends Omit<SVGProps<SVGGElement>, "id"> {
  state: HoleState;
  transition?: HoleTransition;
  phase?: AnimationPhase;
  showNumber?: boolean;
}

/** Rear view for T0. It deliberately never places the thumb hole on the front. */
export function RearThumbInset({
  state,
  transition = "steady",
  phase,
  showNumber = true,
  className,
  ...groupProps
}: RearThumbInsetProps) {
  return (
    <g
      {...groupProps}
      id="thumb-rear-inset"
      className={["rear-thumb-inset", className].filter(Boolean).join(" ")}
      data-thumb-state={state}
      aria-hidden="true"
    >
      <path
        className="rear-thumb-inset__connector"
        d="M338 420 C385 420 394 366 425 348"
        fill="none"
        stroke="#6f8587"
        strokeWidth="4"
        strokeDasharray="10 10"
      />
      <rect
        className="rear-thumb-inset__panel"
        x="42"
        y="190"
        width="302"
        height="292"
        rx="34"
        fill="#f2f8f5"
        stroke="#6b8f8c"
        strokeWidth="5"
      />
      <rect
        className="rear-thumb-inset__heading-bg"
        x="70"
        y="211"
        width="162"
        height="48"
        rx="24"
        fill="#315f5c"
      />
      <text
        className="rear-thumb-inset__heading"
        x="151"
        y="244"
        textAnchor="middle"
        fill="#fffdf7"
        fontSize="23"
        fontWeight="800"
      >
        뒤쪽 엄지구멍
      </text>

      <path
        className="rear-thumb-inset__recorder-back"
        d="M155 272 Q180 260 205 272 L214 444 Q180 458 146 444 Z"
        fill="#e7efeb"
        stroke="#456a69"
        strokeWidth="6"
      />
      <path
        className="rear-thumb-inset__recorder-highlight"
        d="M168 279 L160 432"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="8"
        opacity="0.8"
      />

      <Hole
        id="T0"
        state={state}
        transition={transition}
        phase={phase}
        showNumber={showNumber}
      />

      <g className="rear-thumb-inset__hint">
        <rect x="72" y="415" width="185" height="43" rx="21" fill="#fffdf7" stroke="#a9c0bd" strokeWidth="3" />
        <text x="164" y="444" textAnchor="middle" fill="#315f5c" fontSize="20" fontWeight="700">
          0번은 리코더 뒤쪽
        </text>
      </g>
    </g>
  );
}

