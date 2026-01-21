// Audio feedback system for AccessMate
// Uses Web Audio API for low-latency sound generation

class AudioFeedbackSystem {
  private audioContext: AudioContext | null = null;
  private isEnabled: boolean = true;
  private volume: number = 0.3;

  constructor() {
    this.initAudioContext();
  }

  private initAudioContext(): void {
    try {
      this.audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    } catch (e) {
      console.warn('Web Audio API not supported');
    }
  }

  private ensureContext(): AudioContext | null {
    if (this.audioContext?.state === 'suspended') {
      this.audioContext.resume();
    }
    return this.audioContext;
  }

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }

  // Play a simple tone
  private playTone(frequency: number, duration: number, type: OscillatorType = 'sine'): void {
    if (!this.isEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.frequency.value = frequency;
    oscillator.type = type;

    gainNode.gain.setValueAtTime(this.volume, ctx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

    oscillator.start(ctx.currentTime);
    oscillator.stop(ctx.currentTime + duration);
  }

  // Play a sequence of tones
  private playSequence(notes: { freq: number; dur: number }[], type: OscillatorType = 'sine'): void {
    if (!this.isEnabled) return;
    const ctx = this.ensureContext();
    if (!ctx) return;

    let time = ctx.currentTime;
    notes.forEach(({ freq, dur }) => {
      const oscillator = ctx.createOscillator();
      const gainNode = ctx.createGain();

      oscillator.connect(gainNode);
      gainNode.connect(ctx.destination);

      oscillator.frequency.value = freq;
      oscillator.type = type;

      gainNode.gain.setValueAtTime(this.volume, time);
      gainNode.gain.exponentialRampToValueAtTime(0.01, time + dur);

      oscillator.start(time);
      oscillator.stop(time + dur);

      time += dur;
    });
  }

  // Sound effects for different actions
  click(): void {
    this.playTone(800, 0.05, 'square');
  }

  doubleClick(): void {
    this.playSequence([
      { freq: 800, dur: 0.04 },
      { freq: 1000, dur: 0.04 },
    ], 'square');
  }

  rightClick(): void {
    this.playTone(600, 0.06, 'square');
  }

  dragStart(): void {
    this.playSequence([
      { freq: 400, dur: 0.05 },
      { freq: 600, dur: 0.05 },
    ], 'sine');
  }

  dragEnd(): void {
    this.playSequence([
      { freq: 600, dur: 0.05 },
      { freq: 400, dur: 0.05 },
    ], 'sine');
  }

  hover(): void {
    this.playTone(1200, 0.03, 'sine');
  }

  dwellStart(): void {
    this.playTone(500, 0.1, 'sine');
  }

  dwellComplete(): void {
    this.playSequence([
      { freq: 600, dur: 0.05 },
      { freq: 800, dur: 0.05 },
      { freq: 1000, dur: 0.08 },
    ], 'sine');
  }

  gestureDetected(): void {
    this.playSequence([
      { freq: 440, dur: 0.05 },
      { freq: 660, dur: 0.08 },
    ], 'triangle');
  }

  error(): void {
    this.playSequence([
      { freq: 200, dur: 0.1 },
      { freq: 150, dur: 0.15 },
    ], 'sawtooth');
  }

  success(): void {
    this.playSequence([
      { freq: 523, dur: 0.08 },
      { freq: 659, dur: 0.08 },
      { freq: 784, dur: 0.12 },
    ], 'sine');
  }

  warning(): void {
    this.playSequence([
      { freq: 440, dur: 0.1 },
      { freq: 440, dur: 0.1 },
    ], 'square');
  }

  calibrationStart(): void {
    this.playSequence([
      { freq: 400, dur: 0.1 },
      { freq: 500, dur: 0.1 },
      { freq: 600, dur: 0.1 },
    ], 'sine');
  }

  calibrationComplete(): void {
    this.playSequence([
      { freq: 600, dur: 0.1 },
      { freq: 800, dur: 0.1 },
      { freq: 1000, dur: 0.15 },
    ], 'sine');
  }

  pause(): void {
    this.playSequence([
      { freq: 600, dur: 0.1 },
      { freq: 400, dur: 0.15 },
    ], 'triangle');
  }

  resume(): void {
    this.playSequence([
      { freq: 400, dur: 0.1 },
      { freq: 600, dur: 0.15 },
    ], 'triangle');
  }

  keyboardOpen(): void {
    this.playSequence([
      { freq: 800, dur: 0.05 },
      { freq: 1000, dur: 0.05 },
    ], 'sine');
  }

  keyboardClose(): void {
    this.playSequence([
      { freq: 1000, dur: 0.05 },
      { freq: 800, dur: 0.05 },
    ], 'sine');
  }

  keyPress(): void {
    this.playTone(1000, 0.03, 'square');
  }

  breakReminder(): void {
    this.playSequence([
      { freq: 523, dur: 0.2 },
      { freq: 392, dur: 0.2 },
      { freq: 523, dur: 0.2 },
      { freq: 392, dur: 0.3 },
    ], 'sine');
  }

  // Scroll feedback - pitch varies with direction
  scrollUp(): void {
    this.playTone(1000, 0.03, 'sine');
  }

  scrollDown(): void {
    this.playTone(800, 0.03, 'sine');
  }
}

// Singleton instance
export const audioFeedback = new AudioFeedbackSystem();

// Voice feedback using Speech Synthesis
export class VoiceFeedback {
  private isEnabled: boolean = false;
  private rate: number = 1.0;
  private pitch: number = 1.0;
  private volume: number = 0.8;

  setEnabled(enabled: boolean): void {
    this.isEnabled = enabled;
  }

  speak(text: string, priority: boolean = false): void {
    if (!this.isEnabled || !('speechSynthesis' in window)) return;

    if (priority) {
      window.speechSynthesis.cancel();
    }

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = this.rate;
    utterance.pitch = this.pitch;
    utterance.volume = this.volume;

    window.speechSynthesis.speak(utterance);
  }

  cancel(): void {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel();
    }
  }

  setRate(rate: number): void {
    this.rate = Math.max(0.5, Math.min(2, rate));
  }

  setPitch(pitch: number): void {
    this.pitch = Math.max(0, Math.min(2, pitch));
  }

  setVolume(volume: number): void {
    this.volume = Math.max(0, Math.min(1, volume));
  }
}

export const voiceFeedback = new VoiceFeedback();
