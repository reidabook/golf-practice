#!/usr/bin/env python3
"""Trace the golfer pose sheets into SVG paths for the Tempo swing dial.

Reads   scripts/assets/golfer-reference.png    full swing, 10 key poses
        scripts/assets/golfer-inbetweens.png   AI-generated variant of the full-swing sheet; some of its
                                               poses fall between the key poses and are used as in-betweens
        scripts/assets/golfer-chipping.png     chipping, 11 poses
        scripts/assets/golfer-putting.png      putting, 16 poses (the first 10 are the stroke)
Writes  components/tempo/golfer-frames.ts

Usage: python3 scripts/trace-golfer.py [preview.html]
Needs opencv-python and numpy. Re-run after replacing a sheet or editing MODES.
"""
import sys
from pathlib import Path

import cv2
import numpy as np

ROOT = Path(__file__).resolve().parent.parent
ASSETS = ROOT / 'scripts/assets'
OUT = ROOT / 'components/tempo/golfer-frames.ts'

DARK = 110  # grey level below which a pixel is artwork
SPECK = 40  # loose blobs smaller than this (px²) are dropped: ball outlines, ground-line fragments
BOX = 200  # dial viewBox size
RADIUS = 81  # poses must stay within this distance of the dial centre
ALIGN_SEARCH = 14  # px either way when sliding a pose over the setup pose (align='overlap')
EPSILON = 1.0  # contour simplification, source pixels

# Each sheet: file, row bands holding the figures (badges and captions sit below each band),
# empty columns that separate two poses, and how many poses to expect.
SHEETS = {
    'ref': dict(file='golfer-reference.png', rows=[(20, 393), (530, 850)], gap=12, poses=10),
    # poses 9 and 10 of this sheet nearly touch
    'mid': dict(file='golfer-inbetweens.png', rows=[(24, 322), (438, 692)], gap=1, poses=10),
    'chip': dict(file='golfer-chipping.png', rows=[(40, 423), (556, 883)], gap=4, poses=11),
    # thicken: fatten hairlines by this many pixels before tracing — the putter shaft is 1 px wide
    # soft: grey level under which hairlines also count as artwork — parts of the shaft are drawn in light grey
    'putt': dict(file='golfer-putting.png', rows=[(138, 394), (571, 815)], gap=4, poses=16, thicken=1, soft=200),
}

# Per shot type: the poses in frame order as (name, sheet, pose number on that sheet), and where the ball is.
# Balls drawn dark are found automatically (ball=None); light ones are given as (sheet, pose number, x, y,
# radius) in that sheet's pixels. align='overlap' resizes each pose to the setup pose's height and slides it
# onto the setup pose instead of trusting the lead shoe — for shots where the body barely moves, so any
# drift in the artwork shows as jitter.
# All shot types share one scale and stand on the same spot in the dial.
# Frame indexes here are what SWING_ANIMATION in lib/tempo.ts refers to.
MODES = {
    'full': dict(
        ball=None,
        frames=[
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
        ],
    ),
    'chipping': dict(
        ball=('chip', 2, 399, 414, 5.5),
        frames=[
            ('setup', 'chip', 1),
            ('earlyTakeaway', 'chip', 2),
            ('midTakeaway', 'chip', 3),
            ('waistHigh', 'chip', 4),
            ('top', 'chip', 5),
            ('downswing', 'chip', 6),
            ('approach', 'chip', 7),
            ('impact', 'chip', 8),
            ('earlyFollowThrough', 'chip', 9),
            ('followThrough', 'chip', 10),
            ('finish', 'chip', 11),
        ],
    ),
    # Sheet poses 11–16 are post-stroke stills (ball rolling, alignment check, …)
    'putting': dict(
        ball=('putt', 9, 111, 807, 4.5),
        align='overlap',
        frames=[
            ('setup', 'putt', 1),
            ('preStroke', 'putt', 2),
            ('takeaway', 'putt', 3),
            ('midTakeaway', 'putt', 4),
            ('transition', 'putt', 5),
            ('forwardStroke', 'putt', 6),
            ('impact', 'putt', 7),
            ('earlyFollowThrough', 'putt', 8),
            ('midFollowThrough', 'putt', 9),
            ('finish', 'putt', 10),
        ],
    ),
}
# Manual per-frame nudge in reference-sheet pixels (dx, dy), keyed by (mode, frame index), applied after foot alignment
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


def clean(cell):
    """Remove specks and a loose dark ball dot. Returns (cell, ball centre or None)."""
    n, labels, stats, cents = cv2.connectedComponentsWithStats(cell, 8)
    bottom = np.where(cell.any(axis=1))[0].max()
    ball = None
    for i in range(1, n):
        x, y, w, h, area = stats[i]
        round_ = 0.7 < w / h < 1.4 and area > 0.6 * w * h
        is_ball = SPECK <= area < 300 and round_ and y + h > bottom - 25
        if area < SPECK or is_ball:
            cell = np.where(labels == i, 0, cell).astype(np.uint8)
        if is_ball:
            ball = cents[i]
    return cell, ball


def trace_sheet(file, rows, gap, poses, thicken=0, soft=None):
    """One dict per pose: contours and ball relative to the lead-foot anchor, plus what alignment needs."""
    grey = cv2.cvtColor(cv2.imread(str(ASSETS / file)), cv2.COLOR_BGR2GRAY)
    mask = (grey < DARK).astype(np.uint8)
    if thicken:
        # Only what a 3×3 opening would wipe out, so the body's white detail lines stay open
        kernel = np.ones((3, 3), np.uint8)
        thin = mask - cv2.morphologyEx(mask, cv2.MORPH_OPEN, kernel)
        mask = mask | cv2.dilate(thin, np.ones((2 * thicken + 1, 2 * thicken + 1), np.uint8))
    out = []
    for top, bot in rows:
        band = mask[top:bot]
        if soft:
            pale = (grey[top:bot] < soft).astype(np.uint8)
            hair = pale - cv2.morphologyEx(pale, cv2.MORPH_OPEN, np.ones((5, 5), np.uint8))
            hair[-14:] = 0  # leave out the pale ground line and ball outline
            band = band | hair
        for left, right in split_columns(band, gap):
            cell = band[:, left:right].copy()
            if cell.sum() < 3000:
                continue  # stray mark, not a golfer
            cell, ball = clean(cell)
            ys = np.where(cell.any(axis=1))[0]
            ground = ys.max()
            feet = np.where(cell[ground - 12:ground + 1].any(axis=0))[0]
            # Lead (right-hand) shoe stays planted through the whole swing
            anchor = np.array([feet.max(), ground], dtype=np.float64)
            contours, _ = cv2.findContours(cell, cv2.RETR_CCOMP, cv2.CHAIN_APPROX_NONE)
            polys = []
            for c in contours:
                if cv2.contourArea(c) < 6:
                    continue
                p = cv2.approxPolyDP(c, EPSILON, True).reshape(-1, 2)
                if len(p) >= 3:
                    polys.append(p - anchor)
            out.append(dict(
                polys=polys,
                ball=None if ball is None else ball - anchor,
                origin=anchor + (left, top),  # anchor in whole-sheet pixels
                height=ground - ys.min(),
                stance=(feet.min() + feet.max()) / 2 - anchor[0],  # middle of the feet, relative to the anchor
                mask=cell,
                anchor=anchor.astype(int),
            ))
    if len(out) != poses:
        sys.exit(f'{file}: expected {poses} poses, found {len(out)}')
    return out


def overlap_shift(pose, setup):
    """Shift (dx, dy) that best lays `pose` over `setup` when both are pinned at their anchors."""
    size, pin, pad = 700, np.array([500, 600]), ALIGN_SEARCH

    def canvas(p, margin):
        img = np.zeros((size + 2 * margin, size + 2 * margin), np.float32)
        h, w = p['mask'].shape
        x, y = pin - p['anchor'] + margin
        img[y:y + h, x:x + w] = p['mask']
        return img

    score = cv2.matchTemplate(canvas(setup, pad), canvas(pose, 0), cv2.TM_CCORR)
    _, _, _, (x, y) = cv2.minMaxLoc(score)
    return np.array([x - pad, y - pad], dtype=np.float64)


def num(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def build_mode(mode, spec, sheets, factor):
    """Returns (frames, ball centre, ball radius) for one shot type, in reference-sheet pixels
    relative to the middle of the setup pose's feet."""
    setup = sheets[spec['frames'][0][1]][spec['frames'][0][2] - 1]
    stand = np.array([setup['stance'], 0.0])

    frames = []
    for i, (_, sheet, number) in enumerate(spec['frames']):
        pose = sheets[sheet][number - 1]
        shift = np.array(NUDGE.get((mode, i), (0, 0)), dtype=np.float64) / factor[sheet]
        k = 1.0
        if spec.get('align') == 'overlap':
            k = setup['height'] / pose['height']
            resized = dict(
                mask=cv2.resize(pose['mask'], None, fx=k, fy=k, interpolation=cv2.INTER_NEAREST),
                anchor=np.round(pose['anchor'] * k).astype(int),
            )
            shift += overlap_shift(resized, setup)
        frames.append([(p * k + shift - stand) * factor[sheet] for p in pose['polys']])

    if spec['ball']:
        sheet, number, x, y, r = spec['ball']
        ball = (np.array([x, y]) - sheets[sheet][number - 1]['origin'] - stand) * factor[sheet]
        ball_r = r * factor[sheet]
    else:
        ball = np.mean([(sheets[s][n - 1]['ball'] - stand) * factor[s] for _, s, n in spec['frames']
                        if sheets[s][n - 1]['ball'] is not None], axis=0)
        ball_r = 6
    return frames, ball, ball_r


def main():
    sheets = {name: trace_sheet(**spec) for name, spec in SHEETS.items()}
    # Sheets differ in resolution: match each to the reference sheet on the height of its setup pose
    factor = {name: sheets['ref'][0]['height'] / sheet[0]['height'] for name, sheet in sheets.items()}
    modes = {mode: build_mode(mode, spec, sheets, factor) for mode, spec in MODES.items()}

    # One scale and offset for every shot type, so the golfer is the same size and stands in the same place
    pts = np.vstack([p for frames, _, _ in modes.values() for polys in frames for p in polys]).astype(np.float32)
    (cx, cy), r = cv2.minEnclosingCircle(pts)
    scale = RADIUS / r

    def place(p):
        return (np.asarray(p) - (cx, cy)) * scale + BOX / 2

    built = {}
    for mode, (frames, ball, ball_r) in modes.items():
        paths = [
            ''.join('M' + 'L'.join(f'{num(x)} {num(y)}' for x, y in place(p)) + 'Z' for p in polys)
            for polys in frames
        ]
        bx, by = place(ball)
        built[mode] = (paths, dict(cx=num(bx), cy=num(by), r=num(ball_r * scale)))
        print(f'  {mode}: {len(paths)} poses, {sum(map(len, paths)) // 1024} KB')
    print(f'  scale {scale:.3f}')

    lines = [
        '// GENERATED by scripts/trace-golfer.py from the pose sheets in scripts/assets — do not edit by hand.',
        '// Golfer silhouettes for the swing dial, in its 200×200 viewBox. Fill with fill-rule="evenodd".',
        '// Frame order per shot type is set by MODES in the script; SWING_ANIMATION in lib/tempo.ts indexes into it.',
        '',
        "import type { TempoMode } from '@/lib/tempo'",
        '',
        'export const GOLFER_POSES = {',
        *[f"  {mode}: [{', '.join(repr(n) for n, _, _ in spec['frames'])}]," for mode, spec in MODES.items()],
        '} as const',
        '',
        'export const GOLFER_BALL: Record<TempoMode, { cx: number; cy: number; r: number }> = {',
        *[f"  {mode}: {{ cx: {b['cx']}, cy: {b['cy']}, r: {b['r']} }}," for mode, (_, b) in built.items()],
        '}',
        '',
        'export const GOLFER_FRAMES: Record<TempoMode, string[]> = {',
    ]
    for mode, (paths, _) in built.items():
        lines += [f'  {mode}: [', *[f"    '{d}'," for d in paths], '  ],']
    lines += ['}', '']
    OUT.write_text('\n'.join(lines))
    print(f'wrote {OUT.relative_to(ROOT)}')

    if len(sys.argv) > 1:
        ring = '<circle cx="100" cy="100" r="88" fill="none" stroke="#333" stroke-width="8"/>'
        html = ''
        for mode, (paths, b) in built.items():
            ball = f'<circle cx="{b["cx"]}" cy="{b["cy"]}" r="{b["r"]}" fill="#fff"/>'
            cells = [f'{ring}{ball}<path d="{d}" fill="#fff" fill-rule="evenodd"/>' for d in paths]
            cells.append(ring + ''.join(f'<path d="{d}" fill="#fff" fill-opacity=".18" fill-rule="evenodd"/>' for d in paths))
            html += '<div style="display:flex;flex-wrap:wrap">' + ''.join(
                f'<svg viewBox="0 0 200 200" width="200" height="200">{c}</svg>' for c in cells) + '</div>'
        Path(sys.argv[1]).write_text(f'<body style="background:#141414;margin:0;width:1600px">{html}</body>')


if __name__ == '__main__':
    main()
