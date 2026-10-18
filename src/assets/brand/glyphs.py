"""Outline the favicon monogram "RJ" from the self-hosted IBM Plex Mono 600 file (OFL).

Usage (needs fontTools and brotli: pip install fonttools brotli):
    python3 src/assets/brand/glyphs.py

Writes src/assets/brand/rj-paths.json, which build.mjs turns into public/favicon.svg.
SVG favicons cannot load web fonts, so the letters ship as paths (design spec 13.2).
The ink of the two letters is centered in the 32 by 32 square, not their advance boxes.
"""

import json
from pathlib import Path

from fontTools.pens.boundsPen import BoundsPen
from fontTools.pens.svgPathPen import SVGPathPen
from fontTools.pens.transformPen import TransformPen
from fontTools.ttLib import TTFont

ROOT = Path(__file__).resolve().parents[3]
FONT = ROOT / "public" / "fonts" / "ibm-plex-mono-600.woff2"
OUT = Path(__file__).resolve().parent / "rj-paths.json"

BOX = 32  # viewBox is BOX by BOX
SIZE = 23.5  # font size in viewBox units; the ink spans about 24, so the margin is about 4

font = TTFont(FONT)
upem = font["head"].unitsPerEm
glyphs = font.getGlyphSet()
cmap = font.getBestCmap()
scale = SIZE / upem

# Ink bounds of "RJ" in font units, with J one advance to the right.
left = right = None
for i, ch in enumerate("RJ"):
    name = cmap[ord(ch)]
    pen = BoundsPen(glyphs)
    glyphs[name].draw(pen)
    x0, _, x1, _ = pen.bounds
    shift = i * font["hmtx"][name][0]
    left = x0 + shift if left is None else min(left, x0 + shift)
    right = x1 + shift if right is None else max(right, x1 + shift)

# Center the ink horizontally. Center the cap height vertically, so the J overshoot hangs below.
ox = BOX / 2 - (left + right) / 2 * scale
cap = font["OS/2"].sCapHeight
oy = BOX / 2 + cap / 2 * scale  # baseline y


def num(v):
    return f"{v:.2f}".rstrip("0").rstrip(".")


d = ""
for i, ch in enumerate("RJ"):
    name = cmap[ord(ch)]
    svg = SVGPathPen(glyphs, ntos=num)
    adv = i * font["hmtx"][name][0]
    # font units to viewBox: x' = ox + (x + adv) * scale, y' = oy - y * scale
    glyphs[name].draw(TransformPen(svg, (scale, 0, 0, -scale, ox + adv * scale, oy)))
    d += svg.getCommands()

OUT.write_text(
    json.dumps(
        {
            "viewBox": BOX,
            "fontSize": SIZE,
            "source": "IBM Plex Mono SemiBold (OFL), public/fonts/ibm-plex-mono-600.woff2",
            "d": d,
        },
        indent=2,
    )
    + "\n"
)
print(f"ink {(right - left) * scale:.2f} wide, cap {cap * scale:.2f} high, margin {ox + left * scale:.2f}")
