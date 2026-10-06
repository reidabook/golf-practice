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
  - Track with a dot: moves right during the backswing, returns on the downswing, flashes green and grows at impact. Left marker = Start · Impact, right marker = Top
  - Rest bar (3-tone only): fills at impact and drains to empty as the next rep approaches, with a "Next rep in N.Ns" countdown. Also runs during the lead-in before the first rep. Empty while swinging, when stopped, and after the rep when Repeat is off
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
- **Timing**: beeps are scheduled on the Web Audio clock with a short lookahead (`lib/tempo-audio.ts → TempoEngine`), so spacing does not drift with JS timers. The dot and rest bar read the same clock.
- **Start** must come from a tap — the `AudioContext` is created/resumed inside the handler (iOS requirement). `navigator.audioSession.type = 'playback'` is set when available so the iOS silent switch does not mute tones.
- **Changing tempo while playing** restarts with the new timing. Volume changes apply live.
- **Stops automatically** when the app is backgrounded, on leaving the page, and after a single rep when Repeat is off.
- **Screen Wake Lock** is held while playing (where supported).
- **Settings persist** in `localStorage` key `tempo-settings`: mode, preset per mode, putting cue, BPM, rest gap, repeat, volume. Invalid stored values fall back to defaults.

---

## Not included

- No swing measurement (mic or sensor)
- No session logging
