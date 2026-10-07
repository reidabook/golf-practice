'use client'

import { useEffect, useRef, type RefObject } from 'react'
import type { TempoEngine } from '@/lib/tempo-audio'
import { SWING_ANIMATION, ballGone, putterAngle, swingFrame, type TempoMode } from '@/lib/tempo'
import { GOLFER_BALL, GOLFER_FRAMES, GOLFER_PUTTER } from '@/components/tempo/golfer-frames'

type Phase = 'idle' | 'swing' | 'impact' | 'rest'

function putterTransform(angle: number): string {
  return `rotate(${angle} ${GOLFER_PUTTER.x1} ${GOLFER_PUTTER.y1})`
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
  const putterRef = useRef<SVGGElement>(null)
  const ballRef = useRef<SVGCircleElement>(null)
  const labelRef = useRef<HTMLParagraphElement>(null)

  // Drive the ring, golfer and countdown from the audio clock
  useEffect(() => {
    const anim = SWING_ANIMATION[mode]
    const draw = (
      phase: Phase,
      progress: number,
      restLeft: number,
      swing = 0,
      position = 0,
      sinceImpact: number | null = null
    ) => {
      const ring = ringRef.current
      if (ring) {
        ring.dataset.phase = phase
        ring.style.strokeDashoffset = String(1 - progress)
        ring.style.opacity = progress > 0 ? '1' : '0'
      }
      const frame = swingFrame(anim, swing, sinceImpact)
      const poses = golferRef.current?.children
      if (poses) {
        for (let i = 0; i < poses.length; i++) {
          ;(poses[i] as SVGPathElement).style.display = i === frame ? '' : 'none'
        }
      }
      putterRef.current?.setAttribute('transform', putterTransform(putterAngle(position, sinceImpact)))
      if (ballRef.current) ballRef.current.style.display = ballGone(anim, sinceImpact) ? 'none' : ''
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
        draw(phase, progress, phase === 'swing' ? 0 : pos.restLeft, pos.swing, pos.position, pos.sinceImpact)
      }
      raf = requestAnimationFrame(frame)
    }
    raf = requestAnimationFrame(frame)
    return () => cancelAnimationFrame(raf)
  }, [playing, mode, engineRef])

  const ball = GOLFER_BALL[mode]

  return (
    <div className="flex flex-col items-center gap-1">
      <span className="text-xs text-muted-foreground">Top</span>
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

        {/* Putting: the putter is drawn here and swings as a pendulum behind a single traced pose */}
        {mode === 'putting' && (
          <g ref={putterRef} transform={putterTransform(0)} strokeLinecap="round" className="stroke-foreground">
            <line x1={GOLFER_PUTTER.x1} y1={GOLFER_PUTTER.y1} x2={GOLFER_PUTTER.x2} y2={GOLFER_PUTTER.y2} strokeWidth="1.4" />
            <line x1={GOLFER_PUTTER.x2 - 3} y1={GOLFER_PUTTER.y2} x2={GOLFER_PUTTER.x2 + 1} y2={GOLFER_PUTTER.y2} strokeWidth="2.6" />
          </g>
        )}
        {/* Golfer silhouette, face-on: one traced path per pose, only the current one shown */}
        <g key={mode} ref={golferRef} fillRule="evenodd" className="fill-foreground">
          {GOLFER_FRAMES[mode].map((d, i) => (
            <path key={i} d={d} style={i === 0 ? undefined : { display: 'none' }} />
          ))}
        </g>
        <circle ref={ballRef} cx={ball.cx} cy={ball.cy} r={ball.r} className="fill-foreground" />
      </svg>
      <span className="text-xs text-muted-foreground">Start · Impact</span>
      {showCountdown && (
        <p ref={labelRef} className="h-4 text-xs text-muted-foreground font-mono tabular-nums" />
      )}
    </div>
  )
}
