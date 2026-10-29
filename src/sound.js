// Generative ambient — no audio files. A soft drone + wind that shifts per world,
// plus terminal ticks. Everything is created after a user gesture (autoplay-safe).
export class Sound {
  constructor() {
    this.ready = false;
    this.enabled = true;
    this.ctx = null;
  }

  unlock() {
    if (this.ctx) { if (this.ctx.state === 'suspended') this.ctx.resume(); return; }
    try {
      const Ctx = window.AudioContext || window.webkitAudioContext;
      const ctx = new Ctx();
      this.ctx = ctx;

      this.master = ctx.createGain();
      this.master.gain.value = 0.0;
      this.master.connect(ctx.destination);

      // drone (two detuned oscillators through a warm lowpass)
      this.filter = ctx.createBiquadFilter();
      this.filter.type = 'lowpass';
      this.filter.frequency.value = 600;
      this.filter.connect(this.master);

      this.oscA = ctx.createOscillator(); this.oscA.type = 'sine'; this.oscA.frequency.value = 110;
      this.oscB = ctx.createOscillator(); this.oscB.type = 'sine'; this.oscB.frequency.value = 110 * 1.5;
      const gA = ctx.createGain(); gA.gain.value = 0.16;
      const gB = ctx.createGain(); gB.gain.value = 0.08;
      this.oscA.connect(gA).connect(this.filter);
      this.oscB.connect(gB).connect(this.filter);
      this.oscA.start(); this.oscB.start();

      // wind (filtered noise, slowly modulated)
      const buf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
      const d = buf.getChannelData(0);
      for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
      const noise = ctx.createBufferSource(); noise.buffer = buf; noise.loop = true;
      const bp = ctx.createBiquadFilter(); bp.type = 'bandpass'; bp.frequency.value = 500; bp.Q.value = 0.7;
      this.wind = ctx.createGain(); this.wind.gain.value = 0.05;
      noise.connect(bp).connect(this.wind).connect(this.master);
      noise.start();
      const lfo = ctx.createOscillator(); lfo.frequency.value = 0.08;
      const lfoG = ctx.createGain(); lfoG.gain.value = 0.04;
      lfo.connect(lfoG).connect(this.wind.gain); lfo.start();

      this.ready = true;
      this.fade(this.enabled ? 0.5 : 0.0, 2.5);
    } catch (e) {
      console.warn('Audio unavailable', e);
    }
  }

  fade(to, dur = 1.0) {
    if (!this.ready) return;
    const now = this.ctx.currentTime;
    this.master.gain.cancelScheduledValues(now);
    this.master.gain.setValueAtTime(this.master.gain.value, now);
    this.master.gain.linearRampToValueAtTime(to, now + dur);
  }

  toggle() {
    this.enabled = !this.enabled;
    this.fade(this.enabled ? 0.5 : 0.0, 0.6);
    return this.enabled;
  }

  // shift the drone's mood as the journey moves between worlds
  setWorld(index) {
    if (!this.ready) return;
    const base = 82 + (index % 6) * 11;
    const now = this.ctx.currentTime;
    this.oscA.frequency.linearRampToValueAtTime(base, now + 2.5);
    this.oscB.frequency.linearRampToValueAtTime(base * 1.5, now + 2.5);
    this.filter.frequency.linearRampToValueAtTime(400 + (index % 5) * 260, now + 2.5);
  }

  tick() {
    if (!this.ready || !this.enabled) return;
    const now = this.ctx.currentTime;
    const o = this.ctx.createOscillator();
    const g = this.ctx.createGain();
    o.type = 'square';
    o.frequency.value = 900 + Math.random() * 700;
    g.gain.value = 0.0;
    g.gain.setValueAtTime(0.04, now);
    g.gain.exponentialRampToValueAtTime(0.0001, now + 0.06);
    o.connect(g).connect(this.master);
    o.start(now); o.stop(now + 0.07);
  }
}
