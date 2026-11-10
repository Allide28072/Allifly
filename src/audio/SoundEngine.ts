/**
 * ALLIFLY 3D Space Explorer - Procedural Web Audio Engine
 * Pure Web Audio API synthesis - zero external audio asset dependencies!
 */

class SoundEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private sfxGain: GainNode | null = null;
  private musicGain: GainNode | null = null;
  
  // Continuous engine thruster nodes
  private thrusterOsc1: OscillatorNode | null = null;
  private thrusterOsc2: OscillatorNode | null = null;
  private thrusterNoiseGain: GainNode | null = null;
  private thrusterMasterGain: GainNode | null = null;
  private isThrusterPlaying = false;

  // Ambient music generator nodes
  private ambientInterval: number | null = null;
  private isMusicPlaying = false;

  private isMuted = false;
  private masterVol = 0.8;
  private sfxVol = 0.9;
  private musicVol = 0.5;

  public init() {
    if (this.ctx) return;
    try {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtxClass();

      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVol, this.ctx.currentTime);
      this.masterGain.connect(this.ctx.destination);

      this.sfxGain = this.ctx.createGain();
      this.sfxGain.gain.setValueAtTime(this.sfxVol, this.ctx.currentTime);
      this.sfxGain.connect(this.masterGain);

      this.musicGain = this.ctx.createGain();
      this.musicGain.gain.setValueAtTime(this.musicVol, this.ctx.currentTime);
      this.musicGain.connect(this.masterGain);

      this.setupThrusterLoop();
      this.startAmbientMusic();
    } catch {
      // AudioContext may require user gesture on first interaction
    }
  }

  public ensureContext() {
    if (!this.ctx) {
      this.init();
    } else if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  public setVolumes(master: number, sfx: number, music: number, muted: boolean) {
    this.masterVol = master;
    this.sfxVol = sfx;
    this.musicVol = music;
    this.isMuted = muted;

    if (!this.ctx) return;
    const now = this.ctx.currentTime;
    if (this.masterGain) {
      this.masterGain.gain.setTargetAtTime(muted ? 0 : master, now, 0.05);
    }
    if (this.sfxGain) {
      this.sfxGain.gain.setTargetAtTime(sfx, now, 0.05);
    }
    if (this.musicGain) {
      this.musicGain.gain.setTargetAtTime(music, now, 0.05);
    }
  }

  // --- CONTINUOUS ENGINE SOUND ---
  private setupThrusterLoop() {
    if (!this.ctx || !this.sfxGain) return;
    try {
      const now = this.ctx.currentTime;
      this.thrusterMasterGain = this.ctx.createGain();
      this.thrusterMasterGain.gain.setValueAtTime(0, now);
      this.thrusterMasterGain.connect(this.sfxGain);

      // Low rumble sub-oscillator
      this.thrusterOsc1 = this.ctx.createOscillator();
      this.thrusterOsc1.type = 'sawtooth';
      this.thrusterOsc1.frequency.setValueAtTime(45, now);

      const filter1 = this.ctx.createBiquadFilter();
      filter1.type = 'lowpass';
      filter1.frequency.setValueAtTime(140, now);
      this.thrusterOsc1.connect(filter1);

      const osc1Gain = this.ctx.createGain();
      osc1Gain.gain.setValueAtTime(0.3, now);
      filter1.connect(osc1Gain);
      osc1Gain.connect(this.thrusterMasterGain);

      // Higher harmonic ion whine
      this.thrusterOsc2 = this.ctx.createOscillator();
      this.thrusterOsc2.type = 'sine';
      this.thrusterOsc2.frequency.setValueAtTime(120, now);

      const osc2Gain = this.ctx.createGain();
      osc2Gain.gain.setValueAtTime(0.12, now);
      this.thrusterOsc2.connect(osc2Gain);
      osc2Gain.connect(this.thrusterMasterGain);

      // Filtered noise for air/plasma rush
      const bufferSize = this.ctx.sampleRate * 2;
      const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
      const output = noiseBuffer.getChannelData(0);
      let lastOut = 0.0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        output[i] = (lastOut + 0.02 * white) / 1.02; // Pink-brown noise
        lastOut = output[i];
      }

      const noiseSource = this.ctx.createBufferSource();
      noiseSource.buffer = noiseBuffer;
      noiseSource.loop = true;

      const noiseFilter = this.ctx.createBiquadFilter();
      noiseFilter.type = 'bandpass';
      noiseFilter.frequency.setValueAtTime(280, now);
      noiseFilter.Q.setValueAtTime(2.0, now);

      this.thrusterNoiseGain = this.ctx.createGain();
      this.thrusterNoiseGain.gain.setValueAtTime(0, now);

      noiseSource.connect(noiseFilter);
      noiseFilter.connect(this.thrusterNoiseGain);
      this.thrusterNoiseGain.connect(this.thrusterMasterGain);

      this.thrusterOsc1.start(now);
      this.thrusterOsc2.start(now);
      noiseSource.start(now);
      this.isThrusterPlaying = true;
    } catch {
      // Ignored
    }
  }

  public updateEngineSound(speedRatio: number, isBoosting: boolean) {
    if (!this.ctx || !this.thrusterMasterGain || !this.isThrusterPlaying) return;
    const now = this.ctx.currentTime;
    
    // Scale gain with throttle
    const baseGain = speedRatio > 0.01 ? 0.05 + speedRatio * 0.28 : 0.01;
    const boostMultiplier = isBoosting ? 1.7 : 1.0;
    const targetGain = baseGain * boostMultiplier;

    this.thrusterMasterGain.gain.setTargetAtTime(targetGain, now, 0.08);

    // Pitch rises with speed and boost
    const baseFreq = 42 + speedRatio * 55 + (isBoosting ? 40 : 0);
    if (this.thrusterOsc1) {
      this.thrusterOsc1.frequency.setTargetAtTime(baseFreq, now, 0.06);
    }
    if (this.thrusterOsc2) {
      this.thrusterOsc2.frequency.setTargetAtTime(baseFreq * 2.8, now, 0.06);
    }
    if (this.thrusterNoiseGain) {
      const noiseLevel = (speedRatio * 0.18) + (isBoosting ? 0.35 : 0.0);
      this.thrusterNoiseGain.gain.setTargetAtTime(noiseLevel, now, 0.08);
    }
  }

  // --- SFX: BOOST IGNITION ---
  public playBoostIgnite() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(80, now);
    osc.frequency.exponentialRampToValueAtTime(320, now + 0.3);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(300, now);
    filter.frequency.exponentialRampToValueAtTime(1400, now + 0.25);

    gain.gain.setValueAtTime(0.4, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.45);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.48);
  }

  // --- SFX: CRYSTAL COLLECT CHIME ---
  public playCrystalCollect(type: 'quantum' | 'plasma' | 'darkMatter' = 'quantum') {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Harmonious shimmering chord based on crystal rarity
    let freqs = [523.25, 659.25, 783.99, 1046.5]; // C5, E5, G5, C6 (Quantum)
    if (type === 'plasma') {
      freqs = [659.25, 830.61, 987.77, 1318.51, 1661.22]; // E5, G#5, B5, E6 (Plasma)
    } else if (type === 'darkMatter') {
      freqs = [440.0, 554.37, 659.25, 880.0, 1108.73, 1318.51]; // A4, C#5, E5, A5 (Rare)
    }

    freqs.forEach((freq, idx) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now + idx * 0.045);
      osc.frequency.exponentialRampToValueAtTime(freq * 1.05, now + idx * 0.045 + 0.4);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.25 / freqs.length, now + idx * 0.045);
      gain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.045 + 0.65);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + idx * 0.045);
      osc.stop(now + idx * 0.045 + 0.7);
    });
  }

  // --- SFX: SCANNER SONAR PING ---
  public playScannerPulse() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(1100, now);
    osc.frequency.exponentialRampToValueAtTime(750, now + 0.35);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.4);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.42);
  }

  // --- SFX: SHIELD IMPACT / RECHARGE ---
  public playShieldHum() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'triangle';
    osc.frequency.setValueAtTime(220, now);
    osc.frequency.linearRampToValueAtTime(440, now + 0.25);

    gain.gain.setValueAtTime(0.2, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.35);

    osc.connect(gain);
    gain.connect(this.sfxGain);
    osc.start(now);
    osc.stop(now + 0.38);
  }

  // --- SFX: PLANETARY ATMOSPHERE ENTRY / LANDING ---
  public playAtmosphereEntry() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // Filtered noise swell
    const bufferSize = this.ctx.sampleRate * 2.5;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const source = this.ctx.createBufferSource();
    source.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(150, now);
    filter.frequency.exponentialRampToValueAtTime(800, now + 1.2);
    filter.frequency.exponentialRampToValueAtTime(200, now + 2.4);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.35, now + 1.0);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    source.connect(filter);
    filter.connect(gain);
    gain.connect(this.sfxGain);

    source.start(now);
    source.stop(now + 2.5);
  }

  // --- SFX: HYPERSPACE / QUANTUM WARP JUMP ---
  public playHyperjump() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    // High rising whoosh
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(120, now);
    osc.frequency.exponentialRampToValueAtTime(1800, now + 0.65);
    osc.frequency.exponentialRampToValueAtTime(60, now + 1.1);

    gain.gain.setValueAtTime(0.3, now);
    gain.gain.linearRampToValueAtTime(0.6, now + 0.5);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 1.2);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 1.25);
  }

  // --- SFX: MISSION COMPLETE ---
  public playMissionComplete() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const notes = [392.0, 523.25, 659.25, 783.99, 1046.5]; // G4, C5, E5, G5, C6
    notes.forEach((freq, i) => {
      if (!this.ctx || !this.sfxGain) return;
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, now + i * 0.1);

      gain.gain.setValueAtTime(0.001, now);
      gain.gain.setValueAtTime(0.28, now + i * 0.1);
      gain.gain.exponentialRampToValueAtTime(0.001, now + i * 0.1 + 0.6);

      osc.connect(gain);
      gain.connect(this.sfxGain);

      osc.start(now + i * 0.1);
      osc.stop(now + i * 0.1 + 0.65);
    });
  }

  // --- SFX: UI CLICK / INTERACTION ---
  public playUiClick() {
    if (!this.ctx || !this.sfxGain) return;
    this.ensureContext();
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(800, now);
    osc.frequency.exponentialRampToValueAtTime(400, now + 0.06);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.07);

    osc.connect(gain);
    gain.connect(this.sfxGain);

    osc.start(now);
    osc.stop(now + 0.08);
  }

  // --- GENERATIVE AMBIENT SPACE MUSIC ---
  private startAmbientMusic() {
    if (this.isMusicPlaying) return;
    this.isMusicPlaying = true;

    // Chords: D min9, Bb maj7, G sus2, A min7, F maj9
    const chords = [
      [146.83, 220.0, 261.63, 329.63, 440.0], // D3, A3, C4, E4, A4
      [116.54, 174.61, 233.08, 293.66, 349.23], // Bb2, F3, Bb3, D4, F4
      [196.0, 293.66, 392.0, 440.0, 587.33], // G3, D4, G4, A4, D5
      [110.0, 164.81, 220.0, 261.63, 329.63], // A2, E3, A3, C4, E4
      [174.61, 261.63, 329.63, 392.0, 523.25], // F3, C4, E4, G4, C5
    ];

    let chordIdx = 0;

    const playChordStep = () => {
      if (!this.ctx || !this.musicGain || !this.isMusicPlaying) return;
      const now = this.ctx.currentTime;
      const currentChord = chords[chordIdx % chords.length];
      chordIdx++;

      currentChord.forEach((freq, noteIdx) => {
        if (!this.ctx || !this.musicGain) return;
        const osc = this.ctx.createOscillator();
        const gain = this.ctx.createGain();
        const filter = this.ctx.createBiquadFilter();

        osc.type = noteIdx === 0 ? 'triangle' : 'sine';
        osc.frequency.setValueAtTime(freq, now);

        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(450 + Math.sin(now) * 150, now);

        const duration = 7.5;
        gain.gain.setValueAtTime(0.0001, now);
        gain.gain.linearRampToValueAtTime(0.045, now + 2.5);
        gain.gain.exponentialRampToValueAtTime(0.0001, now + duration);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(this.musicGain);

        osc.start(now);
        osc.stop(now + duration + 0.1);
      });
    };

    playChordStep();
    this.ambientInterval = window.setInterval(playChordStep, 6800);
  }

  public stopAll() {
    if (this.ambientInterval) {
      clearInterval(this.ambientInterval);
      this.ambientInterval = null;
    }
    this.isMusicPlaying = false;
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const soundEngine = new SoundEngine();
