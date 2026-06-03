#!/usr/bin/env python3
"""Render a clean flat-design cat illustration to PNG using only the
Python standard library (zlib + struct). Drawn with anti-aliasing via
2x supersampling. No external dependencies."""
import struct, zlib, math

W = H = 800
S = 2                      # supersample factor
CW, CH = W * S, H * S      # canvas (working) size

# RGB float buffer
buf = [[(0.0, 0.0, 0.0) for _ in range(CW)] for _ in range(CH)]


def clamp(v, a, b):
    return a if v < a else b if v > b else v


def blend_px(x, y, color, a):
    if 0 <= x < CW and 0 <= y < CH and a > 0:
        if a >= 1:
            buf[y][x] = color
        else:
            r, g, b = buf[y][x]
            cr, cg, cb = color
            buf[y][x] = (cr * a + r * (1 - a), cg * a + g * (1 - a), cb * a + b * (1 - a))


def fill_ellipse(cx, cy, rx, ry, color, a=1.0, rot=0.0):
    cx, cy, rx, ry = cx * S, cy * S, rx * S, ry * S
    ca, sa = math.cos(rot), math.sin(rot)
    x0, x1 = int(cx - max(rx, ry) - 2), int(cx + max(rx, ry) + 2)
    y0, y1 = int(cy - max(rx, ry) - 2), int(cy + max(rx, ry) + 2)
    for y in range(max(0, y0), min(CH, y1)):
        for x in range(max(0, x0), min(CW, x1)):
            dx, dy = x - cx, y - cy
            u = (dx * ca + dy * sa) / rx
            v = (-dx * sa + dy * ca) / ry
            if u * u + v * v <= 1.0:
                blend_px(x, y, color, a)


def fill_poly(points, color, a=1.0):
    pts = [(px * S, py * S) for px, py in points]
    ys = [p[1] for p in pts]
    y0, y1 = int(min(ys)), int(max(ys)) + 1
    n = len(pts)
    for y in range(max(0, y0), min(CH, y1)):
        xs = []
        for i in range(n):
            ax, ay = pts[i]
            bx, by = pts[(i + 1) % n]
            if (ay <= y < by) or (by <= y < ay):
                t = (y - ay) / (by - ay)
                xs.append(ax + t * (bx - ax))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(max(0, int(xs[i])), min(CW, int(xs[i + 1]) + 1)):
                blend_px(x, y, color, a)


def stamp_disc(x, y, r, color, a):
    r2 = r * r
    for yy in range(int(y - r), int(y + r) + 1):
        for xx in range(int(x - r), int(x + r) + 1):
            if (xx - x) ** 2 + (yy - y) ** 2 <= r2:
                blend_px(int(xx), int(yy), color, a)


def stroke_line(x0, y0, x1, y1, w, color, a=1.0):
    x0, y0, x1, y1, w = x0 * S, y0 * S, x1 * S, y1 * S, w * S / 2
    d = math.hypot(x1 - x0, y1 - y0)
    steps = max(1, int(d))
    for i in range(steps + 1):
        t = i / steps
        stamp_disc(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, w, color, a)


def stroke_curve(p0, p1, p2, w, color, a=1.0):
    # quadratic bezier
    prev = p0
    for i in range(1, 25):
        t = i / 24
        x = (1 - t) ** 2 * p0[0] + 2 * (1 - t) * t * p1[0] + t * t * p2[0]
        y = (1 - t) ** 2 * p0[1] + 2 * (1 - t) * t * p1[1] + t * t * p2[1]
        stroke_line(prev[0], prev[1], x, y, w, color, a)
        prev = (x, y)


def hx(c):
    return (int(c[1:3], 16) / 255, int(c[3:5], 16) / 255, int(c[5:7], 16) / 255)


# ---------------- Palette ----------------
BG1, BG2, BG3 = hx("#fef3e2"), hx("#fcd9a8"), hx("#f0b066")
FUR_T, FUR_B = hx("#8b97a8"), hx("#525f72")
BODY_T, BODY_B = hx("#7e8a9c"), hx("#4c5869")
BELLY = hx("#eef1f5")
PINK = hx("#e7a9b4")
NOSE = hx("#e07a8c")
DARK = hx("#3c4858")
EYE_O, EYE_I = hx("#8fce4f"), hx("#4f8f1f")
BLACK = hx("#10240a")
WHITE = (1, 1, 1)


def mix(c1, c2, t):
    return (c1[0] + (c2[0] - c1[0]) * t, c1[1] + (c2[1] - c1[1]) * t, c1[2] + (c2[2] - c1[2]) * t)


# ---------------- Background (radial gradient) ----------------
cx, cy = CW / 2, CH * 0.42
maxd = math.hypot(CW, CH) * 0.62
for y in range(CH):
    for x in range(CW):
        d = math.hypot(x - cx, y - cy) / maxd
        d = clamp(d, 0, 1)
        if d < 0.55:
            buf[y][x] = mix(BG1, BG2, d / 0.55)
        else:
            buf[y][x] = mix(BG2, BG3, (d - 0.55) / 0.45)

fill_ellipse(400, 372, 330, 330, WHITE, a=0.10)

# ---------------- Vertical fur gradient helper ----------------
def fur_grad(cyA, cyB, top, bot):
    """Return a function not used; we instead approximate gradients by
    drawing the shape solid then overlaying a lighter top ellipse."""
    pass


# Ground shadow
fill_ellipse(400, 694, 210, 34, hx("#3a2a12"), a=0.16)

# Tail (discs along a curve)
tail_pts = [(545, 600), (600, 560), (645, 500), (650, 440), (618, 415)]
for i in range(len(tail_pts) - 1):
    a0, a1 = tail_pts[i], tail_pts[i + 1]
    r = 30 - i * 3
    stroke_line(a0[0], a0[1], a1[0], a1[1], r * 2 / S, mix(BODY_T, BODY_B, 0.5))

# Body
fill_ellipse(400, 560, 168, 150, BODY_B)
fill_ellipse(400, 520, 168, 110, BODY_T, a=0.55)   # lighter top
# Belly
fill_ellipse(400, 560, 86, 120, BELLY, a=0.95)

# Front paws
for px in (352, 448):
    fill_ellipse(px, 652, 46, 36, FUR_B)
    fill_ellipse(px, 642, 46, 24, FUR_T, a=0.5)
stroke_line(352, 644, 352, 676, 3, DARK)
stroke_line(448, 644, 448, 676, 3, DARK)

# Ears (outer + inner)
fill_poly([(300, 244), (282, 128), (392, 218)], FUR_B)
fill_poly([(500, 244), (518, 128), (408, 218)], FUR_B)
fill_poly([(312, 230), (303, 166), (364, 214)], PINK)
fill_poly([(488, 230), (497, 166), (436, 214)], PINK)

# Head
fill_ellipse(400, 318, 150, 134, FUR_B)
fill_ellipse(400, 286, 150, 96, FUR_T, a=0.6)   # lighter top of head

# Forehead tabby stripes
stroke_line(400, 196, 400, 250, 9, DARK, a=0.5)
stroke_line(366, 200, 356, 250, 8, DARK, a=0.5)
stroke_line(434, 200, 444, 250, 8, DARK, a=0.5)

# Muzzle
fill_ellipse(400, 374, 94, 66, BELLY, a=0.95)

# Eyes
for ex in (345, 455):
    fill_ellipse(ex, 316, 39, 45, EYE_I)
    fill_ellipse(ex, 318, 34, 40, EYE_O)
    fill_ellipse(ex, 318, 12, 34, BLACK)          # pupil
    fill_ellipse(ex - 9, 300, 9, 9, WHITE, a=0.92)  # highlight

# Nose + mouth
fill_poly([(384, 364), (416, 364), (400, 386)], NOSE)
stroke_line(400, 386, 400, 398, 4, DARK)
stroke_curve((400, 398), (384, 410), (366, 398), 4, DARK)
stroke_curve((400, 398), (416, 410), (434, 398), 4, DARK)

# Whiskers
stroke_curve((320, 372), (262, 360), (210, 354), 3, WHITE, a=0.9)
stroke_curve((322, 388), (266, 396), (214, 406), 3, WHITE, a=0.9)
stroke_curve((480, 372), (538, 360), (590, 354), 3, WHITE, a=0.9)
stroke_curve((478, 388), (534, 396), (586, 406), 3, WHITE, a=0.9)

# ---------------- Downsample (2x2 average) + write PNG ----------------
raw = bytearray()
for y in range(H):
    raw.append(0)
    for x in range(W):
        r = g = b = 0.0
        for dy in range(S):
            for dx in range(S):
                pr, pg, pb = buf[y * S + dy][x * S + dx]
                r += pr; g += pg; b += pb
        n = S * S
        raw += bytes((int(clamp(r / n, 0, 1) * 255),
                      int(clamp(g / n, 0, 1) * 255),
                      int(clamp(b / n, 0, 1) * 255)))

def chunk(tag, data):
    return struct.pack(">I", len(data)) + tag + data + struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff)

png = b"\x89PNG\r\n\x1a\n"
png += chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 2, 0, 0, 0))
png += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
png += chunk(b"IEND", b"")
with open("/projects/sandbox/cat.png", "wb") as f:
    f.write(png)
print("wrote /projects/sandbox/cat.png", W, "x", H)
