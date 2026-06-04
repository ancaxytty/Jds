#!/usr/bin/env python3
"""Pure-Python PNG generator for the Floating Holograms addon.

Generates (no external deps, only stdlib zlib + struct + math):
  - 16x16 item icons: holo_projector.png, holo_wand.png
  - transparent entity texture: hologram_blank.png
  - particle textures: holo_spark.png, holo_beam.png
  - 9 custom UI grid-button icons (textures/holo_ui/*.png)
  - 256x256 pack_icon.png for behavior + resource packs

Design language: cyan -> violet holographic glow, scanlines, soft additive feel.
"""
import struct
import zlib
import os
import math
import random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RP = os.path.join(ROOT, "holo_addon", "resource_pack")
BP = os.path.join(ROOT, "holo_addon", "behavior_pack")

DIR_ITEMS = os.path.join(RP, "textures", "items")
DIR_ENTITY = os.path.join(RP, "textures", "entity")
DIR_PARTICLE = os.path.join(RP, "textures", "particle")
DIR_UI = os.path.join(RP, "textures", "holo_ui")
for d in (DIR_ITEMS, DIR_ENTITY, DIR_PARTICLE, DIR_UI):
    os.makedirs(d, exist_ok=True)


# ---------------------------------------------------------------------------
# Minimal RGBA image + PNG writer
# ---------------------------------------------------------------------------
class Image:
    def __init__(self, w, h, bg=(0, 0, 0, 0)):
        self.w = w
        self.h = h
        self.px = bytearray(bytes(bg) * (w * h))

    def set(self, x, y, c):
        x = int(x)
        y = int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 4
            self.px[i:i + 4] = bytes(c if len(c) == 4 else (c[0], c[1], c[2], 255))

    def get(self, x, y):
        i = (int(y) * self.w + int(x)) * 4
        return tuple(self.px[i:i + 4])

    def blend(self, x, y, c):
        """Alpha-composite c (RGBA) over existing pixel."""
        x = int(x)
        y = int(y)
        if not (0 <= x < self.w and 0 <= y < self.h):
            return
        i = (y * self.w + x) * 4
        sr, sg, sb = c[0], c[1], c[2]
        sa = (c[3] if len(c) == 4 else 255) / 255.0
        dr, dg, db, da = self.px[i], self.px[i + 1], self.px[i + 2], self.px[i + 3] / 255.0
        oa = sa + da * (1 - sa)
        if oa <= 0:
            self.px[i:i + 4] = bytes((0, 0, 0, 0))
            return
        nr = int((sr * sa + dr * da * (1 - sa)) / oa)
        ng = int((sg * sa + dg * da * (1 - sa)) / oa)
        nb = int((sb * sa + db * da * (1 - sa)) / oa)
        self.px[i:i + 4] = bytes((min(255, nr), min(255, ng), min(255, nb), int(oa * 255)))

    def fill(self, x, y, w, h, c):
        for yy in range(int(y), int(y + h)):
            for xx in range(int(x), int(x + w)):
                self.set(xx, yy, c)

    def rectframe(self, x, y, w, h, c, t=1):
        for i in range(t):
            self.fill(x + i, y + i, w - 2 * i, 1, c)
            self.fill(x + i, y + h - 1 - i, w - 2 * i, 1, c)
            self.fill(x + i, y + i, 1, h - 2 * i, c)
            self.fill(x + w - 1 - i, y + i, 1, h - 2 * i, c)

    def save(self, path):
        raw = bytearray()
        for y in range(self.h):
            raw.append(0)
            raw += self.px[y * self.w * 4:(y + 1) * self.w * 4]

        def chunk(tag, data):
            return (struct.pack(">I", len(data)) + tag + data +
                    struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF))

        with open(path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)))
            f.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
            f.write(chunk(b"IEND", b""))


# ---------------------------------------------------------------------------
# Color helpers
# ---------------------------------------------------------------------------
CYAN = (60, 210, 255)
VIOLET = (176, 107, 255)
DEEP = (16, 28, 60)
WHITE = (235, 250, 255)


def shade(c, f):
    return tuple(min(255, max(0, int(v * f))) for v in c[:3])


def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


def holo_grad(t):
    """Cyan -> violet gradient for t in [0,1]."""
    return mix(CYAN, VIOLET, max(0.0, min(1.0, t)))


def glow_dot(img, cx, cy, radius, color, intensity=1.0):
    """Additive-ish soft circular glow."""
    r = int(math.ceil(radius))
    for dy in range(-r, r + 1):
        for dx in range(-r, r + 1):
            d = math.hypot(dx, dy)
            if d > radius:
                continue
            a = (1 - d / radius) ** 1.6 * intensity
            if a <= 0:
                continue
            img.blend(cx + dx, cy + dy, (color[0], color[1], color[2], int(255 * a)))


def scanlines(img, x, y, w, h, color, step=2, alpha=70):
    for yy in range(int(y), int(y + h), step):
        for xx in range(int(x), int(x + w)):
            if img.get(xx, yy)[3] > 0:
                img.blend(xx, yy, (color[0], color[1], color[2], alpha))


# ---------------------------------------------------------------------------
# Transparent entity texture (the hologram entity itself is invisible)
# ---------------------------------------------------------------------------
def gen_blank():
    Image(16, 16).save(os.path.join(DIR_ENTITY, "hologram_blank.png"))
    print("wrote hologram_blank.png (transparent)")


# ---------------------------------------------------------------------------
# Item icon: Hologram Projector  (a glowing emitter base projecting a cube)
# ---------------------------------------------------------------------------
def gen_projector():
    N = 16
    img = Image(N, N)
    # projector base (dark tech device)
    base = (44, 54, 86)
    img.fill(4, 11, 8, 3, base)
    img.rectframe(4, 11, 8, 3, shade(base, 0.6), 1)
    img.fill(5, 12, 6, 1, shade(base, 1.4))
    # emitter lens
    glow_dot(img, 8, 11, 2.4, CYAN, 1.0)
    # projected holographic cube (wireframe-ish, floating above)
    # back square
    for (x0, y0, x1, y1, t) in [
        (5, 3, 11, 3, 0.0), (5, 9, 11, 9, 1.0),  # top/bottom edges
    ]:
        for x in range(x0, x1 + 1):
            img.blend(x, y0, (*holo_grad((x - 5) / 6.0), 230))
    # vertical edges + beams
    for y in range(3, 10):
        tt = (y - 3) / 6.0
        img.blend(5, y, (*holo_grad(tt), 220))
        img.blend(11, y, (*holo_grad(tt), 220))
    # inner sparkle
    glow_dot(img, 8, 6, 2.6, holo_grad(0.5), 0.8)
    img.set(8, 6, (*WHITE, 255))
    # beam from emitter up to cube
    for y in range(9, 12):
        img.blend(8, y, (*CYAN, 120))
    scanlines(img, 5, 3, 7, 7, DEEP, step=2, alpha=40)
    img.save(os.path.join(DIR_ITEMS, "holo_projector.png"))
    print("wrote holo_projector.png")


# ---------------------------------------------------------------------------
# Item icon: Hologram Wand  (diagonal rod with a holographic gem)
# ---------------------------------------------------------------------------
def gen_wand():
    N = 16
    img = Image(N, N)
    rod = (70, 80, 120)
    # diagonal handle from bottom-left to mid
    for i in range(9):
        img.set(3 + i, 13 - i, shade(rod, 1.0))
        img.set(4 + i, 13 - i, shade(rod, 0.7))
    # metal collar
    img.set(10, 4, (210, 220, 235))
    img.set(11, 3, (210, 220, 235))
    # holographic gem at the tip
    glow_dot(img, 12, 3, 3.2, holo_grad(0.3), 1.0)
    glow_dot(img, 12, 3, 1.6, VIOLET, 0.9)
    img.set(12, 3, (*WHITE, 255))
    # sparkles
    for (sx, sy) in [(9, 1), (14, 5), (13, 1)]:
        img.blend(sx, sy, (*CYAN, 200))
    img.save(os.path.join(DIR_ITEMS, "holo_wand.png"))
    print("wrote holo_wand.png")


# ---------------------------------------------------------------------------
# Particle textures
# ---------------------------------------------------------------------------
def gen_particle_spark():
    N = 16
    img = Image(N, N)
    # soft 4-point star / spark with cyan core, violet halo
    glow_dot(img, 8, 8, 7, VIOLET, 0.5)
    glow_dot(img, 8, 8, 4.5, CYAN, 0.9)
    glow_dot(img, 8, 8, 2, WHITE, 1.0)
    for d in range(1, 8):
        a = int(220 * (1 - d / 8))
        img.blend(8 + d, 8, (*CYAN, a))
        img.blend(8 - d, 8, (*CYAN, a))
        img.blend(8, 8 + d, (*VIOLET, a))
        img.blend(8, 8 - d, (*VIOLET, a))
    img.save(os.path.join(DIR_PARTICLE, "holo_spark.png"))
    print("wrote holo_spark.png")


def gen_particle_beam():
    N = 16
    img = Image(N, N)
    # vertical glowing bar (for beam / ring elements)
    for y in range(N):
        t = y / (N - 1)
        col = holo_grad(t)
        for x in range(6, 10):
            edge = abs(x - 7.5) / 2.0
            a = int(255 * (1 - edge) ** 1.5)
            img.blend(x, y, (*col, a))
    glow_dot(img, 8, 8, 6, CYAN, 0.35)
    img.save(os.path.join(DIR_PARTICLE, "holo_beam.png"))
    print("wrote holo_beam.png")


# ---------------------------------------------------------------------------
# Custom UI grid-button icons (used by the server_form 3x3 custom grid)
# Each is a 32x32 holographic glyph on a soft rounded tech tile.
# ---------------------------------------------------------------------------
def ui_tile(glyph_fn, name, hue=0.5):
    N = 32
    img = Image(N, N)
    # rounded dark tile with holo border
    tile = DEEP
    img.fill(2, 2, N - 4, N - 4, tile)
    # corner-rounding (clear corners)
    for (cx, cy) in [(2, 2), (N - 3, 2), (2, N - 3), (N - 3, N - 3)]:
        img.set(cx, cy, (0, 0, 0, 0))
    img.rectframe(2, 2, N - 4, N - 4, holo_grad(hue), 1)
    img.rectframe(3, 3, N - 6, N - 6, shade(holo_grad(hue), 0.5) + (120,), 1)
    # inner glow
    glow_dot(img, N // 2, N // 2, 13, holo_grad(hue), 0.18)
    glyph_fn(img, N, hue)
    scanlines(img, 3, 3, N - 6, N - 6, (0, 8, 20), step=3, alpha=45)
    img.save(os.path.join(DIR_UI, name))
    print("wrote holo_ui/" + name)


def _line(img, x0, y0, x1, y1, col, a=255):
    steps = int(max(abs(x1 - x0), abs(y1 - y0))) + 1
    for i in range(steps + 1):
        t = i / steps if steps else 0
        img.blend(x0 + (x1 - x0) * t, y0 + (y1 - y0) * t, (*col, a))


def g_create(img, N, hue):  # plus / new
    c = WHITE
    _line(img, 16, 9, 16, 23, holo_grad(0.2), 255)
    _line(img, 9, 16, 23, 16, holo_grad(0.7), 255)
    glow_dot(img, 16, 16, 4, CYAN, 0.6)


def g_list(img, N, hue):  # list lines
    for i, yy in enumerate((11, 16, 21)):
        col = holo_grad(i / 2.0)
        img.blend(10, yy, (*col, 255))
        _line(img, 12, yy, 23, yy, col, 230)


def g_text(img, N, hue):  # "T" glyph
    _line(img, 10, 11, 22, 11, CYAN, 255)
    _line(img, 16, 11, 16, 22, VIOLET, 255)


def g_color(img, N, hue):  # palette swatches
    cols = [CYAN, VIOLET, (90, 240, 160), (255, 120, 90)]
    pos = [(12, 12), (20, 12), (12, 20), (20, 20)]
    for cc, (px, py) in zip(cols, pos):
        glow_dot(img, px, py, 3.2, cc, 0.9)


def g_move(img, N, hue):  # 4-direction arrows
    c = holo_grad(0.5)
    _line(img, 16, 8, 16, 24, c, 230)
    _line(img, 8, 16, 24, 16, c, 230)
    for (ax, ay, bx, by) in [(16, 8, 13, 11), (16, 8, 19, 11),
                              (16, 24, 13, 21), (16, 24, 19, 21),
                              (8, 16, 11, 13), (8, 16, 11, 19),
                              (24, 16, 21, 13), (24, 16, 21, 19)]:
        _line(img, ax, ay, bx, by, WHITE, 255)


def g_size(img, N, hue):  # diagonal resize
    _line(img, 10, 22, 22, 10, holo_grad(0.5), 255)
    _line(img, 22, 10, 18, 10, WHITE, 255)
    _line(img, 22, 10, 22, 14, WHITE, 255)
    _line(img, 10, 22, 14, 22, WHITE, 255)
    _line(img, 10, 22, 10, 18, WHITE, 255)


def g_particle(img, N, hue):  # sparkles
    for (sx, sy, r) in [(13, 13, 3), (21, 12, 2), (19, 21, 2.5), (11, 20, 1.6)]:
        glow_dot(img, sx, sy, r + 1.5, VIOLET, 0.5)
        glow_dot(img, sx, sy, r, CYAN, 0.9)
        img.set(sx, sy, (*WHITE, 255))


def g_delete(img, N, hue):  # X
    _line(img, 11, 11, 21, 21, (255, 110, 110), 255)
    _line(img, 21, 11, 11, 21, (255, 110, 110), 255)
    glow_dot(img, 16, 16, 6, (255, 80, 80), 0.18)


def g_settings(img, N, hue):  # gear-ish ring
    cx, cy = 16, 16
    for ang in range(0, 360, 30):
        a = math.radians(ang)
        glow_dot(img, cx + math.cos(a) * 7, cy + math.sin(a) * 7, 2.2, holo_grad((ang % 90) / 90.0), 0.8)
    glow_dot(img, cx, cy, 3, WHITE, 0.7)


def gen_button_tile():
    """Wide holographic button background tile used by the custom grid UI."""
    W, H = 104, 50
    img = Image(W, H)
    # translucent dark glass body
    for y in range(H):
        t = y / (H - 1)
        c = mix((14, 26, 56), (26, 16, 52), t)
        for x in range(W):
            img.set(x, y, (c[0], c[1], c[2], 205))
    # clear the rounded corners
    for (cx, cy) in [(0, 0), (1, 0), (0, 1), (W - 1, 0), (W - 2, 0), (W - 1, 1),
                     (0, H - 1), (1, H - 1), (0, H - 2),
                     (W - 1, H - 1), (W - 2, H - 1), (W - 1, H - 2)]:
        img.set(cx, cy, (0, 0, 0, 0))
    # holo border (cyan top -> violet bottom)
    for x in range(1, W - 1):
        img.blend(x, 1, (*holo_grad(0.15), 235))
        img.blend(x, H - 2, (*holo_grad(0.85), 235))
    for y in range(1, H - 1):
        img.blend(1, y, (*holo_grad(y / H), 235))
        img.blend(W - 2, y, (*holo_grad(y / H), 235))
    # top inner highlight + scanlines
    img.fill(3, 3, W - 6, 1, (*WHITE, 60))
    scanlines(img, 2, 2, W - 4, H - 4, (4, 10, 26), step=3, alpha=35)
    img.save(os.path.join(DIR_UI, "btn_tile.png"))
    print("wrote holo_ui/btn_tile.png")


def gen_ui_icons():
    gen_button_tile()
    ui_tile(g_create, "ic_create.png", 0.2)
    ui_tile(g_list, "ic_list.png", 0.4)
    ui_tile(g_text, "ic_text.png", 0.6)
    ui_tile(g_color, "ic_color.png", 0.8)
    ui_tile(g_move, "ic_move.png", 0.5)
    ui_tile(g_size, "ic_size.png", 0.35)
    ui_tile(g_particle, "ic_particle.png", 0.7)
    ui_tile(g_delete, "ic_delete.png", 0.95)
    ui_tile(g_settings, "ic_settings.png", 0.5)


# ---------------------------------------------------------------------------
# Pack icon (256x256) - a glowing holographic projector scene
# ---------------------------------------------------------------------------
def gen_pack_icon():
    N = 256
    img = Image(N, N)
    # vertical gradient background
    for y in range(N):
        t = y / (N - 1)
        c = mix((10, 16, 40), (28, 14, 54), t)
        for x in range(N):
            dx = (x - N / 2) / (N / 2)
            dy = (y - N / 2) / (N / 2)
            v = max(0.0, 1 - (dx * dx + dy * dy) * 0.3)
            img.set(x, y, shade(c, 0.55 + 0.45 * v))
    # subtle grid floor
    for gx in range(0, N, 18):
        for y in range(170, N):
            img.blend(gx, y, (*CYAN, 18))
    for gy in range(170, N, 14):
        for x in range(N):
            img.blend(x, gy, (*CYAN, 14))
    # emitter base
    img.fill(96, 196, 64, 18, (40, 50, 84))
    img.rectframe(96, 196, 64, 18, shade((40, 50, 84), 1.6), 2)
    glow_dot(img, 128, 196, 16, CYAN, 0.9)
    # projected holographic cube (wireframe) floating
    cube = [
        # front face
        (88, 70, 168, 70), (88, 150, 168, 150),
        (88, 70, 88, 150), (168, 70, 168, 150),
        # back face (offset)
        (118, 50, 198, 50), (118, 130, 198, 130),
        (118, 50, 118, 130), (198, 50, 198, 130),
        # connectors
        (88, 70, 118, 50), (168, 70, 198, 50),
        (88, 150, 118, 130), (168, 150, 198, 130),
    ]
    for i, (x0, y0, x1, y1) in enumerate(cube):
        col = holo_grad((i % 6) / 6.0)
        steps = int(max(abs(x1 - x0), abs(y1 - y0)))
        for s in range(steps + 1):
            t = s / steps if steps else 0
            px = x0 + (x1 - x0) * t
            py = y0 + (y1 - y0) * t
            glow_dot(img, px, py, 3, col, 0.7)
    # beams from emitter to cube corners
    for (cx, cy) in [(88, 150), (168, 150), (118, 130), (198, 130)]:
        steps = 40
        for s in range(steps):
            t = s / steps
            img.blend(128 + (cx - 128) * t, 196 + (cy - 196) * t, (*CYAN, int(70 * (1 - t))))
    # floating sparkles
    rnd = random.Random(7)
    for _ in range(40):
        sx = rnd.randint(40, 216)
        sy = rnd.randint(30, 170)
        glow_dot(img, sx, sy, rnd.uniform(1.5, 3.5), holo_grad(rnd.random()), 0.6)
    # border
    border = (12, 18, 40)
    img.fill(0, 0, N, 6, border)
    img.fill(0, N - 6, N, 6, border)
    img.fill(0, 0, 6, N, border)
    img.fill(N - 6, 0, 6, N, border)
    img.rectframe(6, 6, N - 12, N - 12, holo_grad(0.5), 2)

    img.save(os.path.join(BP, "pack_icon.png"))
    img.save(os.path.join(RP, "pack_icon.png"))
    print("wrote pack_icon.png (BP + RP)")


# ---------------------------------------------------------------------------
if __name__ == "__main__":
    gen_blank()
    gen_projector()
    gen_wand()
    gen_particle_spark()
    gen_particle_beam()
    gen_ui_icons()
    gen_pack_icon()
    print("DONE - all hologram assets generated")
