"use client";

import { useEffect, useRef, useState } from "react";
import { ALL_NOTE_IDS, NOTE_META } from "../data/noteMeta";
import type { UseRecorderAudioResult } from "../audio/useRecorderAudio";
import { getRecorderNoteFrequency } from "../audio/WebAudioRecorderEngine";

const demoNotes = [...ALL_NOTE_IDS].sort((a, b) =>
  getRecorderNoteFrequency(NOTE_META[a].audioKey)! - getRecorderNoteFrequency(NOTE_META[b].audioKey)!,
);

export function AudioDebugDemo({ audio }: { audio: UseRecorderAudioResult }) {
  const [playing, setPlaying] = useState(false);
  const generation = useRef(0);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const ownRequest = useRef<number | null>(null);
  const { beginPlaybackRequest, playAtContact, cancelPlaybackRequest } = audio;
  useEffect(() => () => {
    generation.current += 1;
    if (timer.current !== null) clearTimeout(timer.current);
    if (ownRequest.current !== null) cancelPlaybackRequest(ownRequest.current);
  }, [cancelPlaybackRequest]);
  const toggle = () => {
    const id = ++generation.current;
    if (timer.current !== null) clearTimeout(timer.current);
    if (ownRequest.current !== null) cancelPlaybackRequest(ownRequest.current);
    if (playing) { setPlaying(false); return; }
    setPlaying(true);
    const play = (index: number) => {
      if (generation.current !== id) return;
      if (index === demoNotes.length) { setPlaying(false); return; }
      ownRequest.current = beginPlaybackRequest();
      void playAtContact(NOTE_META[demoNotes[index]].audioKey, ownRequest.current);
      timer.current = setTimeout(() => play(index + 1), 500);
    };
    play(0);
  };
  return <button type="button" onClick={toggle}>{playing ? "데모 정지" : `${ALL_NOTE_IDS.length}음 연속 재생(0.5초 간격)`}</button>;
}
