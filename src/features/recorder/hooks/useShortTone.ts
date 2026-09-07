import { useCallback, useEffect, useRef } from "react";
import type { UseRecorderAudioResult } from "../audio/useRecorderAudio";

export function useShortTone(audio: UseRecorderAudioResult) {
  const { beginPlaybackRequest, playAtContact, cancelPlaybackRequest } = audio;
  const timer = useRef<number | undefined>(undefined);
  const request = useRef<number | undefined>(undefined);
  const stop = useCallback(() => {
    window.clearTimeout(timer.current);
    if (request.current !== undefined) cancelPlaybackRequest(request.current, 25);
    request.current = undefined;
  }, [cancelPlaybackRequest]);
  const play = useCallback((note: string, durationMs: number) => {
    stop();
    const id = beginPlaybackRequest();
    request.current = id;
    void playAtContact(note, id);
    timer.current = window.setTimeout(() => {
      if (request.current === id) { cancelPlaybackRequest(id, 25); request.current = undefined; }
    }, durationMs);
  }, [beginPlaybackRequest, playAtContact, cancelPlaybackRequest, stop]);
  useEffect(() => stop, [stop]);
  return { play, stop };
}
