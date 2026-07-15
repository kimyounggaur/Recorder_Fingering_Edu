import type { FingeringSystem } from "../model/types";
import type { NoteMeta } from "../data/noteMeta";
import { StaffNote } from "./StaffNote";

interface NoteCardProps {
  note: NoteMeta;
  system: FingeringSystem;
  onPlay: () => void;
  muted: boolean;
}

export function NoteCard({ note, system, onPlay, muted }: NoteCardProps) {
  const systemLabel = system === "baroque" ? "바로크식" : "독일식";

  return (
    <section className="card note-card" aria-labelledby="current-note-heading">
      <div className="card-eyebrow-row">
        <p className="eyebrow">지금 배울 음</p>
        <span className="status-badge">{systemLabel}</span>
      </div>
      <div className="note-card-main">
        <div>
          <p className="note-number">숫자 {note.button}</p>
          <h2 id="current-note-heading" className="current-solfege">
            {note.solfegeKo}
          </h2>
          <p className="note-name">음 이름 {note.noteName}</p>
        </div>
        <StaffNote step={note.staffStep} label={note.solfegeKo} />
      </div>
      <p className="note-short-instruction">{note.shortInstruction}</p>
      <button type="button" className="primary-button full-width" onClick={onPlay}>
        <span aria-hidden="true">♪</span>
        {muted ? "소리를 켜고 들어요" : `${note.solfegeKo} 소리 듣기`}
      </button>
    </section>
  );
}
