import { ChevronDown } from "lucide-react";
import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";

export type TeacherPanel =
  | "notes-low"
  | "notes-high"
  | "notes-chromatic"
  | "courses"
  | "instructions"
  | "display"
  | "onboarding";

interface TeacherToolbarProps {
  onOpenPanel: (panel: TeacherPanel) => void;
  onClassroom: () => void;
  onHelp: () => void;
  onOpenChange: (open: boolean) => void;
}

const MENU_LABELS = {
  notes: "음 선택",
  tools: "수업 도구",
  resources: "학습 자료",
  settings: "환경 설정",
} as const;

type MenuId = keyof typeof MENU_LABELS;

export function TeacherToolbar({ onOpenPanel, onClassroom, onHelp, onOpenChange }: TeacherToolbarProps) {
  const [openMenu, setOpenMenu] = useState<MenuId | null>(null);
  const navigationRef = useRef<HTMLElement>(null);
  const triggerRefs = useRef<Partial<Record<MenuId, HTMLButtonElement | null>>>({});

  const closeMenu = useCallback((restoreFocus = true) => {
    if (restoreFocus && openMenu) triggerRefs.current[openMenu]?.focus();
    setOpenMenu(null);
    onOpenChange(false);
  }, [openMenu, onOpenChange]);

  useEffect(() => {
    if (!openMenu) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !navigationRef.current?.contains(event.target)) closeMenu();
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key !== "Escape") return;
      event.preventDefault();
      event.stopPropagation();
      closeMenu();
    };
    document.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("keydown", onKeyDown, true);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("keydown", onKeyDown, true);
    };
  }, [openMenu, closeMenu]);

  useEffect(() => () => onOpenChange(false), [onOpenChange]);

  const runAction = (action: () => void) => {
    // The dialog remembers this persistent trigger, rather than a submenu item.
    closeMenu();
    action();
  };

  const panelButton = (label: string, panel: TeacherPanel) => (
    <button type="button" onClick={() => runAction(() => onOpenPanel(panel))}>{label}</button>
  );

  return (
    <nav
      ref={navigationRef}
      className="teacher-navigation"
      aria-label="선생님 메뉴"
      onBlurCapture={(event) => {
        if (event.relatedTarget instanceof Node && !event.currentTarget.contains(event.relatedTarget)) closeMenu(false);
      }}
    >
      {(Object.entries(MENU_LABELS) as [MenuId, string][]).map(([id, label]) => (
        <div className="teacher-menu" key={id}>
          <button
            ref={(element) => { triggerRefs.current[id] = element; }}
            id={`teacher-menu-trigger-${id}`}
            type="button"
            className="teacher-menu-trigger"
            aria-expanded={openMenu === id}
            aria-controls={`teacher-menu-items-${id}`}
            onClick={() => {
              const next = openMenu === id ? null : id;
              setOpenMenu(next);
              onOpenChange(next !== null);
            }}
          >
            {label}<ChevronDown size={16} aria-hidden="true" />
          </button>
          <div
            id={`teacher-menu-items-${id}`}
            className="teacher-menu-items"
            aria-labelledby={`teacher-menu-trigger-${id}`}
            hidden={openMenu !== id}
          >
            {id === "notes" ? <>
              {panelButton("낮은 계이름", "notes-low")}
              {panelButton("높은 계이름", "notes-high")}
              {panelButton("반음", "notes-chromatic")}
            </> : null}
            {id === "tools" ? <>
              <button type="button" onClick={() => runAction(onClassroom)}>수업 모드</button>
              {panelButton("연습 코스", "courses")}
              {panelButton("손가락 안내", "instructions")}
            </> : null}
            {id === "resources" ? <>
              <Link href="/basics" onClick={() => closeMenu()}>기초 배우기</Link>
              <Link href="/compare" onClick={() => closeMenu()}>운지 체계 비교</Link>
              <Link href="/quiz" onClick={() => closeMenu()}>퀴즈</Link>
            </> : null}
            {id === "settings" ? <>
              {panelButton("화면·소리 설정", "display")}
              {panelButton("리코더 체계 안내", "onboarding")}
              <button type="button" onClick={() => runAction(onHelp)}>도움말</button>
            </> : null}
          </div>
        </div>
      ))}
    </nav>
  );
}
