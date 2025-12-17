// Simple audio synthesizer to avoid external assets

class AudioService {
  private audioCtx: AudioContext | null = null;
  private isMuted: boolean = false;

  private init() {
    if (!this.audioCtx) {
      this.audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
    }
    if (this.audioCtx.state === 'suspended') {
      this.audioCtx.resume();
    }
  }

  playBeep(frequency: number = 800, duration: number = 0.1, type: OscillatorType = 'sine') {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = type;
    oscillator.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);
    
    gainNode.gain.setValueAtTime(0.3, this.audioCtx.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, this.audioCtx.currentTime + duration);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + duration);
  }

  playTick() {
    this.playBeep(1000, 0.05, 'square');
  }

  playUrgentTick() {
    this.playBeep(1200, 0.05, 'sawtooth');
  }

  playBuzzer() {
    // End of round sound
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;

    const oscillator = this.audioCtx.createOscillator();
    const gainNode = this.audioCtx.createGain();

    oscillator.type = 'sawtooth';
    
    // Slide pitch down
    oscillator.frequency.setValueAtTime(400, this.audioCtx.currentTime);
    oscillator.frequency.linearRampToValueAtTime(100, this.audioCtx.currentTime + 0.5);

    gainNode.gain.setValueAtTime(0.5, this.audioCtx.currentTime);
    gainNode.gain.linearRampToValueAtTime(0.01, this.audioCtx.currentTime + 0.5);

    oscillator.connect(gainNode);
    gainNode.connect(this.audioCtx.destination);

    oscillator.start();
    oscillator.stop(this.audioCtx.currentTime + 0.5);
  }

  playWin() {
    if (this.isMuted) return;
    this.init();
    if (!this.audioCtx) return;
    
    // Simple arpeggio
    const notes = [523.25, 659.25, 783.99, 1046.50];
    notes.forEach((freq, i) => {
        setTimeout(() => this.playBeep(freq, 0.2, 'triangle'), i * 150);
    });
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    return this.isMuted;
  }
}

export const audioService = new AudioService();