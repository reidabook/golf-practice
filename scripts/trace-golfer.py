#!/usr/bin/env python3
"""Trace the golfer pose sheets into SVG paths for the Tempo swing dial.

Reads   scripts/assets/golfer-reference.png    full swing, 10 key poses
        scripts/assets/golfer-inbetweens.png   AI-generated variant of the full-swing sheet; some of its
                                               poses fall between the key poses and are used as in-betweens
        scripts/assets/golfer-chipping.png     chipping, 11 poses
        scripts/assets/golfer-putting.png      putting, 16 poses (only the setup pose is used, see MODES)
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
MAX_HEIGHT = 125  # cap on the setup pose's height in the dial, for shots whose club never reaches far
EPSILON = 1.0  # contour simplification, source pixels

# Each sheet: file, row bands holding the figures (badges and captions sit below each band),
# empty columns that separate two poses, and how many poses to expect.
SHEETS = {
    'ref': dict(file='golfer-reference.png', rows=[(20, 393), (530, 850)], gap=12, poses=10),
    # poses 9 and 10 of this sheet nearly touch
    'mid': dict(file='golfer-inbetweens.png', rows=[(24, 322), (438, 692)], gap=1, poses=10),
    'chip': dict(file='golfer-chipping.png', rows=[(40, 423), (556, 883)], gap=4, poses=11),
    # erase: polygons (sheet pixels) blanked out before tracing, keyed by pose number — here the setup pose's putter
    # shaft and head, which the dial draws itself so it can swing
    'putt': dict(file='golfer-putting.png', rows=[(138, 394), (571, 815)], gap=4, poses=16, erase={
        1: [[(84, 286), (96, 286), (123, 380), (111, 380)], [(104, 378), (126, 378), (126, 394), (104, 394)]],
    }),
}

# Per shot type: the poses in frame order as (name, sheet, pose number on that sheet), the sheet whose
# scale the others are matched to, and where the ball is. Balls drawn dark are found automatically
# (ball=None); light ones are given as (sheet, pose number, x, y, radius) in that sheet's pixels.
# Frame indexes here are what SWING_ANIMATION in lib/tempo.ts refers to.
MODES = {
    'full': dict(
        base='ref',
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
    # Sheet poses 5 (shoulder-high top), 10 and 11 (full follow-through and finish) are bigger than a chip
    'chipping': dict(
        base='chip',
        ball=('chip', 2, 399, 414, 5.5),
        frames=[
            ('setup', 'chip', 1),
            ('earlyTakeaway', 'chip', 2),
            ('midTakeaway', 'chip', 3),
            ('waistHigh', 'chip', 4),
            ('downswing', 'chip', 6),
            ('approach', 'chip', 7),
            ('impact', 'chip', 8),
            ('followThrough', 'chip', 9),
        ],
    ),
    # The putting sheet has no backstroke (poses 1–8 are near-identical), so putting uses the setup pose
    # alone, with its putter erased and redrawn by the dial as a pendulum. putter = (sheet, pose number,
    # hands, club head) in sheet pixels.
    'putting': dict(
        base='putt',
        ball=('putt', 9, 111, 807, 4.5),
        putter=('putt', 1, (91, 280), (115, 386)),
        frames=[('setup', 'putt', 1)],
    ),
}
# Manual per-frame nudge in base-sheet pixels (dx, dy), keyed by (mode, frame index), applied after foot alignment
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


def trace_sheet(file, rows, gap, poses, erase=None):
    """One dict per pose: contours and ball relative to the lead-foot anchor, the anchor itself, height."""
    grey = cv2.cvtColor(cv2.imread(str(ASSETS / file)), cv2.COLOR_BGR2GRAY)
    mask = (grey < DARK).astype(np.uint8)
    for polygons in (erase or {}).values():
        for polygon in polygons:
            cv2.fillPoly(mask, [np.array(polygon, dtype=np.int32)], 0)
    out = []
    for top, bot in rows:
        band = mask[top:bot]
        for left, right in split_columns(band, gap):
            cell = band[:, left:right].copy()
            if cell.sum() < 3000:
                continue  # stray mark, not a golfer
            cell, ball = clean(cell)
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
            out.append(dict(
                polys=polys,
                ball=None if ball is None else ball - anchor,
                origin=anchor + (left, top),  # anchor in whole-sheet pixels
                height=ground - ys.min(),
            ))
    if len(out) != poses:
        sys.exit(f'{file}: expected {poses} poses, found {len(out)}')
    return out


def num(v):
    return f'{v:.1f}'.rstrip('0').rstrip('.')


def build_mode(mode, spec, sheets):
    """Returns (paths, ball dict, putter dict or None) for one shot type, in dial coordinates."""
    base = sheets[spec['base']]
    # Sheets differ in resolution: match each to the base sheet on the height of its setup pose
    factor = {name: base[0]['height'] / sheet[0]['height'] for name, sheet in sheets.items()}

    frames = []
    for i, (_, sheet, number) in enumerate(spec['frames']):
        nudge = np.array(NUDGE.get((mode, i), (0, 0)), dtype=np.float64)
        frames.append([p * factor[sheet] + nudge for p in sheets[sheet][number - 1]['polys']])

    if spec['ball']:
        sheet, number, x, y, r = spec['ball']
        ball = (np.array([x, y]) - sheets[sheet][number - 1]['origin']) * factor[sheet]
        ball_r = r * factor[sheet]
    else:
        ball = np.mean([sheets[s][n - 1]['ball'] * factor[s] for _, s, n in spec['frames']
                        if sheets[s][n - 1]['ball'] is not None], axis=0)
        ball_r = 6

    # One shared scale and offset so every pose of this shot fits inside the ring
    pts = np.vstack([p for polys in frames for p in polys]).astype(np.float32)
    (cx, cy), r = cv2.minEnclosingCircle(pts)
    scale = min(RADIUS / r, MAX_HEIGHT / base[0]['height'])

    def place(p):
        return (np.asarray(p) - (cx, cy)) * scale + BOX / 2

    paths = [
        ''.join('M' + 'L'.join(f'{num(x)} {num(y)}' for x, y in place(p)) + 'Z' for p in polys)
        for polys in frames
    ]
    bx, by = place(ball)
    print(f'  {mode}: {len(paths)} poses, {sum(map(len, paths)) // 1024} KB, scale {scale:.3f}')
    putter = None
    if spec.get('putter'):
        sheet, number, hands, head = spec['putter']
        origin = sheets[sheet][number - 1]['origin']
        (hx, hy), (cx2, cy2) = (place((np.array(p) - origin) * factor[sheet]) for p in (hands, head))
        putter = dict(x1=num(hx), y1=num(hy), x2=num(cx2), y2=num(cy2))
    return paths, dict(cx=num(bx), cy=num(by), r=num(ball_r * scale)), putter


def main():
    sheets = {name: trace_sheet(**spec) for name, spec in SHEETS.items()}
    built = {mode: build_mode(mode, spec, sheets) for mode, spec in MODES.items()}

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
        *[f"  {mode}: {{ cx: {b['cx']}, cy: {b['cy']}, r: {b['r']} }}," for mode, (_, b, _) in built.items()],
        '}',
        '',
        '// Putter for the putting pose, hands (x1, y1) to club head (x2, y2); the dial rotates it about the hands',
        *[f"export const GOLFER_PUTTER = {{ x1: {p['x1']}, y1: {p['y1']}, x2: {p['x2']}, y2: {p['y2']} }}" for _, _, p in built.values() if p],
        '',
        'export const GOLFER_FRAMES: Record<TempoMode, string[]> = {',
    ]
    for mode, (paths, _, _) in built.items():
        lines += [f'  {mode}: [', *[f"    '{d}'," for d in paths], '  ],']
    lines += ['}', '']
    OUT.write_text('\n'.join(lines))
    print(f'wrote {OUT.relative_to(ROOT)}')

    if len(sys.argv) > 1:
        ring = '<circle cx="100" cy="100" r="88" fill="none" stroke="#333" stroke-width="8"/>'
        html = ''
        for mode, (paths, b, putter) in built.items():
            ball = f'<circle cx="{b["cx"]}" cy="{b["cy"]}" r="{b["r"]}" fill="#fff"/>'
            club = ''.join(
                f'<line x1="{putter["x1"]}" y1="{putter["y1"]}" x2="{putter["x2"]}" y2="{putter["y2"]}" stroke="#fff" '
                f'stroke-width="1.4" transform="rotate({a} {putter["x1"]} {putter["y1"]})"/>' for a in (10, 0, -14)
            ) if putter else ''
            cells = [f'{ring}{ball}{club}<path d="{d}" fill="#fff" fill-rule="evenodd"/>' for d in paths]
            cells.append(ring + ''.join(f'<path d="{d}" fill="#fff" fill-opacity=".18" fill-rule="evenodd"/>' for d in paths))
            html += '<div style="display:flex;flex-wrap:wrap">' + ''.join(
                f'<svg viewBox="0 0 200 200" width="200" height="200">{c}</svg>' for c in cells) + '</div>'
        Path(sys.argv[1]).write_text(f'<body style="background:#141414;margin:0;width:1600px">{html}</body>')


if __name__ == '__main__':
    main()
