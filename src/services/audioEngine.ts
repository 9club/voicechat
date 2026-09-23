/**
 * Audio Engine for DiepKhuc Live
 * Handles Web Audio API sound effects (applause, cheer, etc.),
 * Microphone capture & reverb processor, and Karaoke beat synthesis.
 */

class AudioEngine {
  private ctx: AudioContext | null = null;
  private micStream: MediaStream | null = null;
  private micSource: MediaStreamAudioSourceNode | null = null;
  private analyser: AnalyserNode | null = null;
  private gainNode: GainNode | null = null;
  private reverbDelay: DelayNode | null = null;
  private reverbGain: GainNode | null = null;
  private isReverbActive = false;

  // Karaoke synth state
  private isPlayingKaraoke = false;
  private karaokeInterval: any = null;
  private songTempo = 100;
  private currentStep = 0;

  private getContext(): AudioContext {
    if (!this.ctx) {
      const AudioContextClass = window.AudioContext || (window as any).webkitAudioContext;
      this.ctx = new AudioContextClass();
    }
    if (this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
    return this.ctx;
  }

  // --- Soundboard Effects ---

  /**
   * Generates realistic applause sound using filtered noise bursts
   */
  public playApplause() {
    try {
      const ctx = this.getContext();
      const duration = 2.5;
      const bufferSize = ctx.sampleRate * duration;
      const buffer = ctx.createBuffer(1, bufferSize, ctx.sampleRate);
      const data = buffer.getChannelData(0);

      // Generate pink/brown noise
      let b0 = 0, b1 = 0, b2 = 0;
      for (let i = 0; i < bufferSize; i++) {
        const white = Math.random() * 2 - 1;
        b0 = 0.99886 * b0 + white * 0.0555179;
        b1 = 0.99332 * b1 + white * 0.0750759;
        b2 = 0.96900 * b2 + white * 0.1538520;
        data[i] = (b0 + b1 + b2) * 0.2;
      }

      const noise = ctx.createBufferSource();
      noise.buffer = buffer;

      // Bandpass filter centered around clapping frequencies
      const filter = ctx.createBiquadFilter();
      filter.type = 'bandpass';
      filter.frequency.setValueAtTime(1200, ctx.currentTime);
      filter.Q.setValueAtTime(2.5, ctx.currentTime);

      const gain = ctx.createGain();
      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.4, ctx.currentTime + 0.3);
      gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + duration);

      noise.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      noise.start();
      noise.stop(ctx.currentTime + duration);
    } catch (e) {
      console.warn('Audio playApplause error:', e);
    }
  }

  /**
   * Cheering / Woohoo sound
   */
  public playCheer() {
    try {
      const ctx = this.getContext();
      const duration = 2.2;
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();

      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(280, ctx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(540, ctx.currentTime + 0.6);
      osc.frequency.exponentialRampToValueAtTime(420, ctx.currentTime + 1.8);

      const filter = ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(800, ctx.currentTime);
      filter.frequency.linearRampToValueAtTime(1800, ctx.currentTime + 0.5);
      filter.frequency.linearRampToValueAtTime(600, ctx.currentTime + 2.0);

      gain.gain.setValueAtTime(0.01, ctx.currentTime);
      gain.gain.linearRampToValueAtTime(0.3, ctx.currentTime + 0.2);
      gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

      osc.connect(filter);
      filter.connect(gain);
      gain.connect(ctx.destination);

      osc.start();
      osc.stop(ctx.currentTime + duration);

      // Play secondary harmonic cheering
      setTimeout(() => this.playApplause(), 100);
    } catch (e) {
      console.warn('Audio playCheer error:', e);
    }
  }

  /**
   * Laughing effect
   */
  public playLaugh() {
    try {
      const ctx = this.getContext();
      const pitches = [380, 420, 360, 400, 340, 300];
      pitches.forEach((freq, idx) => {
        const start = ctx.currentTime + idx * 0.18;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'triangle';
        osc.frequency.setValueAtTime(freq, start);
        osc.frequency.exponentialRampToValueAtTime(freq * 0.8, start + 0.14);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.3, start + 0.03);
        gain.gain.exponentialRampToValueAtTime(0.01, start + 0.15);

        osc.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + 0.16);
      });
    } catch (e) {
      console.warn('Audio playLaugh error:', e);
    }
  }

  /**
   * Drumroll effect
   */
  public playDrumRoll() {
    try {
      const ctx = this.getContext();
      const beats = 24;
      const speed = 0.07;
      for (let i = 0; i < beats; i++) {
        const start = ctx.currentTime + i * speed;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(140 + Math.random() * 30, start);

        const vol = 0.05 + (i / beats) * 0.25;
        gain.gain.setValueAtTime(vol, start);
        gain.gain.exponentialRampToValueAtTime(0.001, start + 0.05);

        osc.connect(gain);
        gain.connect(ctx.destination);
        osc.start(start);
        osc.stop(start + 0.06);
      }

      // Final crash cymbal
      const crashTime = ctx.currentTime + beats * speed;
      const oscCrash = ctx.createOscillator();
      const gainCrash = ctx.createGain();
      oscCrash.type = 'sawtooth';
      oscCrash.frequency.setValueAtTime(600, crashTime);
      gainCrash.gain.setValueAtTime(0.4, crashTime);
      gainCrash.gain.exponentialRampToValueAtTime(0.001, crashTime + 1.2);
      oscCrash.connect(gainCrash);
      gainCrash.connect(ctx.destination);
      oscCrash.start(crashTime);
      oscCrash.stop(crashTime + 1.2);
    } catch (e) {
      console.warn('Audio playDrumRoll error:', e);
    }
  }

  /**
   * Fanfare / Triumph trumpet chords
   */
  public playFanfare() {
    try {
      const ctx = this.getContext();
      const notes = [
        { freq: 261.63, delay: 0.0, dur: 0.2 }, // C4
        { freq: 329.63, delay: 0.2, dur: 0.2 }, // E4
        { freq: 392.00, delay: 0.4, dur: 0.2 }, // G4
        { freq: 523.25, delay: 0.6, dur: 0.9 }, // C5 triumph
      ];

      notes.forEach(({ freq, delay, dur }) => {
        const start = ctx.currentTime + delay;
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();

        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(freq, start);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(freq * 3, start);

        gain.gain.setValueAtTime(0, start);
        gain.gain.linearRampToValueAtTime(0.35, start + 0.04);
        gain.gain.exponentialRampToValueAtTime(0.001, start + dur);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start(start);
        osc.stop(start + dur);
      });
    } catch (e) {
      console.warn('Audio playFanfare error:', e);
    }
  }

  // --- Microphone & Karaoke Reverb Effect Processor ---

  /**
   * Setup microphone capture with real-time Analyser for visualizer & Echo/Reverb
   */
  public async setupMicrophone(stream: MediaStream): Promise<{ analyser: AnalyserNode }> {
    const ctx = this.getContext();
    this.micStream = stream;

    // Disconnect old if any
    if (this.micSource) {
      try { this.micSource.disconnect(); } catch (e) {}
    }

    this.micSource = ctx.createMediaStreamSource(stream);
    this.analyser = ctx.createAnalyser();
    this.analyser.fftSize = 256;
    this.analyser.smoothingTimeConstant = 0.8;

    this.gainNode = ctx.createGain();
    this.gainNode.gain.setValueAtTime(1.0, ctx.currentTime);

    // Reverb / Echo network (Slapback delay classic for Bolero karaoke)
    this.reverbDelay = ctx.createDelay();
    this.reverbDelay.delayTime.setValueAtTime(0.24, ctx.currentTime); // 240ms slap echo

    const feedback = ctx.createGain();
    feedback.gain.setValueAtTime(0.42, ctx.currentTime);

    const lowpass = ctx.createBiquadFilter();
    lowpass.type = 'lowpass';
    lowpass.frequency.setValueAtTime(3200, ctx.currentTime);

    this.reverbGain = ctx.createGain();
    this.reverbGain.gain.setValueAtTime(this.isReverbActive ? 0.45 : 0.0, ctx.currentTime);

    // Wire up graph
    this.micSource.connect(this.analyser);
    this.micSource.connect(this.gainNode);

    // Reverb loop
    this.gainNode.connect(this.reverbDelay);
    this.reverbDelay.connect(lowpass);
    lowpass.connect(feedback);
    feedback.connect(this.reverbDelay);
    lowpass.connect(this.reverbGain);

    // Connect to destination (so user can hear their own monitor if enabled or for local testing)
    // To avoid feedback loops during local testing, we keep the monitor subtle or muted
    // this.gainNode.connect(ctx.destination);

    return { analyser: this.analyser };
  }

  public toggleReverb(enable: boolean) {
    this.isReverbActive = enable;
    if (this.reverbGain && this.ctx) {
      this.reverbGain.gain.setValueAtTime(enable ? 0.45 : 0.0, this.ctx.currentTime);
    }
  }

  public getMicFrequencyData(): Uint8Array | null {
    if (!this.analyser) return null;
    const data = new Uint8Array(this.analyser.frequencyBinCount);
    this.analyser.getByteFrequencyData(data);
    return data;
  }

  // --- Karaoke Music Backing Synthesizer ---

  /**
   * Plays synthetic backing tracks for songs (Acoustic Bolero, Pop Ballad, DJ Remix beats)
   * This guarantees background music plays for the room seamlessly without external MP3 files!
   */
  public startKaraokeBacking(songGenre: string, bpm: number = 88) {
    this.stopKaraokeBacking();
    this.isPlayingKaraoke = true;
    this.songTempo = bpm;
    this.currentStep = 0;

    const ctx = this.getContext();
    const stepDuration = (60 / this.songTempo) / 2; // eighth notes

    // Chords progression based on genre (Am - Dm - G - C - F - E7 - Am)
    const chordsAm = [
      [220, 261.63, 329.63], // Am
      [293.66, 349.23, 440],    // Dm
      [196, 246.94, 293.66],    // G
      [261.63, 329.63, 392],    // C
      [174.61, 220, 261.63],    // F
      [164.81, 207.65, 246.94], // E7
    ];

    this.karaokeInterval = setInterval(() => {
      if (!this.isPlayingKaraoke) return;
      try {
        const chordIndex = Math.floor((this.currentStep / 8) % chordsAm.length);
        const chord = chordsAm[chordIndex];
        const isDownbeat = this.currentStep % 4 === 0;

        // Bass note on downbeats
        if (this.currentStep % 2 === 0) {
          const bassOsc = ctx.createOscillator();
          const bassGain = ctx.createGain();
          bassOsc.type = 'triangle';
          bassOsc.frequency.setValueAtTime(chord[0] / 2, ctx.currentTime);
          bassGain.gain.setValueAtTime(0.2, ctx.currentTime);
          bassGain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.35);
          bassOsc.connect(bassGain);
          bassGain.connect(ctx.destination);
          bassOsc.start();
          bassOsc.stop(ctx.currentTime + 0.36);
        }

        // Chord arpeggiation or soft guitar pluck
        const note = chord[this.currentStep % chord.length];
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = songGenre === 'Remix' ? 'sawtooth' : 'sine';
        osc.frequency.setValueAtTime(note, ctx.currentTime);

        const filter = ctx.createBiquadFilter();
        filter.type = 'lowpass';
        filter.frequency.setValueAtTime(1400, ctx.currentTime);

        const vol = isDownbeat ? 0.12 : 0.07;
        gain.gain.setValueAtTime(vol, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

        osc.connect(filter);
        filter.connect(gain);
        gain.connect(ctx.destination);

        osc.start();
        osc.stop(ctx.currentTime + 0.3);

        // Hi-hat / Percussion rhythm
        if (this.currentStep % 2 === 1) {
          this.playHiHat(ctx, isDownbeat ? 0.06 : 0.03);
        }

        this.currentStep++;
      } catch (e) {
        // ignore timing glitch
      }
    }, stepDuration * 1000);
  }

  private playHiHat(ctx: AudioContext, vol: number) {
    try {
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.type = 'sawtooth';
      osc.frequency.setValueAtTime(7000 + Math.random() * 2000, ctx.currentTime);

      gain.gain.setValueAtTime(vol, ctx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + 0.04);

      osc.connect(gain);
      gain.connect(ctx.destination);
      osc.start();
      osc.stop(ctx.currentTime + 0.05);
    } catch (e) {}
  }

  public resume() {
    try {
      const ctx = this.getContext();
      if (ctx.state === 'suspended') {
        ctx.resume();
      }
    } catch (e) {
      console.warn('Audio resume error:', e);
    }
  }

  public playSong(song: any, offsetSeconds: number = 0) {
    if (song && song.genre) {
      this.startKaraokeBacking(song.genre, song.tempo || 88);
    }
  }

  public stopSong() {
    this.stopKaraokeBacking();
  }

  public stopKaraokeBacking() {
    this.isPlayingKaraoke = false;
    if (this.karaokeInterval) {
      clearInterval(this.karaokeInterval);
      this.karaokeInterval = null;
    }
  }

  public destroy() {
    this.stopKaraokeBacking();
    if (this.micStream) {
      this.micStream.getTracks().forEach(t => t.stop());
      this.micStream = null;
    }
    if (this.ctx) {
      this.ctx.close();
      this.ctx = null;
    }
  }
}

export const audioEngine = new AudioEngine();
