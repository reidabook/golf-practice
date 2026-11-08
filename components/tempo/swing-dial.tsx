'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { TempoEngine } from '@/lib/tempo-audio'
import { spriteFrame, type TempoMode } from '@/lib/tempo'
import { SWING_SPRITES } from '@/components/tempo/swing-sprites'

type Phase = 'idle' | 'swing' | 'impact' | 'rest'

/**
 * Circular swing visual. The ring is laid out like the swing: start and impact at
 * 6 o'clock, top at 12. It fills up the left side on the backswing, down the right
 * side on the downswing, then unwinds to empty over the rest. The golfer in the middle
 * is video frames from a sprite sheet, drawn on a canvas in step with the same clock.
 */
export function SwingDial({
  engineRef,
  playing,
  mode,
  showCountdown,
}: {
  engineRef: RefObject<TempoEngine | null>
  playing: boolean
  mode: TempoMode
  showCountdown: boolean
}) {
  const ringRef = useRef<SVGCircleElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sheetRef = useRef<HTMLImageElement | null>(null)
  const wantedRef = useRef(0) // sprite frame the clock wants
  const paintedRef = useRef(-1) // sprite frame currently on the canvas
  const sprite = SWING_SPRITES[mode]

  // Draw one sprite frame, tinted with the theme's foreground colour
  const paint = (frame: number) => {
    wantedRef.current = frame
    const canvas = canvasRef.current
    const sheet = sheetRef.current
    if (!canvas || !sheet?.complete || paintedRef.current === frame) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    const k = canvas.width / 200
    const { cols, frameWidth: fw, frameHeight: fh } = sprite
    ctx.globalCompositeOperation = 'source-over'
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    ctx.drawImage(sheet, (frame % cols) * fw, Math.floor(frame / cols) * fh, fw, fh, sprite.x * k, sprite.y * k, sprite.width * k, sprite.height * k)
    ctx.globalCompositeOperation = 'source-in'
    ctx.fillStyle = getComputedStyle(canvas).color
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    paintedRef.current = frame
  }

  // Size the canvas for the screen and load the shot type's sprite sheet
  useEffect(() => {
    paintedRef.current = -1
    const canvas = canvasRef.current
    if (canvas) {
      canvas.width = canvas.height = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1))
      canvas.getContext('2d')?.clearRect(0, 0, canvas.width, canvas.height)
    }
    const sheet = new Image()
    sheet.onload = () => {
      paintedRef.current = -1
      paint(wantedRef.current)
    }
    sheet.src = sprite.src
    sheetRef.current = sheet
    return () => {
      sheet.onload = null
      sheetRef.current = null
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [sprite])

  // Drive the ring, golfer and countdown from the audio clock
  useEffect(() => {
    const draw = (
      phase: Phase,
      progress: number,
      restLeft: number,
      swing = 0,
      sinceImpact: number | null = null
    ) => {
      const ring = ringRef.current
      if (ring) {
        ring.dataset.phase = phase
        ring.style.strokeDashoffset = String(1 - progress)
        ring.style.opacity = progress > 0 ? '1' : '0'
      }
      paint(spriteFrame(sprite, swing, sinceImpact))
      if (labelRef.current) {
        labelRef.current.textContent = restLeft > 0 ? `Next rep in ${restLeft.toFixed(1)}s` : ''
      }
    }
    if (!playing) {
      draw('idle', 0, 0)
      return
    }
    let raf = 0
    const frame = () => {
      const pos = engineRef.current?.getPosition()
      if (pos) {
        const phase = pos.swing > 0 ? 'swing' : pos.impact ? 'impact' : pos.restLeft > 0 ? 'rest' : 'idle'
        const progress = phase === 'swing' ? pos.swing : phase === 'impact' ? 1 : phase === 'rest' ? pos.restFraction : 0
        draw(phase, progress, phase === 'swing' ? 0 : pos.restLeft, pos.swing, pos.sinceImpact)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [playing, sprite, engineRef])

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">Top</span>
      <div className="relative w-64 h-64">
        <svg viewBox="0 0 200 200" className="w-64 h-64" role="img" aria-label="Swing tempo dial">
          <circle cx="100" cy="100" r="88" fill="none" strokeWidth="8" className="stroke-muted" />
          {/* rotate(90) puts the start of the stroke at 6 o'clock, running clockwise */}
          <circle
            ref={ringRef}
            data-phase="idle"
            cx="100"
            cy="100"
            r="88"
            fill="none"
            strokeWidth="8"
            strokeLinecap="round"
            pathLength={1}
            strokeDasharray="1"
            transform="rotate(90 100 100)"
            className="stroke-primary data-[phase=rest]:stroke-muted-foreground data-[phase=impact]:[filter:drop-shadow(0_0_6px_hsl(var(--primary)))]"
            style={{ strokeDashoffset: 1, opacity: 0 }}
          />
          {/* Top and Start · Impact ticks */}
          <line x1="100" y1="4" x2="100" y2="20" strokeWidth="2" className="stroke-muted-foreground" />
          <line x1="100" y1="180" x2="100" y2="196" strokeWidth="2" className="stroke-muted-foreground" />
        </svg>
        {/* Golfer (video frames, ball included), drawn over the dial in the same 200×200 space */}
        <canvas ref={canvasRef} aria-hidden className="absolute inset-0 w-full h-full text-foreground" />
      </div>
      <span className="text-xs text-muted-foreground">Start · Impact</span>
      {showCountdown && (
        <p ref={labelRef} className="h-4 text-xs text-muted-foreground font-mono tabular-nums" />
      )}
    </div>
  )
}
