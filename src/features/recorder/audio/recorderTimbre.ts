export interface TimbreGraph {
  sources: AudioScheduledSourceNode[];
  nodes: AudioNode[];
}

export function createChiffBuffer(context: AudioContext): AudioBuffer {
  const buffer = context.createBuffer(1, Math.round(context.sampleRate * 0.05), context.sampleRate);
  const samples = buffer.getChannelData(0);
  for (let i = 0; i < samples.length; i += 1) samples[i] = Math.random() * 2 - 1;
  return buffer;
}

export function createRecorderTimbre(
  context: AudioContext,
  frequency: number,
  destination: AudioNode,
  noiseBuffer: AudioBuffer,
  vibrato: boolean,
): TimbreGraph {
  const sources: AudioScheduledSourceNode[] = [];
  const nodes: AudioNode[] = [];
  const now = context.currentTime;
  try {
    const modulation = context.createGain();
    nodes.push(modulation);
    modulation.gain.setValueAtTime(1, now);
    modulation.connect(destination);
    const high = frequency >= 1000;
    for (const [multiple, level] of [[1, 1], [2, high ? 0.08 : 0.16], [3, high ? 0.03 : 0.06]]) {
      const oscillator = context.createOscillator();
      sources.push(oscillator);
      const gain = context.createGain();
      nodes.push(gain);
      oscillator.type = "sine";
      oscillator.frequency.setValueAtTime(frequency * multiple, now);
      gain.gain.setValueAtTime(level, now);
      oscillator.connect(gain).connect(modulation);
    }
    const chiff = context.createBufferSource();
    sources.push(chiff);
    chiff.buffer = noiseBuffer;
    const filter = context.createBiquadFilter();
    nodes.push(filter);
    filter.type = "bandpass";
    filter.frequency.setValueAtTime(2 * frequency, now);
    filter.Q.setValueAtTime(6, now);
    const noiseGain = context.createGain();
    nodes.push(noiseGain);
    noiseGain.gain.setValueAtTime(0.10, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.0001, now + 0.03);
    chiff.connect(filter).connect(noiseGain).connect(modulation);
    if (vibrato) {
      const lfo = context.createOscillator();
      sources.push(lfo);
      const depth = context.createGain();
      nodes.push(depth);
      lfo.type = "sine";
      lfo.frequency.setValueAtTime(4.5, now);
      depth.gain.setValueAtTime(0.015, now);
      lfo.connect(depth).connect(modulation.gain);
    }
    return { sources, nodes };
  } catch (error) {
    [...sources, ...nodes].forEach(node => node.disconnect());
    throw error;
  }
}
