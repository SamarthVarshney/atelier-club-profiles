/**
 * Hybrid Analog WebAudio Synthesizer & MP3/AAC Deck Engine
 * Plays either uploaded .mp3/.aac URLs OR built-in procedural analog tape loops
 * ('synth:darkroom' | 'synth:kyoto' | 'synth:tape-loop' | 'synth:oscillator')
 * immediately upon user interaction with the Click-to-Enter Splash Screen.
 */

class StudioAudioEngine {
  private ctx: AudioContext | null = null;
  private masterGain: GainNode | null = null;
  private activeNodes: AudioNode[] = [];
  private loopTimer: number | null = null;
  private htmlAudio: HTMLAudioElement | null = null;
  private currentVolume = 0.4;
  private isMuted = false;
  private playing = false;

  private ensureContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      this.ctx = new AudioCtx();
      this.masterGain = this.ctx.createGain();
      this.masterGain.gain.value = this.isMuted ? 0 : this.currentVolume;
      this.masterGain.connect(this.ctx.destination);
    }
    if (this.ctx.state === 'suspended') {
      void this.ctx.resume();
    }
  }

  public stop() {
    this.playing = false;
    if (this.loopTimer !== null) {
      window.clearInterval(this.loopTimer);
      this.loopTimer = null;
    }
    for (const node of this.activeNodes) {
      try {
        if ('stop' in node && typeof (node as OscillatorNode).stop === 'function') {
          (node as OscillatorNode).stop();
        }
        node.disconnect();
      } catch {
        // ignore stopped nodes
      }
    }
    this.activeNodes = [];
    if (this.htmlAudio) {
      this.htmlAudio.pause();
      this.htmlAudio.src = '';
      this.htmlAudio = null;
    }
  }

  public setVolume(vol: number) {
    this.currentVolume = Math.max(0, Math.min(1, vol));
    const effective = this.isMuted ? 0 : this.currentVolume;
    if (this.masterGain && this.ctx) {
      this.masterGain.gain.setTargetAtTime(effective, this.ctx.currentTime, 0.04);
    }
    if (this.htmlAudio) {
      this.htmlAudio.volume = effective;
    }
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
    this.setVolume(this.currentVolume);
  }

  public isPlaying() {
    return this.playing;
  }

  public playTrack(audioUrl: string, onEnded?: () => void) {
    this.stop();
    if (!audioUrl) return;

    // External or uploaded .mp3 / .aac file
    if (!audioUrl.startsWith('synth:')) {
      const audio = new Audio(audioUrl);
      audio.loop = !onEnded;
      audio.volume = this.isMuted ? 0 : this.currentVolume;
      if (onEnded) {
        audio.addEventListener('ended', onEnded);
      }
      this.htmlAudio = audio;
      this.playing = true;
      void audio.play().catch(() => {
        this.playing = false;
      });
      return;
    }

    // Built-in warm analog tape synth presets
    this.ensureContext();
    if (!this.ctx || !this.masterGain) return;
    this.playing = true;

    const preset = audioUrl.slice('synth:'.length);
    const chordsByPreset: Record<string, number[][]> = {
      darkroom: [
        [146.83, 220.0, 261.63, 329.63], // Dm7
        [130.81, 196.0, 246.94, 329.63], // Cmaj9
        [116.54, 174.61, 220.0, 293.66], // Bbmaj7
        [110.0, 164.81, 207.65, 261.63], // A7sus
      ],
      kyoto: [
        [196.0, 293.66, 329.63, 440.0], // G6/9 pentatonic
        [164.81, 246.94, 293.66, 392.0], // Em7
        [130.81, 196.0, 246.94, 329.63], // Cmaj7
        [146.83, 220.0, 293.66, 392.0], // D6
      ],
      'tape-loop': [
        [110.0, 164.81, 220.0, 277.18],
        [98.0, 146.83, 196.0, 246.94],
        [87.31, 130.81, 174.61, 220.0],
        [98.0, 146.83, 220.0, 293.66],
      ],
      oscillator: [
        [108.0, 216.0, 324.0, 432.0],
        [96.0, 192.0, 288.0, 432.0],
      ],
    };

    const chords = chordsByPreset[preset] || chordsByPreset.darkroom;
    let step = 0;

    // Subtle warm low-passed tape hiss bed
    const bufferSize = this.ctx.sampleRate * 2;
    const noiseBuffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = noiseBuffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.014;
    }
    const noiseSource = this.ctx.createBufferSource();
    noiseSource.buffer = noiseBuffer;
    noiseSource.loop = true;
    const hissFilter = this.ctx.createBiquadFilter();
    hissFilter.type = 'lowpass';
    hissFilter.frequency.value = 950;
    noiseSource.connect(hissFilter);
    hissFilter.connect(this.masterGain);
    noiseSource.start();
    this.activeNodes.push(noiseSource, hissFilter);

    const triggerChord = () => {
      if (!this.ctx || !this.masterGain || !this.playing) return;
      const now = this.ctx.currentTime;
      const freqs = chords[step % chords.length];
      step += 1;

      const filter = this.ctx.createBiquadFilter();
      filter.type = 'lowpass';
      filter.frequency.setValueAtTime(620, now);
      filter.frequency.exponentialRampToValueAtTime(1250, now + 1.4);
      filter.frequency.exponentialRampToValueAtTime(520, now + 3.8);
      filter.connect(this.masterGain);

      freqs.forEach((freq, idx) => {
        if (!this.ctx) return;
        const osc = this.ctx.createOscillator();
        const env = this.ctx.createGain();
        osc.type = preset === 'oscillator' ? 'sine' : idx % 2 === 0 ? 'triangle' : 'sine';
        // Slight analog tape detune
        osc.detune.value = (idx - 1.5) * 4.5;
        osc.frequency.setValueAtTime(freq, now);

        env.gain.setValueAtTime(0.0001, now);
        env.gain.linearRampToValueAtTime(0.065 / freqs.length * 2.2, now + 0.65);
        env.gain.exponentialRampToValueAtTime(0.0008, now + 3.9);

        osc.connect(env);
        env.connect(filter);
        osc.start(now);
        osc.stop(now + 4.0);
      });
    };

    triggerChord();
    this.loopTimer = window.setInterval(triggerChord, 3800);
  }
}

export const studioAudio = new StudioAudioEngine();
