class AudioService {
  private ctx: AudioContext | null = null;
  private osc: OscillatorNode | null = null;
  private gain: GainNode | null = null;
  private filter: BiquadFilterNode | null = null;
  private initialized = false;

  init() {
    if (this.initialized) return;
    
    try {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();

      // Create nodes for Servo Sound
      this.osc = this.ctx.createOscillator();
      this.gain = this.ctx.createGain();
      this.filter = this.ctx.createBiquadFilter();

      // Configuration for Servo (Mechanical Buzz)
      this.osc.type = 'sawtooth'; 
      this.osc.frequency.value = 60; 

      this.filter.type = 'lowpass';
      this.filter.Q.value = 2;
      this.filter.frequency.value = 200;

      this.gain.gain.value = 0; // Start silent

      // Connect graph: Osc -> Filter -> Gain -> Destination
      this.osc.connect(this.filter);
      this.filter.connect(this.gain);
      this.gain.connect(this.ctx.destination);

      this.osc.start();
      this.initialized = true;
    } catch (e) {
      console.warn("Audio Context initialization failed", e);
    }
  }

  /**
   * Plays a soft high-tech click sound for UI selection.
   */
  playClick() {
    if (!this.initialized || !this.ctx) return;

    // Handle browser autoplay policy
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const t = this.ctx.currentTime;
    const clickOsc = this.ctx.createOscillator();
    const clickGain = this.ctx.createGain();

    clickOsc.type = 'sine';
    // Quick pitch drop for a "blip" effect
    clickOsc.frequency.setValueAtTime(1200, t);
    clickOsc.frequency.exponentialRampToValueAtTime(600, t + 0.05);

    // Short envelope
    clickGain.gain.setValueAtTime(0.1, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.05);

    clickOsc.connect(clickGain);
    clickGain.connect(this.ctx.destination);

    clickOsc.start(t);
    clickOsc.stop(t + 0.05);
  }

  /**
   * Updates the servo sound based on movement velocity.
   * @param velocity Normalized velocity (approx 0.0 to 1.0)
   */
  updateServo(velocity: number) {
    if (!this.initialized || !this.ctx || !this.gain || !this.osc || !this.filter) return;

    // Handle browser autoplay policy
    if (this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }

    const time = this.ctx.currentTime;
    const intensity = Math.min(velocity, 1);
    
    // Smoothly ramp volume based on movement
    // Target volume max is 0.15 to keep it subtle
    const targetGain = intensity > 0.01 ? Math.min(intensity * 0.5, 0.15) : 0;
    this.gain.gain.setTargetAtTime(targetGain, time, 0.1);

    // Pitch modulation: 60Hz idle -> 200Hz fast
    const targetFreq = 60 + (intensity * 140);
    this.osc.frequency.setTargetAtTime(targetFreq, time, 0.1);

    // Filter opens up with speed
    const targetFilter = 200 + (intensity * 1000);
    this.filter.frequency.setTargetAtTime(targetFilter, time, 0.1);
  }
}

export const audioService = new AudioService();
