import { useId, type SVGProps } from "react";

export interface RecorderBodyProps
  extends Omit<SVGProps<SVGGElement>, "id"> {
  /** Optional stable prefix when multiple recorder scenes share one document. */
  instanceId?: string;
}

/** A generic, original educational soprano-recorder silhouette. */
export function RecorderBody({
  instanceId,
  className,
  ...groupProps
}: RecorderBodyProps) {
  const generatedId = useId().replace(/[^a-zA-Z0-9_-]/g, "");
  const prefix = instanceId ?? `recorder-${generatedId}`;
  const bodyGradientId = `${prefix}-body-gradient`;
  const jointGradientId = `${prefix}-joint-gradient`;

  return (
    <g
      {...groupProps}
      id="recorder-body"
      className={["recorder-body", className].filter(Boolean).join(" ")}
      aria-hidden="true"
    >
      <defs>
        <linearGradient id={bodyGradientId} x1="0" x2="1" y1="0" y2="0">
          <stop offset="0" stopColor="#dfe8e5" />
          <stop offset="0.28" stopColor="#fffdf7" />
          <stop offset="0.64" stopColor="#f5f1e8" />
          <stop offset="1" stopColor="#b9c9c7" />
        </linearGradient>
        <linearGradient id={jointGradientId} x1="0" x2="0" y1="0" y2="1">
          <stop offset="0" stopColor="#7eb7b1" />
          <stop offset="1" stopColor="#39756f" />
        </linearGradient>
      </defs>

      <path
        className="recorder-body__shadow"
        d="M431 260 C422 570 432 1040 447 1415 C450 1494 550 1494 553 1415 C568 1040 578 570 569 260 Z"
        fill="#173a3b"
        opacity="0.12"
        transform="translate(12 18)"
      />

      <path
        className="recorder-body__mouthpiece"
        d="M402 82 Q500 48 598 82 L584 202 Q577 238 548 262 L452 262 Q423 238 416 202 Z"
        fill={`url(#${bodyGradientId})`}
        stroke="#395b5c"
        strokeWidth="7"
        strokeLinejoin="round"
      />
      <path
        className="recorder-body__beak"
        d="M402 82 Q500 48 598 82 L589 128 Q500 106 411 128 Z"
        fill="#edf4f0"
        stroke="#395b5c"
        strokeWidth="6"
        strokeLinejoin="round"
      />
      <path
        className="recorder-body__windway"
        d="M448 143 Q500 128 552 143 L546 186 Q500 197 454 186 Z"
        fill="#253f43"
      />
      <path
        className="recorder-body__labium"
        d="M456 201 L544 201 L526 241 L474 241 Z"
        fill="#8bbcb6"
        stroke="#395b5c"
        strokeWidth="5"
      />

      <path
        className="recorder-body__tube"
        d="M432 252 C427 510 431 1040 449 1412 Q500 1443 551 1412 C569 1040 573 510 568 252 Z"
        fill={`url(#${bodyGradientId})`}
        stroke="#395b5c"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        className="recorder-body__highlight"
        d="M463 286 C452 598 459 1035 473 1374"
        fill="none"
        stroke="#ffffff"
        strokeLinecap="round"
        strokeWidth="13"
        opacity="0.65"
      />

      <path
        className="recorder-body__head-joint"
        d="M422 255 Q500 276 578 255 L574 302 Q500 323 426 302 Z"
        fill={`url(#${jointGradientId})`}
        stroke="#395b5c"
        strokeWidth="6"
      />
      <path
        className="recorder-body__foot-joint"
        d="M447 1375 Q500 1395 553 1375 L571 1482 Q500 1530 429 1482 Z"
        fill={`url(#${jointGradientId})`}
        stroke="#395b5c"
        strokeWidth="8"
        strokeLinejoin="round"
      />
      <path
        className="recorder-body__bell-opening"
        d="M443 1474 Q500 1507 557 1474"
        fill="none"
        stroke="#244f4d"
        strokeLinecap="round"
        strokeWidth="11"
      />

      <g className="recorder-body__decorative-rings">
        <path d="M430 780 Q500 797 570 780" fill="none" stroke="#7eb7b1" strokeWidth="8" />
        <path d="M437 1334 Q500 1351 563 1334" fill="none" stroke="#7eb7b1" strokeWidth="8" />
      </g>
    </g>
  );
}

