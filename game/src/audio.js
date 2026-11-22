// Gilded Getaway — all sound is synthesized with WebAudio: no audio files, no network.
// A soft chime for loot, a low thud for a coin, a rising two-tone alarm, a hush for smoke.
export function createAudio() {
  let context = null;
  let muted = false;

  function ensure() {
    if (!context) {
      try {
        const Ctor = window.AudioContext || window.webkitAudioContext;
        context = new Ctor();
      } catch {
        context = null;
      }
    }
    if (context && context.state === 'suspended') context.resume().catch(() => {});
    return context;
  }

  function tone(freq, seconds, type, gain, when = 0, slideTo = null) {
    const ctx = ensure();
    if (!ctx || muted) return;
    const osc = ctx.createOscillator();
    const amp = ctx.createGain();
    osc.type = type;
    osc.frequency.setValueAtTime(freq, ctx.currentTime + when);
    if (slideTo !== null) osc.frequency.exponentialRampToValueAtTime(slideTo, ctx.currentTime + when + seconds);
    amp.gain.setValueAtTime(gain, ctx.currentTime + when);
    amp.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + when + seconds);
    osc.connect(amp);
    amp.connect(ctx.destination);
    osc.start(ctx.currentTime + when);
    osc.stop(ctx.currentTime + when + seconds + 0.02);
  }

  return {
    unlock() {
      ensure();
    },
    toggleMute() {
      muted = !muted;
      return muted;
    },
    get muted() {
      return muted;
    },
    step() {
      tone(190, 0.05, 'sine', 0.03);
    },
    grab() {
      tone(660, 0.12, 'triangle', 0.12);
      tone(990, 0.18, 'triangle', 0.12, 0.09);
      tone(1320, 0.24, 'triangle', 0.09, 0.18);
    },
    coin() {
      tone(240, 0.07, 'square', 0.05, 0, 180);
    },
    smoke() {
      tone(320, 0.35, 'sine', 0.05, 0, 90);
    },
    emp() {
      tone(880, 0.3, 'sawtooth', 0.05, 0, 110);
    },
    alarm() {
      tone(520, 0.16, 'square', 0.07);
      tone(392, 0.16, 'square', 0.07, 0.18);
    },
    caught() {
      tone(220, 0.4, 'sawtooth', 0.1, 0, 55);
    },
    win() {
      tone(523, 0.16, 'triangle', 0.12);
      tone(659, 0.16, 'triangle', 0.12, 0.14);
      tone(784, 0.16, 'triangle', 0.12, 0.28);
      tone(1047, 0.34, 'triangle', 0.12, 0.42);
    },
  };
}
