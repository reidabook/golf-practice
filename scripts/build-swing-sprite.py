#!/usr/bin/env python3
"""Build the chipping sprite sheet for the Tempo swing dial from AI-generated video clips.

Reads   scripts/assets/chipping/clip-back.mp4      Setup → Top      (generated between key-1-setup.png and key-4-top.png)
        scripts/assets/chipping/clip-down.mp4      Top → Impact     (key-4-top.png → key-6-impact.png)
        scripts/assets/chipping/clip-through.mp4   Impact → Finish  (key-6-impact.png → key-8-finish.png)
        components/tempo/golfer-frames.ts          to match the traced full-swing golfer's size and spot
Writes  public/tempo/chipping.webp                 frames in a grid, white on transparent
        components/tempo/swing-sprites.ts          where each frame sits in the dial

Usage: python3 scripts/build-swing-sprite.py
Needs ffmpeg on PATH, opencv-python and numpy. Re-run after replacing a clip or editing CLIPS.

Each clip is trimmed to the stretch that moves steadily from its first pose to its last (the clips contain
waggles and overshoots), then sampled at equal steps of measured motion, so playing the frames evenly in time
gives a steady club speed. The slow backswing is first motion-interpolated for more in-between frames; the
fast downswing and follow-through are not, because interpolation draws a ghost second club on fast moves.
"""
import re
import subprocess
import sys
import tempfile
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'scripts/assets/chipping'
SPRITE = ROOT / 'public/tempo/chipping.webp'
OUT = ROOT / 'components/tempo/swing-sprites.ts'
TRACED = ROOT / 'components/tempo/golfer-frames.ts'

# segment: clip, first and last usable frame at the clip's own 24 fps, frames to keep, interpolation factor.
# Frame counts cover a 60 Hz screen at the slowest tempo (24/12: 0.8 s back, 0.4 s down) and the 0.5 s
# follow-through. Ranges skip: back — standing still before frame 12, overshoot past
# Top after 72; down — overshoot past Top before 22, a second backswing after 39; through — a rehearsal swing
# before 30.
CLIPS = {
    'back': ('clip-back.mp4', 12, 72, 48, 4),
    'down': ('clip-down.mp4', 22, 39, 24, 1),
    'through': ('clip-through.mp4', 30, 80, 30, 1),
}
DARK = 110  # grey level below which a pixel is artwork
PX_PER_UNIT = 2.0  # sprite pixels per dial viewBox unit (the dial is 200 units across, 256 CSS px)
MAX_RADIUS = 84  # artwork must stay within this distance of the dial centre (the ring's inner edge)
MAX_SHIFT = 5  # dial units the golfer may move off the full-swing spot to stay inside the ring at full size


def frames_of(clip, interp, workdir):
    """All frames of a clip, motion-interpolated to `interp` times its frame rate, as BGR arrays."""
    out = Path(workdir) / clip
    out.mkdir()
    vf = ['-vf', f'minterpolate=fps={24 * interp}:mi_mode=mci:mc_mode=aobmc:me_mode=bidir:vsbmc=1'] if interp > 1 else []
    subprocess.run(
        ['ffmpeg', '-loglevel', 'error', '-i', str(ASSETS / clip), '-an', *vf, '-vsync', '0', str(out / '%04d.png')],
        check=True,
    )
    return [cv2.imread(str(p)) for p in sorted(out.glob('*.png'))]


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


def setup_metrics_traced():
    """Height and foot position of the traced full-swing setup pose, in dial units."""
    src = TRACED.read_text()
    block = src[src.index('export const GOLFER_FRAMES'):]
    block = block[block.index('  full: ['):]
    setup = re.search(r"'(M[^']*)'", block).group(1)
    pts = np.array([[float(v) for v in p.split()] for p in re.findall(r'[\d.]+ [\d.]+', setup)])
    top, ground = pts[:, 1].min(), pts[:, 1].max()
    feet = pts[pts[:, 1] > ground - 4][:, 0]
    return ground - top, (feet.min() + feet.max()) / 2, ground


def setup_metrics_video(frame):
    """Height and foot position of the golfer in a video frame, in pixels."""
    dark = cv2.cvtColor(frame, cv2.COLOR_BGR2GRAY) < DARK
    ys, xs = np.where(dark)
    top, ground = ys.min(), ys.max()
    feet = xs[ys > ground - 8]
    return ground - top, (feet.min() + feet.max()) / 2, ground


def main():
    with tempfile.TemporaryDirectory() as tmp:
        segments, frames = {}, []
        for seg, (clip, first, last, count, interp) in CLIPS.items():
            usable = frames_of(clip, interp, tmp)[first * interp:last * interp + 1]
            frames += sample(usable, count)
            segments[seg] = count
            print(f'  {seg}: {count} frames from {len(usable)}')

    # One crop window for every frame, around the golfer and club (the largest dark shape in each frame).
    # The ball flying off after impact is left out, so it leaves the picture at the window's edge.
    paper = float(np.median(cv2.cvtColor(frames[0], cv2.COLOR_BGR2GRAY)[5:40, 5:40]))
    ink = np.zeros(frames[0].shape[:2], bool)
    for f in frames:
        dark = (cv2.cvtColor(f, cv2.COLOR_BGR2GRAY) < DARK).astype(np.uint8)
        dark = cv2.dilate(dark, np.ones((5, 5), np.uint8))  # bridge thin gaps along the shaft
        n, labels, stats, _ = cv2.connectedComponentsWithStats(dark, 8)
        ink |= labels == 1 + int(np.argmax(stats[1:, cv2.CC_STAT_AREA]))
    ys, xs = np.where(ink)
    y0, y1, x0, x1 = ys.min() - 4, ys.max() + 5, xs.min() - 4, xs.max() + 5

    # Scale and place so the setup golfer matches the traced full-swing golfer
    traced_h, traced_feet_x, traced_ground = setup_metrics_traced()
    video_h, video_feet_x, video_ground = setup_metrics_video(frames[0])
    unit = traced_h / video_h  # dial units per video pixel

    shift = np.zeros(2)

    def to_dial(x, y):
        return (traced_feet_x + (x - video_feet_x) * unit + shift[0],
                traced_ground + (y - video_ground) * unit + shift[1])

    def reach():
        dx, dy = to_dial(*np.where(ink)[::-1])
        return np.hypot(dx - 100, dy - 100).max()

    # Keep the club inside the ring: first by nudging the golfer off the full-swing spot (smallest move that
    # fits), and only if no nudge within MAX_SHIFT works, by shrinking about the feet as little as possible.
    if reach() > MAX_RADIUS:
        steps = np.arange(-MAX_SHIFT, MAX_SHIFT + 0.25, 0.25)
        fits = []
        for sx in steps:
            for sy in steps:
                shift[:] = sx, sy
                if reach() <= MAX_RADIUS:
                    fits.append((np.hypot(sx, sy), sx, sy))
        if fits:
            _, sx, sy = min(fits)
            shift[:] = sx, sy
            print(f'  moved {sx:+.2f}, {sy:+.2f} units to keep the club inside the ring')
        else:
            shift[:] = 0, 0
            full = unit
            while reach() > MAX_RADIUS:
                unit *= 0.995
            print(f'  shrunk to {unit / full:.1%} to keep the club inside the ring')
    rx, ry = to_dial(x0, y0)
    rw, rh = (x1 - x0) * unit, (y1 - y0) * unit

    # Frames: white, with alpha from how dark the artwork is
    fw, fh = round(rw * PX_PER_UNIT), round(rh * PX_PER_UNIT)
    cols = 12
    rows = -(-len(frames) // cols)
    sheet = np.zeros((rows * fh, cols * fw, 4), np.uint8)
    for i, f in enumerate(frames):
        g = cv2.cvtColor(f[y0:y1, x0:x1], cv2.COLOR_BGR2GRAY).astype(np.float32)
        g = cv2.resize(g, (fw, fh), interpolation=cv2.INTER_AREA)
        alpha = np.clip((paper - 8 - g) / (paper - 8 - 30), 0, 1)
        r, c = divmod(i, cols)
        sheet[r * fh:(r + 1) * fh, c * fw:(c + 1) * fw] = np.dstack([np.full_like(g, 255)] * 3 + [alpha * 255])
    SPRITE.parent.mkdir(parents=True, exist_ok=True)
    cv2.imwrite(str(SPRITE), sheet, [cv2.IMWRITE_WEBP_QUALITY, 85])

    def num(v):
        return f'{v:.1f}'.rstrip('0').rstrip('.')

    OUT.write_text('\n'.join([
        '// GENERATED by scripts/build-swing-sprite.py — do not edit by hand.',
        '// Video-frame golfer for shot types that use a sprite sheet instead of traced poses.',
        '',
        "import type { SpriteSegments } from '@/lib/tempo'",
        '',
        'export interface SwingSprite {',
        '  src: string',
        '  /** frames per row in the sheet */',
        '  cols: number',
        '  frameWidth: number',
        '  frameHeight: number',
        '  /** where each frame is drawn, in the dial\'s 200×200 viewBox */',
        '  x: number',
        '  y: number',
        '  width: number',
        '  height: number',
        '  segments: SpriteSegments',
        '}',
        '',
        'export const SWING_SPRITES = {',
        '  chipping: {',
        "    src: '/tempo/chipping.webp',",
        f'    cols: {cols},',
        f'    frameWidth: {fw},',
        f'    frameHeight: {fh},',
        f'    x: {num(rx)},',
        f'    y: {num(ry)},',
        f'    width: {num(rw)},',
        f'    height: {num(rh)},',
        f"    segments: {{ back: {segments['back']}, down: {segments['down']}, through: {segments['through']} }},",
        '  },',
        '} satisfies Record<string, SwingSprite>',
        '',
    ]))
    print(f'wrote {SPRITE.relative_to(ROOT)} ({SPRITE.stat().st_size // 1024} KB, {cols * fw}×{rows * fh}) '
          f'and {OUT.relative_to(ROOT)}')


if __name__ == '__main__':
    sys.exit(main())
