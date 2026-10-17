// Synthesized brick "click": a plastic tick on press, a lighter clack on release.
// No audio files; everything is built with the Web Audio API on first use.

const KEY = "brick-sound";
export const SOUND_EVENT = "brick-sound-change";

let ctx: AudioContext | null = null;
let noise: AudioBuffer | null = null;
let memo: boolean | null = null;

export function soundOn(): boolean {
  try {
    return localStorage.getItem(KEY) !== "off";
  } catch {
    return true;
  }
}

export function setSound(on: boolean) {
  try {
    localStorage.setItem(KEY, on ? "on" : "off");
  } catch {
    // storage blocked: the toggle still works for this page view
  }
  memo = on;
  window.dispatchEvent(new CustomEvent(SOUND_EVENT, { detail: on }));
}

const enabled = () => (memo ??= soundOn());

function audio() {
  if (!ctx) {
    const AC = window.AudioContext ?? (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
    if (!AC) return null;
    ctx = new AC();
    noise = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 0.05), ctx.sampleRate);
    const d = noise.getChannelData(0);
    for (let i = 0; i < d.length; i++) d[i] = Math.random() * 2 - 1;
  }
  if (ctx.state === "suspended") void ctx.resume();
  return ctx;
}

function tick(c: AudioContext, t: number, freq: number, gain: number, len: number) {
  // contact transient: band-passed noise
  const src = c.createBufferSource();
  src.buffer = noise;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq * 2;
  bp.Q.value = 1.6;
  const ng = c.createGain();
  ng.gain.setValueAtTime(gain, t);
  ng.gain.exponentialRampToValueAtTime(0.001, t + len * 0.5);
  src.connect(bp).connect(ng).connect(c.destination);
  src.start(t);
  src.stop(t + len);

  // hollow plastic body: a short falling tone
  const osc = c.createOscillator();
  osc.type = "triangle";
  osc.frequency.setValueAtTime(freq, t);
  osc.frequency.exponentialRampToValueAtTime(freq * 0.5, t + len);
  const og = c.createGain();
  og.gain.setValueAtTime(gain * 0.55, t);
  og.gain.exponentialRampToValueAtTime(0.001, t + len);
  osc.connect(og).connect(c.destination);
  osc.start(t);
  osc.stop(t + len);
}

export function playPress() {
  if (!enabled()) return;
  const c = audio();
  if (c) tick(c, c.currentTime, 1700, 0.35, 0.06);
}

export function playRelease() {
  if (!enabled()) return;
  const c = audio();
  if (c) tick(c, c.currentTime, 2600, 0.16, 0.04);
}
