'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { TempoEngine } from '@/lib/tempo-audio'
import { SWING_ANIMATION, ballGone, spriteFrame, swingFrame, type TempoMode, type TracedMode } from '@/lib/tempo'
import { GOLFER_BALL, GOLFER_FRAMES } from '@/components/tempo/golfer-frames'
import { SWING_SPRITES, type SwingSprite } from '@/components/tempo/swing-sprites'

type Phase = 'idle' | 'swing' | 'impact' | 'rest'

// Chipping plays video frames from a sprite sheet; the other shot types flip through traced SVG poses
function spriteFor(mode: TempoMode): SwingSprite | null {
  return mode === 'chipping' ? SWING_SPRITES.chipping : null
}

/**
 * Circular swing visual. The ring is laid out like the swing: start and impact at
 * 6 o'clock, top at 12. It fills up the left side on the backswing, down the right
 * side on the downswing, then unwinds to empty over the rest.
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
  const golferRef = useRef<SVGGElement>(null)
  const ballRef = useRef<SVGCircleElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const sheetRef = useRef<HTMLImageElement | null>(null)
  const spriteAtRef = useRef(0) // sprite frame the clock wants
  const paintedRef = useRef(-1) // sprite frame currently on the canvas
  const sprite = spriteFor(mode)

  // Draw one sprite frame, tinted with the theme's foreground colour
  const paintSprite = (frame: number) => {
    spriteAtRef.current = frame
    const canvas = canvasRef.current
    const sheet = sheetRef.current
    if (!sprite || !canvas || !sheet?.complete || paintedRef.current === frame) return
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

  // Size the canvas for the screen and load the sprite sheet when a sprite shot type is picked
  useEffect(() => {
    paintedRef.current = -1
    if (!sprite) return
    const canvas = canvasRef.current
    if (canvas) {
      const px = Math.round(canvas.clientWidth * (window.devicePixelRatio || 1))
      canvas.width = canvas.height = px
    }
    const sheet = new Image()
    sheet.onload = () => {
      paintedRef.current = -1
      paintSprite(spriteAtRef.current)
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
    const anim = sprite ? null : SWING_ANIMATION[mode as TracedMode]
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
      if (sprite) {
        paintSprite(spriteFrame(sprite.segments, swing, sinceImpact))
      } else if (anim) {
        const frame = swingFrame(anim, swing, sinceImpact)
        const poses = golferRef.current?.children
        if (poses) {
          for (let i = 0; i < poses.length; i++) {
            ;(poses[i] as SVGPathElement).style.display = i === frame ? '' : 'none'
          }
        }
        if (ballRef.current) ballRef.current.style.display = ballGone(anim, sinceImpact) ? 'none' : ''
      }
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
  }, [playing, mode, engineRef])

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

          {/* Golfer silhouette, face-on: one traced path per pose, only the current one shown */}
          {!sprite && (
            <>
              <g key={mode} ref={golferRef} fillRule="evenodd" className="fill-foreground">
                {GOLFER_FRAMES[mode as TracedMode].map((d, i) => (
                  <path key={i} d={d} style={i === 0 ? undefined : { display: 'none' }} />
                ))}
              </g>
              <circle
                ref={ballRef}
                cx={GOLFER_BALL[mode as TracedMode].cx}
                cy={GOLFER_BALL[mode as TracedMode].cy}
                r={GOLFER_BALL[mode as TracedMode].r}
                className="fill-foreground"
              />
            </>
          )}
        </svg>
        {/* Sprite golfer (video frames, ball included), drawn over the dial in the same 200×200 space */}
        {sprite && <canvas key={mode} ref={canvasRef} aria-hidden className="absolute inset-0 w-full h-full text-foreground" />}
      </div>
      <span className="text-xs text-muted-foreground">Start · Impact</span>
      {showCountdown && (
        <p ref={labelRef} className="h-4 text-xs text-muted-foreground font-mono tabular-nums" />
      )}
    </div>
  )
}
