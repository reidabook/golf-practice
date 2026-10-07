# Tempo Tab (`/tempo`)

> **For Claude:** Read this file before making any changes to the Tempo Trainer. Every feature listed here must still work after your edits.

Audio + visual tempo cues for putting, chipping, and full swing. Client-only — no Google Sheets reads or writes.

---

## Tempos

Presets are frame counts of 30fps video (Tour Tempo convention): `back/down` = frames from takeaway to top / top to impact. 1 frame = 33.3 ms.

| Mode | Ratio | Presets | Default |
|---|---|---|---|
| Putting | 2:1 | 14/7, 16/8, 18/9, 20/10, 22/11, 24/12 | 18/9 |
| Chipping | 2:1 | 14/7, 16/8, 18/9, 20/10, 22/11, 24/12 | 18/9 |
| Full swing | 3:1 | 18/6, 21/7, 24/8, 27/9, 30/10 | 24/8 |

Putting also has a **Metronome** cue: 60–90 BPM (default 76). Takeaway on the low tick, impact on the high tick, one beat of rest, repeat.

Defined in `lib/tempo.ts` (pure, unit-tested in `lib/__tests__/tempo.test.ts`).

---

## Layout

- **Shot type** segmented control: Putting / Chipping / Full swing
- **Putting cue** segmented control (putting only): 3-tone / Metronome
- **Visual card**
  - Current preset (or BPM) in large mono type, with ms back / ms down and ratio
  - **Swing dial** (`components/tempo/swing-dial.tsx`): a ring with a face-on golfer silhouette in the middle
    - Ring is laid out like the swing — Start · Impact at 6 o'clock, Top at 12, with a tick at each
    - Backswing fills the left half (6 → 12, arriving on the top tone); downswing fills the right half (12 → 6, closing the circle on the impact tone). The right half fills 2× / 3× faster, showing the ratio
    - Impact: full ring glows briefly
    - Rest: the full ring turns muted and unwinds to empty as the next rep approaches; same during the lead-in after Start. 3-tone shows a "Next rep in N.Ns" countdown underneath; metronome unwinds over its one-beat rest with no countdown
    - Empty when stopped and after the rep when Repeat is off
    - Golfer: silhouettes traced from pose sheets in `scripts/assets/` by `scripts/trace-golfer.py` into `components/tempo/golfer-frames.ts`, shown one at a time as a flipbook. Each shot type has its own poses; `SWING_ANIMATION` + `swingFrame()` in `lib/tempo.ts` pick the pose. In every mode the top pose lands on the top tone and the impact pose on the impact tone, the ball is hidden from just after impact until the golfer resets, and the golfer is back in Setup for the remainder of the rest
      - **Full swing** — 14 poses (`golfer-reference.png` + four in-betweens from the AI-generated `golfer-inbetweens.png`)
        - Backswing: Setup → Takeaway → Hip-high → Halfway → Chest-high → Three-quarter → Head-high → **Top**
        - Downswing: back down through the same poses to Hip-high, then Downswing → Approach → **Impact**
        - After impact: Release (to 0.14 s), Follow-through (to 0.3 s), Finish (to 1.1 s), then Setup
      - **Chipping** — all 11 poses from `golfer-chipping.png`
        - Backswing: Setup → Early takeaway → Mid takeaway → Waist-high → **Top**
        - Downswing: Waist-high → Mid takeaway → Downswing → Approach → **Impact**
        - After impact: Early follow-through (to 0.14 s), Follow-through (to 0.35 s), Finish (to 1.1 s), then Setup
      - **Putting** — the first 10 poses from `golfer-putting.png` (poses 11–16 are post-stroke stills and are not used)
        - Backstroke: Setup → Pre-stroke → Takeaway → Mid takeaway → **Transition**
        - Forward stroke: Early forward stroke → **Impact**
        - After impact: Early follow-through (to 0.15 s), Mid follow-through (to 0.3 s), Finish (to 0.6 s), then Setup — short enough to finish inside the fastest metronome beat. Works the same in Metronome mode
        - The sheet's first eight poses differ only slightly, so the backstroke is subtle; the follow-through is the visible part
      - All three shot types share one scale and stand on the same spot in the ring, so the golfer does not jump when switching shot type
      - With Repeat off the rep ends ~0.25 s after impact, cutting the follow-through short
  - Start / Stop button
- **Tempo card**
  - 3-tone: preset chips in a 3-column grid (frame label only) — 5 for full swing, 6 for putting/chipping and per-mode help text
  - Metronome: − / slider / + BPM control
- **Settings card**
  - Repeat toggle (3-tone only) — off plays a single rep then stops
  - Rest between reps: 2 / 3 / 5 s (3-tone only) — also the lead-in before the first rep
  - Volume slider

---

## Behaviour

- **Tones**: three sine beeps — start 660 Hz, top 880 Hz, impact 1320 Hz. Metronome plays start and impact only.
- **Timing**: beeps are scheduled on the Web Audio clock with a short lookahead (`lib/tempo-audio.ts → TempoEngine`), so spacing does not drift with JS timers. The swing dial reads the same clock.
- **Start** must come from a tap — the `AudioContext` is created/resumed inside the handler (iOS requirement). `navigator.audioSession.type = 'playback'` is set when available so the iOS silent switch does not mute tones.
- **Changing tempo while playing** restarts with the new timing. Volume changes apply live.
- **Stops automatically** when the app is backgrounded, on leaving the page, and after a single rep when Repeat is off.
- **Screen Wake Lock** is held while playing (where supported).
- **Settings persist** in `localStorage` key `tempo-settings`: mode, preset per mode, putting cue, BPM, rest gap, repeat, volume. Invalid stored values fall back to defaults.

---

## Not included

- No swing measurement (mic or sensor)
- No session logging
