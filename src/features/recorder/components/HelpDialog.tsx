import { useEffect, useRef } from "react";
import { createPortal } from "react-dom";

interface HelpDialogProps {
  open: boolean;
  onClose: () => void;
}

export function HelpDialog({ open, onClose }: HelpDialogProps) {
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const dialogRef = useRef<HTMLElement>(null);
  const backdropRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!open) return;
    const previouslyFocused =
      document.activeElement instanceof HTMLElement ? document.activeElement : null;
    const portalElement = backdropRef.current;
    const backgroundElements = Array.from(document.body.children).filter(
      (element): element is HTMLElement =>
        element instanceof HTMLElement && element !== portalElement,
    );
    const previousBackgroundState = backgroundElements.map((element) => ({
      element,
      inert: element.inert,
      ariaHidden: element.getAttribute("aria-hidden"),
    }));

    backgroundElements.forEach((element) => {
      element.inert = true;
      element.setAttribute("aria-hidden", "true");
    });
    closeButtonRef.current?.focus();

    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        event.preventDefault();
        onClose();
        return;
      }

      if (event.key !== "Tab") return;
      const focusable = Array.from(
        dialogRef.current?.querySelectorAll<HTMLElement>(
          'button:not([disabled]), [href], input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ) ?? [],
      );
      if (focusable.length === 0) {
        event.preventDefault();
        return;
      }

      const first = focusable[0];
      const last = focusable.at(-1)!;
      if (
        focusable.length === 1 ||
        (!event.shiftKey && document.activeElement === last) ||
        (event.shiftKey && document.activeElement === first)
      ) {
        event.preventDefault();
        (event.shiftKey ? last : first).focus();
      }
    };
    window.addEventListener("keydown", onKeyDown);
    return () => {
      window.removeEventListener("keydown", onKeyDown);
      previousBackgroundState.forEach(({ element, inert, ariaHidden }) => {
        element.inert = inert;
        if (ariaHidden === null) element.removeAttribute("aria-hidden");
        else element.setAttribute("aria-hidden", ariaHidden);
      });
      previouslyFocused?.focus();
    };
  }, [open, onClose]);

  if (!open) return null;

  return createPortal(
    <div
      ref={backdropRef}
      className="dialog-backdrop"
      role="presentation"
      onMouseDown={onClose}
    >
      <section
        ref={dialogRef}
        className="help-dialog"
        role="dialog"
        aria-modal="true"
        aria-labelledby="help-heading"
        onMouseDown={(event) => event.stopPropagation()}
      >
        <div className="dialog-heading-row">
          <div>
            <p className="eyebrow">짧은 사용법</p>
            <h2 id="help-heading">리코더 운지법 배우기</h2>
          </div>
          <button ref={closeButtonRef} type="button" className="icon-button" onClick={onClose} aria-label="도움말 닫기">
            ×
          </button>
        </div>
        <ol className="help-steps">
          <li><strong>낮은 계이름·높은 계이름·반음</strong> 탭에서 배울 음을 고릅니다.</li>
          <li><strong>파란 ↑</strong> 손가락을 먼저 떼고, <strong>노란 ↓</strong> 손가락을 구멍에 붙입니다.</li>
          <li>천천히 보고 싶다면 <strong>느리게</strong> 또는 <strong>단계별 보기</strong>를 켭니다.</li>
        </ol>
        <div className="keyboard-guide">
          <span><kbd>1</kbd>–<kbd>8</kbd> 기본 음계</span>
          <span><kbd>Ctrl</kbd>+<kbd>1–8</kbd> 낮은 계이름</span>
          <span><kbd>Shift</kbd>+<kbd>1–5</kbd> 높은 계이름</span>
          <span><kbd>Alt</kbd>+<kbd>1–5</kbd> 반음</span>
          <span><kbd>←</kbd><kbd>→</kbd> 이전·다음</span>
          <span><kbd>Space</kbd> 음 재생</span>
        </div>
        <p className="help-note">브라우저가 Ctrl 또는 Alt 단축키를 먼저 사용할 때는 화면의 음역 탭과 숫자 버튼을 누르면 항상 선택할 수 있어요. 0번 엄지구멍은 뒤쪽 보조 그림으로 함께 보여 줍니다.</p>
      </section>
    </div>,
    document.body,
  );
}
