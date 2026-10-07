/**
 * Web Audio API synthesizer for civic transit arrival chimes
 * and Text-to-Speech public address announcements.
 */

class TransitAudioEngine {
  private ctx: AudioContext | null = null;
  private isMuted: boolean = false;

  private getAudioContext(): AudioContext | null {
    if (typeof window === 'undefined') return null;
    if (!this.ctx) {
      const AudioCtxClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
      if (AudioCtxClass) {
        this.ctx = new AudioCtxClass();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume().catch(() => {});
    }
    return this.ctx;
  }

  public setMuted(muted: boolean) {
    this.isMuted = muted;
  }

  public getIsMuted(): boolean {
    return this.isMuted;
  }

  /**
   * Plays the iconic dual-chime or 4-tone melodic arrival alert.
   */
  public playChime(style: 'station' | 'warning' = 'station'): Promise<void> {
    if (this.isMuted) return Promise.resolve();

    return new Promise((resolve) => {
      try {
        const ctx = this.getAudioContext();
        if (!ctx) {
          resolve();
          return;
        }

        const now = ctx.currentTime;
        const notes = style === 'station' 
          ? [
              { freq: 523.25, time: 0, dur: 0.35 },    // C5
              { freq: 659.25, time: 0.22, dur: 0.35 }, // E5
              { freq: 783.99, time: 0.44, dur: 0.35 }, // G5
              { freq: 1046.50, time: 0.66, dur: 0.6 }, // C6
            ]
          : [
              { freq: 440, time: 0, dur: 0.25 },
              { freq: 350, time: 0.28, dur: 0.45 },
            ];

        notes.forEach(({ freq, time, dur }) => {
          const osc = ctx.createOscillator();
          const gain = ctx.createGain();

          osc.type = 'sine';
          osc.frequency.setValueAtTime(freq, now + time);

          // Soft bell chime envelope
          gain.gain.setValueAtTime(0.001, now + time);
          gain.gain.exponentialRampToValueAtTime(0.25, now + time + 0.04);
          gain.gain.exponentialRampToValueAtTime(0.0001, now + time + dur);

          osc.connect(gain);
          gain.connect(ctx.destination);

          osc.start(now + time);
          osc.stop(now + time + dur + 0.05);
        });

        setTimeout(resolve, 1200);
      } catch {
        resolve();
      }
    });
  }

  /**
   * Announces an approaching train over the public address system
   */
  public announceArrival(lineName: string, destination: string, platform: string): void {
    if (this.isMuted) return;

    this.playChime('station').then(() => {
      if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel();
        const text = `Attention passengers. ${lineName} service towards ${destination} is now arriving at ${platform}. Please stand behind the yellow line.`;
        const utterance = new SpeechSynthesisUtterance(text);
        utterance.rate = 0.95;
        utterance.pitch = 1.0;
        utterance.volume = 0.8;

        // Try to pick a clear English voice if available
        const voices = window.speechSynthesis.getVoices();
        const preferredVoice = voices.find(
          (v) => v.lang.startsWith('en') && (v.name.includes('Natural') || v.name.includes('Samantha') || v.name.includes('Google') || v.name.includes('Daniel'))
        ) || voices.find((v) => v.lang.startsWith('en'));

        if (preferredVoice) {
          utterance.voice = preferredVoice;
        }

        window.speechSynthesis.speak(utterance);
      }
    });
  }
}

export const transitAudio = new TransitAudioEngine();
