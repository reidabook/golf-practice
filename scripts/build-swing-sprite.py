#!/usr/bin/env python3
"""Build the golfer sprite sheets for the Tempo swing dial from AI-generated video clips.

Reads   scripts/assets/<shot>/clip-*.mp4    video clips generated (Gemini Omni Flash, first-and-last-frame
                                            transitions) between the key stills key-*.png in the same folder
Writes  public/tempo/<shot>.webp            frames in a grid, white on transparent
        components/tempo/swing-sprites.ts   per shot type: grid size, frame counts, timing, where frames sit in the dial

Usage: python3 scripts/build-swing-sprite.py
Needs ffmpeg on PATH, opencv-python and numpy. Re-run after replacing a clip or editing SHOTS.

Each clip is trimmed to the stretch that moves steadily from one key pose to the next (the clips contain
waggles, rehearsal swings and overshoots), then sampled at equal steps of measured motion, so playing the
frames evenly in time gives a steady club speed. Slow moves are first motion-interpolated for more in-between
frames; fast ones are not, because interpolation draws a ghost second club when the club moves a lot per frame.
"""
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'scripts/assets'
PUBLIC = ROOT / 'public/tempo'
OUT = ROOT / 'components/tempo/swing-sprites.ts'

# Per shot type: for each phase, the clip, first and last usable frame at the clip's own 24 fps, frames to keep,
# interpolation factor, and optionally frames to skip and whether to play the stretch backwards; then how long
# the follow-through plays and when the golfer resets to setup (seconds after the impact tone). Frame counts
# cover a 60 Hz screen at the slowest tempo for the shot.
SHOTS = {
    'full': dict(
        phases={
            # back: standing still before 12; reaches Top at 50, then carries on into a whole extra swing.
            # down and through are one continuous stretch of clip-down: holding at Top before 14, impact at 42,
            # then it carries on into a follow-through that reaches the finish at 72 (no separate clip needed)
            'back': ('clip-back.mp4', 12, 50, 48, 4),
            'down': ('clip-down.mp4', 14, 42, 24, 1),
            'through': ('clip-down.mp4', 42, 72, 30, 1),
        },
        through_seconds=0.5,
        reset_at=1.1,
    ),
    'chipping': dict(
        phases={
            # back: standing still before 12, overshoot past Top after 72. down: overshoot past Top before 22,
            # a second backswing after 39. through: a rehearsal swing before 30
            'back': ('clip-back.mp4', 12, 72, 48, 4),
            'down': ('clip-down.mp4', 22, 39, 24, 1),
            'through': ('clip-through.mp4', 30, 80, 30, 1),
        },
        through_seconds=0.5,
        reset_at=1.1,
    ),
    'putting': dict(
        phases={
            # A putt is a pendulum, so the forward stroke is the backstroke played backwards: the generated
            # forward-stroke clips overshot and drew the putter fading out near impact. back: after a practice
            # stroke, the putter leaves the ball at 50 and reaches Top at 93; 54–56 are skipped because the putter
            # fades out in them. through: after a rehearsal stroke, impact (28) to the finish (56). No
            # interpolation: the thin putter confuses it into frames that jump back and forth
            'back': ('clip-back.mp4', 50, 93, 36, 1, dict(skip=(54, 55, 56))),
            'down': ('clip-back.mp4', 50, 93, 18, 1, dict(skip=(54, 55, 56), reverse=True)),
            'through': ('clip-through.mp4', 28, 56, 24, 1),
        },
        # The putter shaft is drawn in pale grey and fades in some frames: keep thin lines this dark as solid
        hairline=215,
        # Back at setup inside the fastest metronome beat (90 BPM = 0.67 s)
        through_seconds=0.35,
        reset_at=0.6,
    ),
}

DARK = 110  # grey level below which a pixel is artwork
PX_PER_UNIT = 2.0  # sprite pixels per dial viewBox unit (the dial is 200 units across, 256 CSS px)
COLS = 12  # frames per row in a sheet
# Where the setup golfer stands in the dial (viewBox units): middle of the feet and ground line, and the
# largest head-to-feet height allowed. Every shot type uses the same spot and one shared height — the largest
# at which every frame of every shot stays inside the ring — so the golfer never changes size or position
# when switching shot type.
FEET_X = 92.05
GROUND_Y = 162.6
MAX_SETUP_HEIGHT = 118.7
MAX_RADIUS = 84  # artwork must stay within this distance of the dial centre (the ring's inner edge)


def frames_of(path, interp, workdir, cache={}):
    """All frames of a clip, motion-interpolated to `interp` times its frame rate, as BGR arrays."""
    key = (path, interp)
    if key not in cache:
        out = Path(workdir) / f'{path.parent.name}-{path.stem}-{interp}'
        out.mkdir()
        vf = ['-vf', f'minterpolate=fps={24 * interp}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'] if interp > 1 else []
        subprocess.run(
            ['ffmpeg', '-loglevel', 'error', '-i', str(path), '-an', *vf, '-vsync', '0', str(out / '%04d.png')],
            check=True,
        )
        cache[key] = [cv2.imread(str(p)) for p in sorted(out.glob('*.png'))]
    return cache[key]


def motion_curve(frames):
    """Cumulative motion (0 → 1) through the frames, from optical flow over the golfer's pixels."""
    greys = [cv2.resize(cv2.cvtColor(f, cv2.COLOR_BGR2GRAY), (640, 360)) for f in frames]
    steps = [0.0]
    for a, b in zip(greys, greys[1:]):
        flow = cv2.calcOpticalFlowFarneback(a, b, None, 0.5, 3, 21, 3, 5, 1.2, 0)
        golfer = (a < 140) | (b < 140)
        steps.append(float(np.hypot(flow[..., 0], flow[..., 1])[golfer].sum()))
    cum = np.cumsum(steps)
    return cum / cum[-1]


def sample(frames, count):
    """`count` frames at equal steps of motion, first and last included. A frame can repeat where the clip
    moves too fast for its frame rate, which keeps the club's speed steady instead of easing in and out."""
    cum = motion_curve(frames)
    picks = [int(np.argmin(np.abs(cum - t))) for t in np.linspace(0, 1, count)]
    return [frames[i] for i in picks]


def setup_metrics(frame):
    """Height and foot position of the golfer in a video frame, in pixels."""
    dark = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) < DARK
    ys, xs = np.where(dark)
    top, ground = ys.min(), ys.max()
    feet = xs[ys > ground - 8]
    return ground - top, (feet.min() + feet.max()) / 2, ground


def num(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def prepare(shot, spec, workdir):
    """Frames for a shot type, plus where the golfer is in them."""
    frames, counts = [], {}
    for phase, (clip, first, last, count, interp, *opts) in spec['phases'].items():
        opts = opts[0] if opts else {}
        all_frames = frames_of(ASSETS / shot / clip, interp, workdir)
        skip = {i * interp + k for i in opts.get('skip', ()) for k in range(interp)}
        usable = [all_frames[i] for i in range(first * interp, last * interp + 1) if i not in skip]
        if opts.get('reverse'):
            usable = usable[::-1]
        frames += sample(usable, count)
        counts[phase] = count
        print(f'  {shot} {phase}: {count} frames from {len(usable)}')

    # One crop window for every frame, around the golfer and club (the largest dark shape in each frame).
    # The ball flying off after impact is left out, so it leaves the picture at the window's edge.
    ink = np.zeros(frames[0].shape[:2], bool)
    for f in frames:
        dark = (cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) < DARK).astype(np.uint8)
        dark = cv2.dilate(dark, np.ones((5, 5), np.uint8))  # bridge thin gaps along the shaft
        n, labels, stats, _ = cv2.connectedComponentsWithStats(dark, 8)
        ink |= labels == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    ys, xs = np.where(ink)
    h, w = ink.shape
    if ys.min() == 0 or xs.min() == 0 or xs.max() == w - 1:
        print(f'  {shot}: WARNING the golfer touches the edge of the video frame, so the club is cut off there')
    video_h, feet_x, ground = setup_metrics(frames[0])
    return dict(
        frames=frames,
        counts=counts,
        paper=float(np.median(cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)[5:40, 5:40])),
        ink=np.stack([xs, ys], 1).astype(np.float64),
        crop=(max(0, ys.min() - 4), min(h, ys.max() + 5), max(0, xs.min() - 4), min(w, xs.max() + 5)),
        video_h=video_h,
        feet=np.array([feet_x, ground], np.float64),
    )


def placement(prep, height):
    """Maps video pixels to dial units so the setup golfer is `height` tall with feet on the shared spot."""
    unit = height / prep['video_h']
    return lambda p: (np.asarray(p, np.float64) - prep['feet']) * unit + (FEET_X, GROUND_Y), unit


def fitting_height(prep):
    """Largest setup height (up to MAX_SETUP_HEIGHT) at which every frame stays inside the ring."""
    height = MAX_SETUP_HEIGHT
    while True:
        to_dial, _ = placement(prep, height)
        d = to_dial(prep['ink'])
        if np.hypot(d[:, 0] - 100, d[:, 1] - 100).max() <= MAX_RADIUS:
            return height
        height *= 0.995


def render(shot, spec, prep, height):
    """Writes the shot's sprite sheet and returns its entry for swing-sprites.ts."""
    frames, counts, paper = prep['frames'], prep['counts'], prep['paper']
    y0, y1, x0, x1 = prep['crop']
    hairline = spec.get('hairline')
    ground_row = int(prep['feet'][1]) - y0 - 8  # crop rows from here down hold the ground line and ball
    to_dial, unit = placement(prep, height)
    rx, ry = to_dial((x0, y0))
    rw, rh = (x1 - x0) * unit, (y1 - y0) * unit

    # Frames: white, with alpha from how dark the artwork is
    fw, fh = round(rw * PX_PER_UNIT), round(rh * PX_PER_UNIT)
    rows = -(-len(frames) // COLS)
    sheet = np.zeros((rows * fh, COLS * fw, 4), np.uint8)
    for i, f in enumerate(frames):
        g = cv2.cvtColor(f[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY)
        alpha = np.clip((paper - 8 - g.astype(np.float32)) / (paper - 8 - 30), 0, 1)
        if hairline:
            # Thin pale lines (what a 5×5 opening wipes out) above the ground count as solid artwork
            pale = (g < hairline).astype(np.uint8)
            hair = (pale - cv2.morphologyEx(pale, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))).astype(bool)
            hair[ground_row:] = False
            alpha[hair] = np.maximum(alpha[hair], 0.9)
        alpha = cv2.resize(alpha, (fw, fh), interpolation=cv2.INTER_AREA)
        r, c = divmod(i, COLS)
        sheet[r * fh:(r + 1) * fh, c * fw:(c + 1) * fw] = np.dstack([np.full_like(alpha, 255)] * 3 + [alpha * 255])
    sprite = PUBLIC / f'{shot}.webp'
    sprite.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(sprite), sheet, [cv2.IMWRITE_WEBP_QUALITY, 85])
    print(f'  wrote {sprite.relative_to(ROOT)} ({sprite.stat().st_size // 1024} KB, {COLS * fw}×{rows * fh})')

    return [
        f'  {shot}: {{',
        f"    src: '/tempo/{shot}.webp',",
        f'    cols: {COLS},',
        f'    frameWidth: {fw},',
        f'    frameHeight: {fh},',
        f'    x: {num(rx)},',
        f'    y: {num(ry)},',
        f'    width: {num(rw)},',
        f'    height: {num(rh)},',
        f"    segments: {{ back: {counts['back']}, down: {counts['down']}, through: {counts['through']} }},",
        f"    throughSeconds: {spec['through_seconds']},",
        f"    resetAt: {spec['reset_at']},",
        '  },',
    ]


def main():
    with tempfile.TemporaryDirectory() as tmp:
        preps = {shot: prepare(shot, spec, tmp) for shot, spec in SHOTS.items()}
    fits = {shot: fitting_height(prep) for shot, prep in preps.items()}
    height = min(fits.values())
    print('  setup height that fits: ' + ', '.join(f'{shot} {h:.1f}' for shot, h in fits.items())
          + f' → all shots use {height:.1f} ({height / MAX_SETUP_HEIGHT:.0%} of the maximum)')
    entries = []
    for shot, spec in SHOTS.items():
        entries += render(shot, spec, preps[shot], height)
    OUT.write_text('\n'.join([
        '// GENERATED by scripts/build-swing-sprite.py — do not edit by hand.',
        '// Video-frame golfer for each shot type: a grid of frames in public/tempo/<shot>.webp.',
        '',
        "import type { SwingSprite, TempoMode } from '@/lib/tempo'",
        '',
        'export const SWING_SPRITES: Record<TempoMode, SwingSprite> = {',
        *entries,
        '}',
        '',
    ]))
    print(f'wrote {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    sys.exit(main())
