interface StaffNoteProps {
  step: number;
  label: string;
}

export function StaffNote({ step, label }: StaffNoteProps) {
  const noteY = 92 - step * 7;
  const needsLedger = step === 0;

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
        {needsLedger ? (
          <line x1="93" x2="137" y1="92" y2="92" className="staff-line" />
        ) : null}
        <ellipse cx="115" cy={noteY} rx="13" ry="9" className="staff-head" />
        <line
          x1="127"
          x2="127"
          y1={noteY}
          y2={Math.max(20, noteY - 45)}
          className="staff-stem"
        />
      </g>
    </svg>
  );
}
