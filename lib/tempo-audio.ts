// Web Audio tempo engine. Client-only — construct inside a tap handler or effect.
// Beeps are scheduled against the audio clock (ctx.currentTime), never JS timers,
// so spacing stays exact even when the main thread is busy.

export interface TempoConfig {
  back: number // seconds, takeaway → top
  down: number // seconds, top → impact
  gap: number // seconds of rest after impact (also the lead-in before the first rep)
  repeat: boolean
  topTone: boolean // false for metronome: only takeaway + impact tick
  volume: number // 0–1
}

export interface TempoPosition {
  /** 0 = address/impact, 1 = top of the swing */
  position: number
  /** true briefly after the impact tone */
  impact: boolean
  /** ring progress through the swing: 0 → 0.5 over the backswing, 0.5 → 1 over the downswing; 0 when not swinging */
  swing: number
  /** seconds since the impact tone of the current rep; null before impact */
  sinceImpact: number | null
  /** seconds until the next rep starts; 0 while swinging or when no rep is coming */
  restLeft: number
  /** share of the current rest still to go, 1 → 0 */
  restFraction: number
}

const LOOKAHEAD = 0.15 // seconds scheduled ahead of the audio clock
const TICK_MS = 25
const BEEP = 0.07
const IMPACT_FLASH = 0.18
const FREQ = { start: 660, top: 880, impact: 1320 }

type AudioCtor = typeof AudioContext

export class TempoEngine {
  private ctx: AudioContext | null = null
  private master: GainNode | null = null
  private timer: ReturnType<typeof setInterval> | null = null
  private endTimer: ReturnType<typeof setTimeout> | null = null
  private config: TempoConfig | null = null
  private nextRep = 0
  private firstRep = 0
  private leadIn = 0
  private reps: number[] = []
  private live = new Set<OscillatorNode>()

  /** Called when a non-repeating rep finishes on its own. */
  onEnd: (() => void) | null = null

  /** Must be called from a user gesture the first time (iOS). */
  async start(config: TempoConfig): Promise<void> {
    this.halt()

    if (!this.ctx) {
      const Ctor: AudioCtor | undefined =
        window.AudioContext ?? (window as unknown as { webkitAudioContext?: AudioCtor }).webkitAudioContext
      if (!Ctor) throw new Error('Web Audio is not supported in this browser')
      // Lets tones play with the iOS silent switch on (Safari 16.4+)
      const session = (navigator as unknown as { audioSession?: { type: string } }).audioSession
      if (session) session.type = 'playback'
      this.ctx = new Ctor()
      this.master = this.ctx.createGain()
      this.master.connect(this.ctx.destination)
    }
    if (this.ctx.state !== 'running') await this.ctx.resume()

    this.config = config
    this.setVolume(config.volume)
    this.leadIn = Math.max(config.gap, 0.5)
    this.firstRep = this.ctx.currentTime + this.leadIn
    this.nextRep = this.firstRep
    this.reps = []
    this.timer = setInterval(() => this.schedule(), TICK_MS)
    this.schedule()
  }

  stop(): void {
    this.halt()
  }

  setVolume(volume: number): void {
    if (this.master && this.ctx) {
      this.master.gain.setValueAtTime(Math.min(1, Math.max(0, volume)), this.ctx.currentTime)
    }
  }

  get playing(): boolean {
    return this.timer !== null || this.endTimer !== null
  }

  /** Where the club should be right now — drives the visual. */
  getPosition(): TempoPosition {
    const idle = { position: 0, impact: false, swing: 0, sinceImpact: null, restLeft: 0, restFraction: 0 }
    if (!this.ctx || !this.config) return idle
    const now = this.ctx.currentTime
    let start: number | null = null
    for (const t of this.reps) {
      if (t <= now) start = t
    }
    if (start === null) {
      // Lead-in before the first rep
      const left = this.firstRep - now
      return left > 0 ? { ...idle, restLeft: left, restFraction: Math.min(1, left / this.leadIn) } : idle
    }
    this.reps = this.reps.filter(t => t >= start!)

    const { back, down, gap, repeat } = this.config
    const e = now - start
    if (e < back) return { ...idle, position: e / back, swing: (e / back) / 2 }
    if (e < back + down) {
      const d = (e - back) / down
      return { ...idle, position: 1 - d, swing: 0.5 + d / 2 }
    }
    const rested = e - back - down
    const restLeft = repeat ? Math.max(0, gap - rested) : 0
    return {
      position: 0,
      impact: rested < IMPACT_FLASH,
      swing: 0,
      sinceImpact: rested,
      restLeft,
      restFraction: gap > 0 ? restLeft / gap : 0,
    }
  }

  dispose(): void {
    this.halt()
    this.ctx?.close().catch(() => {})
    this.ctx = null
    this.master = null
  }

  private schedule(): void {
    const { ctx, config } = this
    if (!ctx || !config) return
    while (this.nextRep < ctx.currentTime + LOOKAHEAD) {
      const t0 = this.nextRep
      const impactAt = t0 + config.back + config.down
      this.beep(FREQ.start, t0)
      if (config.topTone) this.beep(FREQ.top, t0 + config.back)
      this.beep(FREQ.impact, impactAt)
      this.reps.push(t0)

      if (!config.repeat) {
        if (this.timer) clearInterval(this.timer)
        this.timer = null
        const ms = (impactAt + IMPACT_FLASH + BEEP - ctx.currentTime) * 1000
        this.endTimer = setTimeout(() => {
          this.endTimer = null
          this.onEnd?.()
        }, ms)
        return
      }
      this.nextRep = impactAt + config.gap
    }
  }

  private beep(freq: number, at: number): void {
    if (!this.ctx || !this.master) return
    const osc = this.ctx.createOscillator()
    const gain = this.ctx.createGain()
    osc.type = 'sine'
    osc.frequency.value = freq
    // Short attack/release envelope avoids clicks
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(1, at + 0.005)
    gain.gain.setValueAtTime(1, at + BEEP - 0.02)
    gain.gain.linearRampToValueAtTime(0, at + BEEP)
    osc.connect(gain)
    gain.connect(this.master)
    osc.start(at)
    osc.stop(at + BEEP + 0.01)
    this.live.add(osc)
    osc.onended = () => {
      this.live.delete(osc)
      gain.disconnect()
    }
  }

  private halt(): void {
    if (this.timer) clearInterval(this.timer)
    if (this.endTimer) clearTimeout(this.endTimer)
    this.timer = null
    this.endTimer = null
    for (const osc of this.live) {
      try {
        osc.stop()
      } catch {
        // already stopped
      }
    }
    this.live.clear()
    this.reps = []
    this.config = null
  }
}
