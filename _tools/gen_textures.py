#!/usr/bin/env python3
"""Pure-Python PNG generator for the Custom NPC addon.

Generates:
  - Several 64x64 humanoid skin textures matching geometry.custom_npc UV layout
  - A 256x256 pack_icon for both packs

No external deps (only zlib + struct from stdlib).
"""
import struct
import zlib
import os

# ----------------------------------------------------------------------------
# Minimal RGBA image + PNG writer
# ----------------------------------------------------------------------------


class Image:
    def __init__(self, w, h, bg=(0, 0, 0, 0)):
        self.w = w
        self.h = h
        self.px = bytearray(w * h * 4)
        for i in range(w * h):
            self.px[i * 4 : i * 4 + 4] = bytes(bg)

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 4
            if len(c) == 3:
                c = (c[0], c[1], c[2], 255)
            self.px[i : i + 4] = bytes(c)

    def fill(self, x0, y0, w, h, c):
        for y in range(y0, y0 + h):
            for x in range(x0, x0 + w):
                self.set(x, y, c)

    def save(self, path):
        raw = bytearray()
        for y in range(self.h):
            raw.append(0)  # filter type 0
            raw += self.px[y * self.w * 4 : (y + 1) * self.w * 4]
        comp = zlib.compress(bytes(raw), 9)

        def chunk(tag, data):
            c = struct.pack(">I", len(data)) + tag + data
            c += struct.pack(">I", zlib.crc32(tag + data) & 0xFFFFFFFF)
            return c

        sig = b"\x89PNG\r\n\x1a\n"
        ihdr = struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)
        with open(path, "wb") as f:
            f.write(sig)
            f.write(chunk(b"IHDR", ihdr))
            f.write(chunk(b"IDAT", comp))
            f.write(chunk(b"IEND", b""))


# ----------------------------------------------------------------------------
# Color helpers
# ----------------------------------------------------------------------------


def shade(c, f):
    return tuple(min(255, max(0, int(v * f))) for v in c[:3])


def mix(a, b, t):
    return tuple(int(a[i] * (1 - t) + b[i] * t) for i in range(3))


# ----------------------------------------------------------------------------
# Cube net painter (standard Minecraft box UV)
# ----------------------------------------------------------------------------


def paint_cube(img, u, v, w, h, d, base, top=None, noise=8):
    if top is None:
        top = shade(base, 1.12)
    front = base
    side = shade(base, 0.9)
    back = shade(base, 0.82)
    bottom = shade(base, 0.68)
    # top, bottom
    img.fill(u + d, v, w, d, top)
    img.fill(u + d + w, v, w, d, bottom)
    # right, front, left, back
    img.fill(u, v + d, d, h, side)
    img.fill(u + d, v + d, w, h, front)
    img.fill(u + d + w, v + d, d, h, side)
    img.fill(u + d + w + d, v + d, w, h, back)
    # subtle per-pixel noise for texture
    if noise:
        import random

        rnd = random.Random(u * 31 + v * 7 + w + base[0])
        for yy in range(v, v + d + h):
            for xx in range(u, u + 2 * w + 2 * d):
                i = (yy * img.w + xx) * 4
                if img.px[i + 3] == 0:
                    continue
                n = rnd.randint(-noise, noise)
                img.px[i] = min(255, max(0, img.px[i] + n))
                img.px[i + 1] = min(255, max(0, img.px[i + 1] + n))
                img.px[i + 2] = min(255, max(0, img.px[i + 2] + n))


def draw_face(img, skin, hair, eye, mouth):
    # Head front face occupies (8,8) 8x8
    fx, fy = 8, 8
    # eyes
    for ex in (fx + 1, fx + 5):
        img.fill(ex, fy + 3, 2, 2, (255, 255, 255))
        img.set(ex + 1, fy + 4, eye)
        img.set(ex, fy + 4, eye)
    # eyebrows / hair fringe along top of face
    img.fill(fx, fy, 8, 2, hair)
    # mouth
    img.fill(fx + 2, fy + 6, 4, 1, mouth)
    # cheeks subtle
    img.set(fx + 1, fy + 5, shade(skin, 0.9))
    img.set(fx + 6, fy + 5, shade(skin, 0.9))


def build_skin(path, skin_tone, shirt, pants, hair, eye=(40, 30, 20), mouth=(120, 60, 60),
               shoes=None, belt=None):
    if shoes is None:
        shoes = shade(pants, 0.6)
    img = Image(64, 64)

    # HEAD (8x8x8) @ (0,0) — skin tone + hair top
    paint_cube(img, 0, 0, 8, 8, 8, skin_tone, top=hair, noise=4)
    draw_face(img, skin_tone, hair, eye, mouth)
    # hair sides/back
    img.fill(0, 8, 8, 2, hair)        # right side top band
    img.fill(16, 8, 8, 2, hair)       # left side top band
    img.fill(24, 8, 8, 3, hair)       # back top band

    # BODY (8x12x4) @ (16,16) — shirt
    paint_cube(img, 16, 16, 8, 12, 4, shirt, noise=6)
    if belt:
        img.fill(20, 20 + 9, 8, 1, belt)  # belt on front
        img.fill(32, 20 + 9, 8, 1, belt)  # belt on back

    # RIGHT ARM (4x12x4) @ (40,16)
    paint_cube(img, 40, 16, 4, 12, 4, shirt, noise=6)
    # hand (skin) bottom 3px of arm front/sides
    img.fill(44, 20 + 9, 4, 3, skin_tone)
    img.fill(40, 20 + 9, 4, 3, shade(skin_tone, 0.9))
    img.fill(48, 20 + 9, 4, 3, shade(skin_tone, 0.9))
    img.fill(52, 20 + 9, 4, 3, shade(skin_tone, 0.82))

    # LEFT ARM (4x12x4) @ (32,48)
    paint_cube(img, 32, 48, 4, 12, 4, shirt, noise=6)
    img.fill(36, 52 + 9, 4, 3, skin_tone)
    img.fill(32, 52 + 9, 4, 3, shade(skin_tone, 0.9))
    img.fill(40, 52 + 9, 4, 3, shade(skin_tone, 0.9))
    img.fill(44, 52 + 9, 4, 3, shade(skin_tone, 0.82))

    # RIGHT LEG (4x12x4) @ (0,16) — pants
    paint_cube(img, 0, 16, 4, 12, 4, pants, noise=6)
    img.fill(4, 20 + 9, 4, 3, shoes)
    img.fill(0, 20 + 9, 4, 3, shade(shoes, 0.9))
    img.fill(8, 20 + 9, 4, 3, shade(shoes, 0.9))
    img.fill(12, 20 + 9, 4, 3, shade(shoes, 0.82))

    # LEFT LEG (4x12x4) @ (16,48) — pants
    paint_cube(img, 16, 48, 4, 12, 4, pants, noise=6)
    img.fill(20, 52 + 9, 4, 3, shoes)
    img.fill(16, 52 + 9, 4, 3, shade(shoes, 0.9))
    img.fill(24, 52 + 9, 4, 3, shade(shoes, 0.9))
    img.fill(28, 52 + 9, 4, 3, shade(shoes, 0.82))

    img.save(path)
    print("wrote", path)


# ----------------------------------------------------------------------------
# Pack icon
# ----------------------------------------------------------------------------


def build_icon(path, top_color, bot_color, shirt, skin_tone, hair):
    N = 256
    img = Image(N, N)
    # vertical gradient background
    for y in range(N):
        t = y / (N - 1)
        c = mix(top_color, bot_color, t)
        for x in range(N):
            # subtle vignette
            dx = (x - N / 2) / (N / 2)
            dy = (y - N / 2) / (N / 2)
            v = max(0.0, 1 - (dx * dx + dy * dy) * 0.25)
            img.set(x, y, shade(c, 0.6 + 0.4 * v))
    # rounded-ish border
    border = (20, 24, 34)
    img.fill(0, 0, N, 6, border)
    img.fill(0, N - 6, N, 6, border)
    img.fill(0, 0, 6, N, border)
    img.fill(N - 6, 0, 6, N, border)

    # draw a big blocky NPC head/torso centered
    cx = N // 2
    # head
    hs = 92
    hx = cx - hs // 2
    hy = 40
    img.fill(hx - 4, hy - 4, hs + 8, hs + 8, shade(hair, 0.8))  # hair outline
    img.fill(hx, hy, hs, hs, skin_tone)
    img.fill(hx, hy, hs, 18, hair)  # hair top
    # eyes
    ew = 16
    img.fill(hx + 18, hy + 40, ew, ew, (255, 255, 255))
    img.fill(hx + hs - 18 - ew, hy + 40, ew, ew, (255, 255, 255))
    img.fill(hx + 24, hy + 46, 8, 8, (40, 60, 140))
    img.fill(hx + hs - 24 - 8, hy + 46, 8, 8, (40, 60, 140))
    # mouth
    img.fill(hx + 30, hy + 70, hs - 60, 8, shade(skin_tone, 0.7))
    # torso (shirt)
    tw = 120
    th = 70
    tx = cx - tw // 2
    ty = hy + hs + 6
    img.fill(tx - 4, ty - 4, tw + 8, th + 8, shade(shirt, 0.7))
    img.fill(tx, ty, tw, th, shirt)
    # a little "gear/cog" emblem hint on chest
    img.fill(tx + tw // 2 - 10, ty + th // 2 - 10, 20, 20, shade(shirt, 1.4))

    img.save(path)
    print("wrote", path)


# ----------------------------------------------------------------------------
# Main
# ----------------------------------------------------------------------------

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RP = os.path.join(ROOT, "custom_npc_addon", "resource_pack")
TEX = os.path.join(RP, "textures", "entity")
os.makedirs(TEX, exist_ok=True)

# Skin variants  (index order MUST match render controller / script)
SKINS = [
    # name,    skin_tone,      shirt,          pants,          hair
    ("classic", (224, 178, 138), (60, 140, 70), (60, 60, 80), (70, 45, 25)),
    ("guard",   (224, 178, 138), (70, 80, 110), (40, 45, 60), (40, 30, 20)),
    ("mage",    (230, 200, 170), (120, 70, 170), (60, 40, 90), (200, 200, 210)),
    ("villager",(210, 160, 120), (120, 85, 55), (90, 70, 50), (60, 40, 25)),
    ("knight",  (224, 178, 138), (150, 155, 165), (90, 95, 105), (90, 70, 40)),
    ("royal",   (235, 195, 160), (170, 40, 50), (200, 165, 60), (30, 25, 20)),
    ("ninja",   (220, 175, 135), (35, 38, 48), (25, 27, 34), (20, 20, 24)),
    ("medic",   (230, 195, 165), (235, 238, 242), (180, 185, 195), (120, 80, 45)),
]

for i, (name, st, sh, pa, ha) in enumerate(SKINS):
    build_skin(os.path.join(TEX, f"custom_npc_{i}.png"), st, sh, pa, ha)
# default alias = skin 0
build_skin(os.path.join(TEX, "custom_npc.png"), *[s for s in SKINS[0][1:]])

# Pack icons (same icon for both packs)
icon_bp = os.path.join(ROOT, "custom_npc_addon", "behavior_pack", "pack_icon.png")
icon_rp = os.path.join(RP, "pack_icon.png")
build_icon(icon_bp, (52, 120, 200), (24, 30, 60), (60, 140, 70), (224, 178, 138), (70, 45, 25))
build_icon(icon_rp, (52, 120, 200), (24, 30, 60), (60, 140, 70), (224, 178, 138), (70, 45, 25))

print("DONE")
