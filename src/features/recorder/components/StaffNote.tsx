interface StaffNoteProps {
  step: number;
  label: string;
  accidental?: "sharp";
  enharmonicLabel?: string;
}

export function StaffNote({ step, label, accidental, enharmonicLabel }: StaffNoteProps) {
  const noteY = 106 - step * 7;
  const ledgerLines: number[] = [];
  for (let y = 106; y <= noteY; y += 14) ledgerLines.push(y);
  for (let y = 22; y >= noteY; y -= 14) ledgerLines.push(y);
  const stemDown = noteY < 64;
  const stemX = stemDown ? 103 : 127;
  const stemEndY = noteY + (stemDown ? 45 : -45);

  return (
    <svg
      className="staff-note"
      viewBox="0 0 220 132"
      role="img"
      aria-label={`${label} 음의 높이`}
    >
      <g aria-hidden="true">
        <g className="staff-clef" data-testid="treble-clef" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
          <path d="M42 91 C23 84 27 61 42 58 C60 54 67 74 55 82 C43 89 31 76 39 68 C44 63 51 66 51 72 M43 104 C57 112 53 95 48 75 L39 36 C32 14 51 12 47 32 C45 44 24 54 27 70 C29 86 53 94 60 79" />
        </g>
        <text x="43" y="13" textAnchor="middle" fontSize="12" fill="currentColor">8</text>
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
            className="staff-line staff-ledger"
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
          x1={stemX}
          x2={stemX}
          y1={noteY}
          y2={stemEndY}
          className="staff-stem"
        />
        {enharmonicLabel ? <text x="110" y="129" textAnchor="middle" fontSize="11" fill="currentColor">{enharmonicLabel}</text> : null}
      </g>
    </svg>
  );
}
