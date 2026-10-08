import { globalEvents } from '../core/EventBus.js';

export class AudioManager {
  constructor() {
    this.audioCtx = null;
    this.isMuted = false;
    this.masterVolume = 0.65;
    this.isInitialized = false;

    // Music playlist (procedural or loaded from assets/audio/)
    this.bgmPlaying = false;
    this.customBgmElements = new Map();

    this.bindEvents();
  }

  init() {
    if (this.isInitialized) return;
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      this.audioCtx = new AudioContext();
      this.masterGain = this.audioCtx.createGain();
      this.masterGain.gain.setValueAtTime(this.masterVolume, this.audioCtx.currentTime);
      this.masterGain.connect(this.audioCtx.destination);

      this.isInitialized = true;
      console.log('[AudioManager] Web Audio system successfully initialized.');
      this.startAmbientLuteLoop();
    } catch (e) {
      console.warn('[AudioManager] Failed to initialize AudioContext:', e);
    }
  }

  bindEvents() {
    // Unlock Web Audio on first user interaction
    const unlock = () => {
      if (!this.isInitialized) {
        this.init();
      } else if (this.audioCtx && this.audioCtx.state === 'suspended') {
        this.audioCtx.resume();
      }
      window.removeEventListener('click', unlock);
      window.removeEventListener('keydown', unlock);
    };
    window.addEventListener('click', unlock);
    window.addEventListener('keydown', unlock);

    // Subscribe to gameplay events
    globalEvents.on('thunder', () => this.playThunder());
    globalEvents.on('building-built', () => this.playConstructionSfx());
    globalEvents.on('achievement-unlocked', () => this.playFanfare());
    globalEvents.on('harvest', () => this.playHarvestSfx());
  }

  toggleMute() {
    this.isMuted = !this.isMuted;
    if (this.masterGain && this.audioCtx) {
      this.masterGain.gain.setValueAtTime(this.isMuted ? 0 : this.masterVolume, this.audioCtx.currentTime);
    }
    return this.isMuted;
  }

  // --- Procedural Medieval Melodic Ambient Generator ---
  startAmbientLuteLoop() {
    if (!this.audioCtx) return;

    // Lute pentatonic scale in D minor / Dorian (D, E, F, G, A, C)
    const scale = [220, 246.94, 261.63, 293.66, 329.63, 392.00, 440.00];

    const playNextNote = () => {
      if (this.isMuted || !this.audioCtx) {
        setTimeout(playNextNote, 2500);
        return;
      }

      const freq = scale[Math.floor(Math.random() * scale.length)];
      this.playPluckedString(freq, 0.25);

      // Random phrasing pause
      const delay = 1800 + Math.random() * 2800;
      setTimeout(playNextNote, delay);
    };

    setTimeout(playNextNote, 1000);
  }

  playPluckedString(frequency, duration = 0.3) {
    if (!this.audioCtx || this.isMuted) return;

    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(frequency, this.audioCtx.currentTime);

    // Warm wooden filter
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(1400, this.audioCtx.currentTime);

    const now = this.audioCtx.currentTime;
    gain.gain.setValueAtTime(0.001, now);
    gain.gain.linearRampToValueAtTime(0.18, now + 0.02);
    gain.gain.exponentialRampToValueAtTime(0.001, now + duration + 1.2);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + duration + 1.4);
  }

  playThunder() {
    if (!this.audioCtx || this.isMuted) return;

    // Deep rolling thunder synthesis
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();
    const filter = this.audioCtx.createBiquadFilter();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(65, now);
    osc.frequency.exponentialRampToValueAtTime(28, now + 2.2);

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(180, now);

    gain.gain.setValueAtTime(0.01, now);
    gain.gain.linearRampToValueAtTime(0.42, now + 0.1);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 2.5);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.masterGain);

    osc.start(now);
    osc.stop(now + 2.6);
  }

  playConstructionSfx() {
    if (!this.audioCtx || this.isMuted) return;

    const now = this.audioCtx.currentTime;
    // Two rapid hammer strikes
    [0, 0.14].forEach(offset => {
      const strikeTime = now + offset;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(520, strikeTime);
      osc.frequency.exponentialRampToValueAtTime(140, strikeTime + 0.08);

      gain.gain.setValueAtTime(0.2, strikeTime);
      gain.gain.exponentialRampToValueAtTime(0.001, strikeTime + 0.1);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(strikeTime);
      osc.stop(strikeTime + 0.12);
    });
  }

  playHarvestSfx() {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const osc = this.audioCtx.createOscillator();
    const gain = this.audioCtx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(440, now);
    osc.frequency.linearRampToValueAtTime(880, now + 0.15);

    gain.gain.setValueAtTime(0.15, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.25);

    osc.connect(gain);
    gain.connect(this.masterGain);
    osc.start(now);
    osc.stop(now + 0.3);
  }

  playFanfare() {
    if (!this.audioCtx || this.isMuted) return;
    const now = this.audioCtx.currentTime;
    const notes = [392, 523.25, 659.25, 783.99]; // G4, C5, E5, G5
    notes.forEach((freq, i) => {
      const noteTime = now + i * 0.12;
      const osc = this.audioCtx.createOscillator();
      const gain = this.audioCtx.createGain();

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0.2, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.35);

      osc.connect(gain);
      gain.connect(this.masterGain);
      osc.start(noteTime);
      osc.stop(noteTime + 0.4);
    });
  }

  // --- External Audio File Loader Hook for User's assets/audio/ files ---
  loadCustomTrack(id, audioFilePath) {
    try {
      const audio = new Audio(audioFilePath);
      audio.loop = true;
      audio.volume = this.masterVolume;
      this.customBgmElements.set(id, audio);
      console.log(`[AudioManager] Custom audio track loaded: ${audioFilePath}`);
    } catch (e) {
      console.warn(`[AudioManager] Could not load audio file ${audioFilePath}:`, e);
    }
  }

  playCustomTrack(id) {
    const audio = this.customBgmElements.get(id);
    if (audio) {
      audio.play().catch(e => console.warn('Audio play prevented:', e));
    }
  }
}
