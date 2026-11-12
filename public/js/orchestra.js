// A small Web Audio orchestra.
//
// Each instrument has its own part in one short, original 5-bar piece
// (D – Bm – G – A – D). Played alone, a part can sound simple; played
// together, the parts make a whole. Sounds are synthesized in the browser,
// so no audio files are required.
//
// Want real recordings instead? Drop licensed clips into /public/audio/
// named after the instrument id (e.g. audio/oboe.mp3, audio/tuba.m4a).
// When a file exists it is used instead of the synthesizer.

const BPM = 84;
const BEAT = 60 / BPM;
const CHORDS = [[50, 54, 57], [47, 50, 54], [43, 47, 50], [45, 49, 52], [50, 54, 57]]; // D Bm G A D
const MELODY = [
  [66, 69, 74, 69], [71, 69, 66, 62], [67, 71, 74, 76], [73, 71, 69, 73],
];

// Notes are [startBeat, lengthInBeats, midi, velocity]
function part(id) {
  const n = [];
  const bars = (fn) => CHORDS.forEach((c, b) => fn(c, b * 4, b));
  const melody = (shift = 0, from = 0) => {
    MELODY.forEach((bar, b) => { if (b >= from) bar.forEach((m, i) => n.push([b * 4 + i, 1, m + shift, 0.8])); });
    n.push([16, 4, 74 + shift, 0.8]);
  };
  switch (id) {
    case "violin": melody(0); break;
    case "oboe": melody(0); break;
    case "flute": melody(12, 2); break;
    case "trumpet":
      n.push([7, 1, 66, 0.6], [15, 1, 69, 0.7], [16, 4, 74, 0.8]); break;
    case "viola": bars((c, s) => { for (let i = 0; i < 8; i++) n.push([s + i / 2, 0.5, (i % 2 ? c[2] : c[1]) + 12, 0.45]); }); break;
    case "clarinet": bars((c, s) => n.push([s, 2, c[1] + 12, 0.5], [s + 2, 2, c[2] + 12, 0.5])); break;
    case "horn": bars((c, s) => n.push([s, 4, c[2], 0.5])); break;
    case "trombone": bars((c, s) => n.push([s, 4, c[1], 0.45])); break;
    case "cello": bars((c, s) => n.push([s, 2, c[0] - 12, 0.6], [s + 2, 2, c[2] - 12, 0.55])); break;
    case "bassoon": bars((c, s) => { for (let i = 0; i < 4; i++) n.push([s + i, 0.9, (i % 2 ? c[2] : c[0]) - 12, 0.5]); }); break;
    case "bass": bars((c, s) => n.push([s, 4, low(c[0]), 0.7])); break;
    case "tuba": bars((c, s, b) => { if (b % 2 === 0) n.push([s, 4, low(c[0]), 0.6]); }); break;
    case "timpani": bars((c, s, b) => { n.push([s, 2, c[0] - 12 < 38 ? c[0] : c[0] - 12, 0.9]); if (b < 4) n.push([s + 2, 2, 45, 0.6]); }); break;
    case "harp": bars((c, s, b) => {
      const arp = [c[0], c[1], c[2], c[0] + 12, c[1] + 12, c[2] + 12, c[0] + 24, c[2] + 12];
      if (b === 4) { [c[0], c[1], c[2], c[0] + 12, c[1] + 12, c[2] + 12].forEach((m, i) => n.push([s + i * 0.12, 4, m + 12, 0.5])); return; }
      arp.forEach((m, i) => n.push([s + i / 2, 1.5, m + 12, 0.45]));
    }); break;
  }
  return n;
}

// Bass register: one or two octaves down, staying around D1–D2.
function low(m) { m -= 12; return m > 40 ? m - 12 : m; }

const freq = (m) => 440 * Math.pow(2, (m - 69) / 12);

function env(g, t, a, peak, d, rel) {
  g.gain.setValueAtTime(0.0001, t);
  g.gain.exponentialRampToValueAtTime(peak, t + a);
  g.gain.setValueAtTime(peak, t + Math.max(a, d - rel));
  g.gain.exponentialRampToValueAtTime(0.0001, t + d);
}

function vibrato(ctx, osc, t, f, depth = 0.004, rate = 5.4) {
  const lfo = ctx.createOscillator(), lg = ctx.createGain();
  lfo.frequency.value = rate;
  lg.gain.setValueAtTime(0, t);
  lg.gain.linearRampToValueAtTime(f * depth, t + 0.35);
  lfo.connect(lg).connect(osc.frequency);
  return lfo; // started together with the voice's other nodes
}

let noiseBuf = null;
function noise(ctx) {
  if (noiseBuf) return noiseBuf;
  noiseBuf = ctx.createBuffer(1, ctx.sampleRate, ctx.sampleRate);
  const d = noiseBuf.getChannelData(0);
  for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  return noiseBuf;
}

function voice(ctx, out, id, midi, t, dur, vel) {
  const f = freq(midi);
  const g = ctx.createGain();
  g.connect(out);
  const nodes = [];
  const osc = (type, fr, detune = 0) => { const o = ctx.createOscillator(); o.type = type; o.frequency.value = fr; o.detune.value = detune; nodes.push(o); return o; };
  const filter = (type, fr, q = 0.7) => { const b = ctx.createBiquadFilter(); b.type = type; b.frequency.value = fr; b.Q.value = q; return b; };
  const v = vel * 0.22;

  if (["violin", "viola", "cello", "bass"].includes(id)) {
    const lp = filter("lowpass", Math.min(f * 7, 6000), 0.9);
    const o1 = osc("sawtooth", f, -6), o2 = osc("sawtooth", f, 7);
    o1.connect(lp); o2.connect(lp); lp.connect(g);
    nodes.push(vibrato(ctx, o1, t, f), vibrato(ctx, o2, t, f));
    env(g, t, id === "bass" ? 0.12 : 0.09, v * (id === "bass" ? 1.2 : 0.8), dur, 0.18);
  } else if (id === "harp") {
    const o1 = osc("triangle", f), o2 = osc("sine", f * 2);
    const g2 = ctx.createGain(); g2.gain.value = 0.25;
    o1.connect(g); o2.connect(g2).connect(g);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 1.1, t + 0.005);
    g.gain.exponentialRampToValueAtTime(0.0001, t + Math.min(dur, 2.2));
  } else if (id === "flute") {
    const o = osc("sine", f), o2 = osc("triangle", f);
    const g2 = ctx.createGain(); g2.gain.value = 0.18;
    o.connect(g); o2.connect(g2).connect(g); nodes.push(vibrato(ctx, o, t, f, 0.005, 5));
    const n = ctx.createBufferSource(); n.buffer = noise(ctx); n.loop = true;
    const bp = filter("bandpass", f * 2, 1.5), ng = ctx.createGain(); ng.gain.value = 0.05;
    n.connect(bp).connect(ng).connect(g); nodes.push(n);
    env(g, t, 0.06, v * 0.9, dur, 0.12);
  } else if (id === "oboe") {
    const o = osc("sawtooth", f);
    const bp = filter("bandpass", 1300, 1.6), hp = filter("highpass", f * 0.9);
    o.connect(hp).connect(bp).connect(g); nodes.push(vibrato(ctx, o, t, f, 0.003, 5.6));
    env(g, t, 0.04, v * 1.6, dur, 0.1);
  } else if (id === "clarinet") {
    const o = osc("square", f); const lp = filter("lowpass", f * 4);
    o.connect(lp).connect(g); env(g, t, 0.05, v * 0.55, dur, 0.12);
  } else if (id === "bassoon") {
    const o = osc("sawtooth", f); const lp = filter("lowpass", f * 3.2), bp = filter("peaking", 480, 2); bp.gain.value = 6;
    o.connect(lp).connect(bp).connect(g); env(g, t, 0.03, v * 0.8, dur, 0.08);
  } else if (["horn", "trumpet", "trombone", "tuba"].includes(id)) {
    const bright = { horn: 3, trumpet: 9, trombone: 5, tuba: 2.6 }[id];
    const o = osc("sawtooth", f); const lp = filter("lowpass", f * 1.2, 1.2);
    lp.frequency.setValueAtTime(f * 1.2, t); lp.frequency.exponentialRampToValueAtTime(Math.min(f * bright, 9000), t + 0.09);
    lp.frequency.exponentialRampToValueAtTime(Math.min(f * bright * 0.7, 9000), t + 0.4);
    o.connect(lp).connect(g);
    if (id !== "tuba") nodes.push(vibrato(ctx, o, t, f, 0.002, 5));
    env(g, t, 0.05, v * (id === "trumpet" ? 0.75 : id === "tuba" ? 1.3 : 0.9), dur, 0.15);
  } else if (id === "timpani") {
    const o = osc("sine", f * 1.04);
    o.frequency.setValueAtTime(f * 1.04, t); o.frequency.exponentialRampToValueAtTime(f, t + 0.15);
    o.connect(g);
    const n = ctx.createBufferSource(); n.buffer = noise(ctx);
    const lp = filter("lowpass", 900), ng = ctx.createGain();
    ng.gain.setValueAtTime(v * 1.2, t); ng.gain.exponentialRampToValueAtTime(0.0001, t + 0.12);
    n.connect(lp).connect(ng).connect(out); nodes.push(n);
    g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(v * 3, t + 0.01);
    g.gain.exponentialRampToValueAtTime(0.0001, t + 1.6);
    dur = 1.7;
  }
  nodes.forEach((n) => { n.start(t); n.stop(t + dur + 0.2); });
  return nodes;
}

function impulse(ctx, seconds = 2.4) {
  const len = Math.floor(ctx.sampleRate * seconds);
  const buf = ctx.createBuffer(2, len, ctx.sampleRate);
  for (let ch = 0; ch < 2; ch++) {
    const d = buf.getChannelData(ch);
    for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.6);
  }
  return buf;
}

export class Orchestra {
  constructor() { this.ctx = null; this.active = []; this.timer = null; this.files = {}; this.onend = null; }

  async init(ids) {
    // Optional recordings dropped into /public/audio/ (listed by the server).
    try {
      const files = await fetch("/api/audio").then((r) => r.json());
      for (const id of ids) { const f = files.find((n) => n.replace(/\.[^.]+$/, "") === id); if (f) this.files[id] = `/audio/${f}`; }
    } catch {}
  }

  setup() {
    if (this.ctx) return;
    const ctx = this.ctx = new (window.AudioContext || window.webkitAudioContext)();
    this.master = ctx.createGain(); this.master.gain.value = 0.9;
    const comp = ctx.createDynamicsCompressor();
    const verb = ctx.createConvolver(); verb.buffer = impulse(ctx);
    const wet = ctx.createGain(); wet.gain.value = 0.28;
    this.bus = ctx.createGain();
    this.bus.connect(this.master); this.bus.connect(verb).connect(wet).connect(this.master);
    this.master.connect(comp).connect(ctx.destination);
  }

  get duration() { return 20 * BEAT + 1.5; }

  stop() {
    clearTimeout(this.timer);
    for (const n of this.active) { try { n.stop ? n.stop() : n.pause(); } catch {} }
    this.active = [];
  }

  play(ids) {
    this.stop();
    this.setup();
    this.ctx.resume();
    const t0 = this.ctx.currentTime + 0.08;
    // In a full ensemble, quieten each part a little.
    const out = this.ctx.createGain(); out.gain.value = ids.length > 1 ? 0.55 : 1; out.connect(this.bus);
    for (const id of ids) {
      if (this.files[id]) {
        const a = new Audio(this.files[id]); a.play().catch(() => {}); this.active.push(a); continue;
      }
      for (const [beat, len, midi, vel] of part(id)) {
        this.active.push(...voice(this.ctx, out, id, midi, t0 + beat * BEAT, len * BEAT * 0.98, vel));
      }
    }
    this.timer = setTimeout(() => { this.active = []; this.onend && this.onend(); }, this.duration * 1000);
  }
}
