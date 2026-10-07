#!/usr/bin/env python3
"""Trace the golfer pose sheet into SVG paths for the Tempo swing dial.

Reads   scripts/assets/golfer-reference.png    (10 key poses, two rows of five, setup -> finish)
        scripts/assets/golfer-inbetweens.png   (AI-generated variant of the same sheet; some of its
                                                poses fall between the key poses and are used as in-betweens)
Writes  components/tempo/golfer-frames.ts

Usage: python3 scripts/trace-golfer.py [preview.html]
Needs opencv-python and numpy. Re-run after replacing the reference image.
"""
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
REFERENCE = ROOT / 'scripts/assets/golfer-reference.png'
INBETWEENS = ROOT / 'scripts/assets/golfer-inbetweens.png'
OUT = ROOT / 'components/tempo/golfer-frames.ts'

# Row bands of each sheet that hold the figures (number badges and captions sit below each band)
REFERENCE_ROWS = [(20, 393), (530, 850)]
INBETWEEN_ROWS = [(24, 322), (438, 692)]
# Animation order: (name, sheet, pose number on that sheet). 'ref' = reference, 'mid' = in-betweens.
FRAMES = [
    ('setup', 'ref', 1),
    ('takeaway', 'ref', 2),
    ('hipHigh', 'mid', 2),
    ('halfway', 'ref', 3),
    ('chestHigh', 'mid', 3),
    ('threeQuarter', 'ref', 4),
    ('headHigh', 'mid', 4),
    ('top', 'ref', 5),
    ('downswing', 'ref', 6),
    ('approach', 'ref', 7),
    ('impact', 'ref', 8),
    ('release', 'mid', 9),
    ('followThrough', 'ref', 9),
    ('finish', 'ref', 10),
]
DARK = 110  # grey level below which a pixel is artwork
# Empty columns that separate two poses (poses 9 and 10 of the in-between sheet nearly touch)
REFERENCE_GAP = 12
INBETWEEN_GAP = 1
BOX = 200  # dial viewBox size
RADIUS = 81  # poses must stay within this distance of the dial centre
EPSILON = 1.0  # contour simplification, source pixels
# Manual per-frame nudge in reference-sheet pixels (dx, dy), keyed by animation index, applied after foot alignment
NUDGE = {}


def split_columns(mask, gap):
    cols = np.where(mask.any(axis=0))[0]
    spans, start, prev = [], cols[0], cols[0]
    for c in cols[1:]:
        if c - prev > gap:
            spans.append((start, prev + 1))
            start = c
        prev = c
    spans.append((start, prev + 1))
    return spans


def strip_ball(cell):
    """Remove the loose ball dot. Returns (cell without ball, ball centre or None)."""
    n, labels, stats, cents = cv2.connectedComponentsWithStats(cell, 8)
    bottom = np.where(cell.any(axis=1))[0].max()
    ball = None
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        round_ = 0.7 < w / h < 1.4 and area > 0.6 * w * h
        if 30 < area < 300 and round_ and y + h > bottom - 25:
            cell = np.where(labels == i, 0, cell).astype(np.uint8)
            ball = cents[i]
    return cell, ball


def trace_sheet(path, rows, gap):
    """Returns one (contours, ball, height) per pose, coordinates relative to the lead-foot anchor."""
    grey = cv2.cvtColor(cv2.imread(str(path)), cv2.COLOR_BGR2GRAY)
    mask = (grey < DARK).astype(np.uint8)
    poses = []
    for top, bot in rows:
        band = mask[top:bot]
        for left, right in split_columns(band, gap):
            cell, ball = strip_ball(band[:, left:right].copy())
            if cell.sum() < 3000:
                continue  # stray mark, not a golfer
            ys = np.where(cell.any(axis=1))[0]
            ground = ys.max()
            # Lead (right-hand) shoe stays planted through the whole swing
            lead = np.where(cell[ground - 12:ground + 1].any(axis=0))[0].max()
            anchor = np.array([lead, ground], dtype=np.float64)
            contours, _ = cv2.findContours(cell, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
            polys = []
            for c in contours:
                if cv2.contourArea(c) < 6:
                    continue
                p = cv2.approxPolyDP(c, EPSILON, True).reshape(-1, 2)
                if len(p) >= 3:
                    polys.append(p - anchor)
            poses.append((polys, None if ball is None else ball - anchor, ground - ys.min()))
    if len(poses) != 10:
        sys.exit(f'{path.name}: expected 10 poses, found {len(poses)}')
    return poses


def main():
    ref = trace_sheet(REFERENCE, REFERENCE_ROWS, REFERENCE_GAP)
    mid = trace_sheet(INBETWEENS, INBETWEEN_ROWS, INBETWEEN_GAP)
    # The sheets differ in resolution: match them on the height of the setup pose
    mid_scale = ref[0][2] / mid[0][2]

    frames = []  # (contours, ball or None), reference-sheet pixels relative to the foot anchor
    for i, (_, sheet, number) in enumerate(FRAMES):
        polys, ball, _ = (ref if sheet == 'ref' else mid)[number - 1]
        k = 1 if sheet == 'ref' else mid_scale
        nudge = np.array(NUDGE.get(i, (0, 0)), dtype=np.float64)
        frames.append(([p * k + nudge for p in polys], None if ball is None else ball * k + nudge))

    # One shared scale and offset so every pose fits inside the ring
    pts = np.vstack([p for polys, _ in frames for p in polys]).astype(np.float32)
    (cx, cy), r = cv2.minEnclosingCircle(pts)
    scale = RADIUS / r

    def place(p):
        return (np.asarray(p) - (cx, cy)) * scale + BOX / 2

    def num(v):
        return f'{v:.1f}'.rstrip('0').rstrip('.')

    paths = []
    for polys, _ in frames:
        d = ''.join('M' + 'L'.join(f'{num(x)} {num(y)}' for x, y in place(p)) + 'Z' for p in polys)
        paths.append(d)

    balls = [place(b) for _, b in frames if b is not None]
    bx, by = np.mean(balls, axis=0)
    ball_r = 6 * scale

    lines = [
        '// GENERATED by scripts/trace-golfer.py from scripts/assets/golfer-reference.png — do not edit by hand.',
        "// Golfer silhouettes for the swing dial, in its 200×200 viewBox. Fill with fill-rule=\"evenodd\".",
        '',
        'export const GOLFER_POSES = [',
        *[f"  '{name}'," for name, _, _ in FRAMES],
        '] as const',
        '',
        f'export const GOLFER_BALL = {{ cx: {num(bx)}, cy: {num(by)}, r: {num(ball_r)} }}',
        '',
        'export const GOLFER_FRAMES: string[] = [',
        *[f"  '{d}'," for d in paths],
        ']',
        '',
    ]
    OUT.write_text('\n'.join(lines))
    print(f'wrote {OUT.relative_to(ROOT)}: {len(paths)} poses, {sum(map(len, paths)) // 1024} KB, scale {scale:.3f}, in-between sheet ×{mid_scale:.3f}')

    if len(sys.argv) > 1:
        ring = f'<circle cx="100" cy="100" r="88" fill="none" stroke="#333" stroke-width="8"/>'
        ball = f'<circle cx="{num(bx)}" cy="{num(by)}" r="{num(ball_r)}" fill="#fff"/>'
        cells = ''.join(
            f'<svg viewBox="0 0 200 200" width="250" height="250">{ring}{ball}<path d="{d}" fill="#fff" fill-rule="evenodd"/></svg>'
            for d in paths
        )
        overlay = ''.join(f'<path d="{d}" fill="#fff" fill-opacity=".18" fill-rule="evenodd"/>' for d in paths)
        cells += f'<svg viewBox="0 0 200 200" width="250" height="250">{ring}{overlay}</svg>'
        Path(sys.argv[1]).write_text(
            f'<body style="background:#141414;margin:0;display:flex;flex-wrap:wrap;width:1750px">{cells}</body>'
        )


if __name__ == '__main__':
    main()
