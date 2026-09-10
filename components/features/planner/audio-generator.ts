/**
 * Lightweight Web Audio API synthesizer for ambient focus noise and completion chimes.
 * Works 100% in the browser with 0 external sound files or asset requests.
 */

class AudioSynthesizer {
  private ctx: AudioContext | null = null
  private activeNoiseNode: AudioNode | null = null
  private gainNode: GainNode | null = null
  private isPlaying = false
  private currentMode: "brown" | "rain" | "drone" | "off" = "off"

  private initContext() {
    if (!this.ctx) {
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext
      this.ctx = new AudioCtx()
    }
    if (this.ctx.state === "suspended") {
      this.ctx.resume()
    }
  }

  public playAmbient(mode: "brown" | "rain" | "drone", volume = 0.25) {
    this.stopAmbient()
    this.initContext()
    if (!this.ctx) return

    this.gainNode = this.ctx.createGain()
    this.gainNode.gain.setValueAtTime(volume, this.ctx.currentTime)
    this.gainNode.connect(this.ctx.destination)

    if (mode === "brown") {
      this.playBrownNoise()
    } else if (mode === "rain") {
      this.playRainNoise()
    } else if (mode === "drone") {
      this.playFocusDrone()
    }

    this.isPlaying = true
    this.currentMode = mode
  }

  public setVolume(volume: number) {
    if (this.gainNode && this.ctx) {
      this.gainNode.gain.setValueAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime)
    }
  }

  public stopAmbient() {
    if (this.activeNoiseNode) {
      try {
        ;(this.activeNoiseNode as any).stop?.()
        this.activeNoiseNode.disconnect()
      } catch {}
      this.activeNoiseNode = null
    }
    if (this.gainNode) {
      try {
        this.gainNode.disconnect()
      } catch {}
      this.gainNode = null
    }
    this.isPlaying = false
    this.currentMode = "off"
  }

  public getMode(): "brown" | "rain" | "drone" | "off" {
    return this.isPlaying ? this.currentMode : "off"
  }

  private playBrownNoise() {
    if (!this.ctx || !this.gainNode) return
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)
    let lastOut = 0.0

    for (let i = 0; i < bufferSize; i++) {
      const white = Math.random() * 2 - 1
      data[i] = (lastOut + 0.02 * white) / 1.02
      lastOut = data[i]
      data[i] *= 3.5 // scale volume
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = "lowpass"
    filter.frequency.setValueAtTime(450, this.ctx.currentTime)

    noise.connect(filter)
    filter.connect(this.gainNode)
    noise.start()
    this.activeNoiseNode = noise
  }

  private playRainNoise() {
    if (!this.ctx || !this.gainNode) return
    const bufferSize = this.ctx.sampleRate * 2
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate)
    const data = buffer.getChannelData(0)

    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.4
    }

    const noise = this.ctx.createBufferSource()
    noise.buffer = buffer
    noise.loop = true

    const filter = this.ctx.createBiquadFilter()
    filter.type = "bandpass"
    filter.frequency.setValueAtTime(1000, this.ctx.currentTime)
    filter.Q.setValueAtTime(0.7, this.ctx.currentTime)

    noise.connect(filter)
    filter.connect(this.gainNode)
    noise.start()
    this.activeNoiseNode = noise
  }

  private playFocusDrone() {
    if (!this.ctx || !this.gainNode) return
    const osc1 = this.ctx.createOscillator()
    const osc2 = this.ctx.createOscillator()

    osc1.type = "sine"
    osc1.frequency.setValueAtTime(136.1, this.ctx.currentTime) // Om / Focus frequency

    osc2.type = "triangle"
    osc2.frequency.setValueAtTime(204.15, this.ctx.currentTime) // Harmonic 5th

    const subGain = this.ctx.createGain()
    subGain.gain.setValueAtTime(0.2, this.ctx.currentTime)

    osc1.connect(this.gainNode)
    osc2.connect(subGain)
    subGain.connect(this.gainNode)

    osc1.start()
    osc2.start()

    // Store compound stopper
    this.activeNoiseNode = {
      disconnect: () => {
        try {
          osc1.stop()
          osc2.stop()
          osc1.disconnect()
          osc2.disconnect()
          subGain.disconnect()
        } catch {}
      },
    } as any
  }

  /** Play a bright, delightful chime when completing a task */
  public playCelebrationChime() {
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [523.25, 659.25, 783.99, 1046.5] // C5, E5, G5, C6 arpeggio

      notes.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const noteGain = this.ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + idx * 0.08)

        noteGain.gain.setValueAtTime(0, now + idx * 0.08)
        noteGain.gain.linearRampToValueAtTime(0.18, now + idx * 0.08 + 0.02)
        noteGain.gain.exponentialRampToValueAtTime(0.0001, now + idx * 0.08 + 0.5)

        osc.connect(noteGain)
        noteGain.connect(this.ctx.destination)

        osc.start(now + idx * 0.08)
        osc.stop(now + idx * 0.08 + 0.55)
      })
    } catch {}
  }

  /** Play an attention double chime when a time window finishes */
  public playWindowAlert() {
    try {
      this.initContext()
      if (!this.ctx) return

      const now = this.ctx.currentTime
      const notes = [440, 880] // A4, A5

      notes.forEach((freq, idx) => {
        if (!this.ctx) return
        const osc = this.ctx.createOscillator()
        const noteGain = this.ctx.createGain()

        osc.type = "sine"
        osc.frequency.setValueAtTime(freq, now + idx * 0.15)

        noteGain.gain.setValueAtTime(0, now + idx * 0.15)
        noteGain.gain.linearRampToValueAtTime(0.2, now + idx * 0.15 + 0.02)
        noteGain.gain.exponentialRampToValueAtTime(0.001, now + idx * 0.15 + 0.4)

        osc.connect(noteGain)
        noteGain.connect(this.ctx.destination)

        osc.start(now + idx * 0.15)
        osc.stop(now + idx * 0.15 + 0.45)
      })
    } catch {}
  }
}

export const audioSynthesizer = typeof window !== "undefined" ? new AudioSynthesizer() : null
