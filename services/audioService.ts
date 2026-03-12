
class AudioService {
  private context: AudioContext | null = null;
  private ambientGain: GainNode | null = null;
  private sequencerTimer: number | null = null;

  private ensureContext() {
    if (!this.context) {
      this.context = new (window.AudioContext || (window as any).webkitContext)();
    }
    if (this.context.state === 'suspended') {
      this.context.resume();
    }
    return this.context;
  }

  private async playNote(freq: number, startTime: number, duration: number, volume: number = 0.05, type: OscillatorType = 'sine') {
    const ctx = this.ensureContext();
    const osc = ctx.createOscillator();
    const g = ctx.createGain();

    osc.type = type;
    osc.frequency.setValueAtTime(freq, startTime);
    osc.connect(g);
    g.connect(this.ambientGain || ctx.destination);

    g.gain.setValueAtTime(0, startTime);
    g.gain.linearRampToValueAtTime(volume, startTime + 0.02);
    g.gain.exponentialRampToValueAtTime(0.0001, startTime + duration);

    osc.start(startTime);
    osc.stop(startTime + duration);
  }

  playAmbient() {
    const ctx = this.ensureContext();
    if (this.sequencerTimer) return;

    this.ambientGain = ctx.createGain();
    this.ambientGain.gain.setValueAtTime(0, ctx.currentTime);
    this.ambientGain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 1);
    this.ambientGain.connect(ctx.destination);

    const melody = [261.63, 329.63, 392.00, 440.00]; // Simpler loop
    let step = 0;

    const sequence = () => {
      if (!this.ambientGain) return;
      const now = ctx.currentTime;
      const noteDuration = 0.6;
      
      // Simple rhythm
      this.playNote(melody[step % melody.length], now, 0.5, 0.04, 'sine');
      if (step % 4 === 0) {
        this.playNote(130.81, now, 1.0, 0.06, 'triangle'); // Bass
      }
      
      step++;
      this.sequencerTimer = window.setTimeout(sequence, noteDuration * 1000);
    };

    sequence();
  }

  stopAmbient() {
    if (this.sequencerTimer) {
      clearTimeout(this.sequencerTimer);
      this.sequencerTimer = null;
    }
    if (this.ambientGain && this.context) {
      const now = this.context.currentTime;
      this.ambientGain.gain.cancelScheduledValues(now);
      this.ambientGain.gain.linearRampToValueAtTime(0, now + 0.5);
      const gainRef = this.ambientGain;
      setTimeout(() => {
        gainRef.disconnect();
      }, 600);
      this.ambientGain = null;
    }
  }

  playCoin() {
    const now = this.ensureContext().currentTime;
    this.playNote(987.77, now, 0.1, 0.08, 'sine');
    this.playNote(1318.51, now + 0.05, 0.2, 0.06, 'sine');
  }

  playHit() {
    this.playNote(100, this.ensureContext().currentTime, 0.1, 0.04, 'square');
  }

  playSuccess() {
    const now = this.ensureContext().currentTime;
    [523.25, 659.25, 783.99].forEach((f, i) => {
      this.playNote(f, now + i * 0.1, 0.4, 0.08, 'sine');
    });
  }

  playFail() {
    const now = this.ensureContext().currentTime;
    this.playNote(110, now, 0.5, 0.1, 'sawtooth');
  }

  playClick() {
    this.playNote(440, this.ensureContext().currentTime, 0.05, 0.05, 'sine');
  }
  
  resume() {
    this.ensureContext();
  }
}

export const audioService = new AudioService();
