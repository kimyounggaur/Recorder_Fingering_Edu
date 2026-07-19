interface StaffNoteProps {
  step: number;
  label: string;
  accidental?: "sharp";
}

export function StaffNote({ step, label, accidental }: StaffNoteProps) {
  const noteY = 92 - step * 7;
  const ledgerLines = [92, 22].filter(
    (lineY) => (lineY === 92 && step === 0) || (lineY === 22 && step >= 10),
  );
  const stemEndY =
    noteY < 36 ? Math.min(104, noteY + 45) : Math.max(20, noteY - 45);

  return (
    <svg
      className="staff-note"
      viewBox="0 0 220 120"
      role="img"
      aria-label={`${label} 음의 높이`}
    >
      <g aria-hidden="true">
        {[0, 1, 2, 3, 4].map((line) => (
          <line
            key={line}
            x1="18"
            x2="202"
            y1={36 + line * 14}
            y2={36 + line * 14}
            className="staff-line"
          />
        ))}
        {ledgerLines.map((lineY) => (
          <line
            key={lineY}
            x1="93"
            x2="137"
            y1={lineY}
            y2={lineY}
            className="staff-line"
          />
        ))}
        {accidental === "sharp" ? (
          <text
            x="85"
            y={noteY + 8}
            className="staff-accidental"
            textAnchor="middle"
          >
            ♯
          </text>
        ) : null}
        <ellipse cx="115" cy={noteY} rx="13" ry="9" className="staff-head" />
        <line
          x1="127"
          x2="127"
          y1={noteY}
          y2={stemEndY}
          className="staff-stem"
        />
      </g>
    </svg>
  );
}
