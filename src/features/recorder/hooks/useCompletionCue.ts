import { useEffect } from "react";
import type { UseRecorderAudioResult } from "../audio/useRecorderAudio";

export function useCompletionCue(completed: boolean, muted: boolean, audio: UseRecorderAudioResult) {
  const { beginPlaybackRequest, playAtContact, cancelPlaybackRequest } = audio;
  useEffect(() => {
    if (!completed || muted) return;
    const timers: number[] = [];
    let request: number | undefined;
    let cancelled = false;
    ["C", "E", "G"].forEach((note, index) => {
      timers.push(window.setTimeout(() => {
        if (cancelled) return;
        request = beginPlaybackRequest();
        void playAtContact(note, request);
      }, index * 180));
    });
    timers.push(window.setTimeout(() => { if (request !== undefined) cancelPlaybackRequest(request, 25); }, 540));
    return () => {
      cancelled = true;
      timers.forEach(window.clearTimeout);
      if (request !== undefined) cancelPlaybackRequest(request, 25);
    };
  }, [completed, muted, beginPlaybackRequest, playAtContact, cancelPlaybackRequest]);
}
