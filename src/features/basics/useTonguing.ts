import { useCallback, useEffect, useRef, useState } from "react";
import type { UseRecorderAudioResult } from "../recorder/audio/useRecorderAudio";
import { useShortTone } from "../recorder/hooks/useShortTone";

export function useTonguing(audio: UseRecorderAudioResult, muted: boolean) {
  const [playing, setPlaying] = useState(false);
  const [beat, setBeat] = useState(0);
  const generation = useRef(0);
  const { play, stop } = useShortTone(audio);
  const toggle = useCallback(() => {
    generation.current++;
    if (playing) { setPlaying(false); stop(); return; }
    setBeat(0); setPlaying(true);
    if (!muted) play("G", 120);
  }, [muted, play, playing, stop]);
  useEffect(() => {
    if (!playing) return;
    const request = generation.current;
    const timer = window.setInterval(() => {
      if (request !== generation.current) return;
      setBeat(current => (current + 1) % 4);
      if (!muted) play("G", 120);
    }, 750);
    return () => window.clearInterval(timer);
  }, [muted, play, playing]);
  useEffect(() => () => { generation.current++; }, []);
  return { playing, beat, toggle };
}
