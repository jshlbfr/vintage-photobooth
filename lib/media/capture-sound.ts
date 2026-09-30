/** Original synthesized effects. No microphone access and no downloaded samples. */
export class CaptureSound {
  private context: AudioContext | null = null;
  private playing = new Set<AudioScheduledSourceNode>();
  unlock() {
    try {
      this.context ??= new AudioContext();
      if (this.context.state === 'suspended') void this.context.resume().catch(() => {});
    } catch { /* Visual capture remains fully functional without audio. */ }
  }
  beep() {
    const ctx = this.context; if (!ctx || ctx.state === 'closed') return;
    const oscillator = ctx.createOscillator(), gain = ctx.createGain(), now = ctx.currentTime;
    oscillator.frequency.value = 880; oscillator.type = 'sine';
    gain.gain.setValueAtTime(0, now); gain.gain.linearRampToValueAtTime(.09, now + .006);
    gain.gain.exponentialRampToValueAtTime(.001, now + .085);
    oscillator.connect(gain); gain.connect(ctx.destination);
    this.start(oscillator, gain, now, .095);
  }
  shutter() {
    const ctx = this.context; if (!ctx || ctx.state === 'closed') return;
    // Two short damped mechanical clicks, distinct from the pure countdown tone.
    const buffer = ctx.createBuffer(1, Math.ceil(ctx.sampleRate * .12), ctx.sampleRate), data = buffer.getChannelData(0);
    let seed = 19;
    for (let i = 0; i < data.length; i++) {
      seed = (Math.imul(seed, 1664525) + 1013904223) | 0;
      const t = i / ctx.sampleRate, envelope = Math.exp(-t * 100) + (t > .047 ? .65 * Math.exp(-(t - .047) * 110) : 0);
      data[i] = (seed / 2147483648) * envelope;
    }
    const source = ctx.createBufferSource(), filter = ctx.createBiquadFilter(), gain = ctx.createGain();
    source.buffer = buffer; filter.type = 'bandpass'; filter.frequency.value = 1600; filter.Q.value = .65;
    gain.gain.value = .22; source.connect(filter); filter.connect(gain); gain.connect(ctx.destination);
    this.start(source, gain, ctx.currentTime, .12, filter);
  }
  private start(source: AudioScheduledSourceNode, gain: GainNode, at: number, duration: number, filter?: AudioNode) {
    this.playing.add(source);
    source.onended = () => { this.playing.delete(source); source.disconnect(); gain.disconnect(); filter?.disconnect(); };
    source.start(at); source.stop(at + duration);
  }
  stop() { for (const source of this.playing) { try { source.stop(); } catch {} } this.playing.clear(); }
  dispose() { this.stop(); if (this.context) void this.context.close().catch(() => {}); this.context = null; }
}
