import { expect, test } from "@playwright/test";

test("browser renders all 17 synth pitches and releases their audio nodes", async ({ page }) => {
  await page.goto("/");
  const rendered = await page.evaluate(async () => {
    // Vite serves the actual engine; OfflineAudioContext exercises browser DSP without speakers.
    const path = "/src/features/recorder/audio/WebAudioRecorderEngine.ts";
    const { WebAudioRecorderEngine, RECORDER_NOTE_FREQUENCIES_HZ } = await import(/* @vite-ignore */ path);
    const results = [];
    for (const [note, frequency] of Object.entries(RECORDER_NOTE_FREQUENCIES_HZ)) {
      const context = new OfflineAudioContext(1, 48000, 48000);
      const proxy = new Proxy(context, { get(target, key) {
        if (key === "state") return "running";
        const value = Reflect.get(target, key, target);
        return typeof value === "function" ? value.bind(target) : value;
      } });
      const engine = new WebAudioRecorderEngine({ contextFactory: () => proxy, vibrato: false });
      await engine.unlock();
      await engine.play(note);
      const buffer = await context.startRendering();
      const data = buffer.getChannelData(0);
      let energy = 0;
      let tail = 0;
      let real = 0;
      let imaginary = 0;
      for (let i = 4800; i < 19200; i += 1) {
        energy += data[i] ** 2;
        const angle = 2 * Math.PI * Number(frequency) * i / 48000;
        real += data[i] * Math.cos(angle);
        imaginary += data[i] * Math.sin(angle);
      }
      for (let i = 43200; i < 48000; i += 1) tail += data[i] ** 2;
      results.push({ note, rms: Math.sqrt(energy / 14400), fundamental: Math.hypot(real, imaginary) / 14400, tail, voices: engine.activeVoiceCount });
    }
    return results;
  });
  expect(rendered).toHaveLength(17);
  for (const note of rendered) {
    expect(note.rms, note.note).toBeGreaterThan(0.04);
    expect(note.fundamental, note.note).toBeGreaterThan(0.03);
    expect(note.tail, note.note).toBe(0);
    expect(note.voices, note.note).toBe(0);
  }
});
