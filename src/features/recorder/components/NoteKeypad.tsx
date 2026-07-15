import type { SolfegeId } from "../model/types";
import { NOTE_META, NOTE_ORDER } from "../data/noteMeta";

interface NoteKeypadProps {
  selectedNote: SolfegeId;
  onSelect: (note: SolfegeId) => void;
}

export function NoteKeypad({ selectedNote, onSelect }: NoteKeypadProps) {
  return (
    <section className="card keypad-card" aria-labelledby="keypad-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">음 고르기</p>
          <h2 id="keypad-heading">숫자 버튼을 눌러 보세요</h2>
        </div>
        <p className="keyboard-hint">키보드 1–8도 사용할 수 있어요.</p>
      </div>
      <div className="note-keypad" role="group" aria-label="계이름 선택">
        {NOTE_ORDER.map((noteId) => {
          const note = NOTE_META[noteId];
          const selected = noteId === selectedNote;
          return (
            <button
              key={noteId}
              type="button"
              className="note-key"
              aria-label={`${note.button}번, ${note.solfegeKo}`}
              aria-pressed={selected}
              data-note-id={noteId}
              data-testid={`note-button-${note.button}`}
              onClick={() => onSelect(noteId)}
            >
              <span className="note-key-number">{note.button}</span>
              <span className="note-key-label">{note.solfegeKo}</span>
              <span className="note-key-mark" aria-hidden="true">
                {selected ? "✓" : "♪"}
              </span>
            </button>
          );
        })}
      </div>
    </section>
  );
}
