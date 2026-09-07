import { ArrowLeft } from "lucide-react";
import Link from "next/link";
import type { ReactNode } from "react";

export function LessonPageShell({ title, children }: { title: string; children: ReactNode }) {
  return <div className="lesson-page" onContextMenu={event => event.preventDefault()} onDragStart={event => event.preventDefault()}>
    <header className="lesson-page-header">
      <div><p className="eyebrow">리코더 운지법 배우기</p><h1>{title}</h1></div>
      <Link className="secondary-button" href="/"><ArrowLeft size={18} />운지 배우기</Link>
    </header>
    <main>{children}</main>
  </div>;
}
