import type { KeyboardEvent } from "react";
import type { NoteBank, SolfegeId } from "../model/types";
import {
  NOTE_BANK_LABELS,
  NOTE_BANK_MODIFIERS,
  NOTE_BANKS,
  NOTE_META,
} from "../data/noteMeta";

interface NoteKeypadProps {
  selectedNote: SolfegeId;
  activeBank: NoteBank;
  onBankChange: (bank: NoteBank) => void;
  onSelect: (note: SolfegeId, bank: NoteBank) => void;
}

const BANK_ORDER: readonly NoteBank[] = ["low", "high", "chromatic"];

const BANK_SHORTCUT_RANGES: Record<NoteBank, string> = {
  low: "Ctrl + 1–8",
  high: "Shift + 1–5",
  chromatic: "Alt + 1–5",
};

export function NoteKeypad({
  selectedNote,
  activeBank,
  onBankChange,
  onSelect,
}: NoteKeypadProps) {
  const panelId = `note-bank-panel-${activeBank}`;
  const handleBankKeyDown = (
    event: KeyboardEvent<HTMLButtonElement>,
    bank: NoteBank,
  ) => {
    const currentIndex = BANK_ORDER.indexOf(bank);
    const nextIndex =
      event.key === "ArrowLeft"
        ? (currentIndex - 1 + BANK_ORDER.length) % BANK_ORDER.length
        : event.key === "ArrowRight"
          ? (currentIndex + 1) % BANK_ORDER.length
          : event.key === "Home"
            ? 0
            : event.key === "End"
              ? BANK_ORDER.length - 1
              : null;

    if (nextIndex === null) return;
    event.preventDefault();
    const nextBank = BANK_ORDER[nextIndex];
    onBankChange(nextBank);
    window.requestAnimationFrame(() => {
      document.getElementById(`note-bank-tab-${nextBank}`)?.focus();
    });
  };

  return (
    <section className="card keypad-card" aria-labelledby="keypad-heading">
      <div className="section-heading-row">
        <div>
          <p className="eyebrow">음 고르기</p>
          <h2 id="keypad-heading">음역을 고르고 숫자를 눌러 보세요</h2>
        </div>
        <p className="keyboard-hint">기본 음계는 숫자 1–8만 눌러도 돼요.</p>
      </div>

      <div className="note-bank-tabs" role="tablist" aria-label="계이름 음역 선택">
        {BANK_ORDER.map((bank) => {
          const selected = bank === activeBank;
          return (
            <button
              key={bank}
              id={`note-bank-tab-${bank}`}
              type="button"
              role="tab"
              className="note-bank-tab"
              aria-controls={`note-bank-panel-${bank}`}
              aria-selected={selected}
              tabIndex={selected ? 0 : -1}
              data-testid={`note-bank-${bank}`}
              onClick={() => onBankChange(bank)}
              onKeyDown={(event) => handleBankKeyDown(event, bank)}
            >
              <span>{NOTE_BANK_LABELS[bank]}</span>
              <small>{BANK_SHORTCUT_RANGES[bank]}</small>
            </button>
          );
        })}
      </div>

      <div
        id={panelId}
        className="note-bank-panel"
        role="tabpanel"
        aria-labelledby={`note-bank-tab-${activeBank}`}
      >
        <p className="note-bank-caption">
          <strong>{NOTE_BANK_LABELS[activeBank]}</strong>
          <span>{BANK_SHORTCUT_RANGES[activeBank]}</span>
        </p>
        <div
          className="note-keypad"
          role="group"
          aria-label={`${NOTE_BANK_LABELS[activeBank]} 선택`}
          data-bank={activeBank}
        >
          {NOTE_BANKS[activeBank].map(({ note: noteId, digit }) => {
            const note = NOTE_META[noteId];
            const selected = noteId === selectedNote;
            const modifier = NOTE_BANK_MODIFIERS[activeBank];
            return (
              <button
              key={`${activeBank}-${noteId}`}
              type="button"
              className="note-key"
              aria-label={`${modifier}와 ${digit}번, ${note.solfegeKo}, ${note.noteName}`}
              aria-pressed={selected}
              data-note-id={noteId}
              data-note-bank={activeBank}
              data-testid={
                activeBank === "low"
                  ? `note-button-${digit}`
                  : `note-button-${activeBank}-${digit}`
              }
              onClick={() => onSelect(noteId, activeBank)}
              >
                <span className="note-key-number">{digit}</span>
                <span className="note-key-copy">
                  <span className="note-key-label">{note.solfegeKo}</span>
                  <span className="note-key-pitch">{note.noteName}</span>
                </span>
                <span className="note-key-mark" aria-hidden="true">
                  {selected ? "✓" : "♪"}
                </span>
              </button>
            );
          })}
        </div>
      </div>
    </section>
  );
}
