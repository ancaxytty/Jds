#!/usr/bin/env python3
"""Render an animated promo GIF in pure Python (no external deps).
Includes a tiny GIF89a + LZW encoder and a 5x7 bitmap font.

Output: promo/voxel_forge_promo.gif
"""
import math, os, struct

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
OUT = os.path.join(ROOT, "promo", "voxel_forge_promo.gif")
os.makedirs(os.path.dirname(OUT), exist_ok=True)

W, H = 360, 200
FPS = 12
DELAY = 8  # 1/100 s

# ----------------------------------------------------------------- palette
palette = []
pal_map = {}
def idx(rgb):
    r = max(0, min(255, (rgb[0] // 8) * 8))
    g = max(0, min(255, (rgb[1] // 8) * 8))
    b = max(0, min(255, (rgb[2] // 8) * 8))
    k = (r << 16) | (g << 8) | b
    if k in pal_map:
        return pal_map[k]
    if len(palette) < 256:
        pal_map[k] = len(palette)
        palette.append((r, g, b))
        return pal_map[k]
    # nearest fallback
    best, bd = 0, 1e18
    for i, (pr, pg, pb) in enumerate(palette):
        d = (pr - r) ** 2 + (pg - g) ** 2 + (pb - b) ** 2
        if d < bd:
            bd, best = d, i
    return best

# ----------------------------------------------------------------- framebuffer
buf = bytearray(W * H)

def clear_bg():
    # vertical gradient
    for y in range(H):
        t = y / (H - 1)
        r = int(10 + t * 12); g = int(20 - t * 8 + 0); b = int(48 + t * (-6))
        c = idx((max(0, r), max(0, g + int(t * 6)), max(0, b)))
        row = y * W
        for x in range(W):
            buf[row + x] = c

def px(x, y, c):
    if 0 <= x < W and 0 <= y < H:
        buf[y * W + x] = c

def rect(x, y, w, h, c):
    for yy in range(int(y), int(y + h)):
        if 0 <= yy < H:
            base = yy * W
            for xx in range(int(x), int(x + w)):
                if 0 <= xx < W:
                    buf[base + xx] = c

def fill_poly(pts, c):
    ys = [p[1] for p in pts]
    y0, y1 = int(min(ys)), int(max(ys))
    n = len(pts)
    for y in range(max(0, y0), min(H, y1 + 1)):
        xs = []
        for i in range(n):
            ax, ay = pts[i]; bx, by = pts[(i + 1) % n]
            if (ay <= y < by) or (by <= y < ay):
                xs.append(ax + (bx - ax) * (y - ay) / (by - ay))
        xs.sort()
        for i in range(0, len(xs) - 1, 2):
            for x in range(max(0, int(xs[i])), min(W, int(xs[i + 1]) + 1)):
                buf[y * W + x] = c

# ----------------------------------------------------------------- 5x7 font
FONT = {
 ' ': ["00000"]*7,
 'A': ["01110","10001","10001","11111","10001","10001","10001"],
 'B': ["11110","10001","10001","11110","10001","10001","11110"],
 'C': ["01110","10001","10000","10000","10000","10001","01110"],
 'D': ["11110","10001","10001","10001","10001","10001","11110"],
 'E': ["11111","10000","10000","11110","10000","10000","11111"],
 'F': ["11111","10000","10000","11110","10000","10000","10000"],
 'G': ["01110","10001","10000","10111","10001","10001","01111"],
 'H': ["10001","10001","10001","11111","10001","10001","10001"],
 'I': ["01110","00100","00100","00100","00100","00100","01110"],
 'J': ["00111","00010","00010","00010","00010","10010","01100"],
 'K': ["10001","10010","10100","11000","10100","10010","10001"],
 'L': ["10000","10000","10000","10000","10000","10000","11111"],
 'M': ["10001","11011","10101","10101","10001","10001","10001"],
 'N': ["10001","11001","10101","10011","10001","10001","10001"],
 'O': ["01110","10001","10001","10001","10001","10001","01110"],
 'P': ["11110","10001","10001","11110","10000","10000","10000"],
 'Q': ["01110","10001","10001","10001","10101","10010","01101"],
 'R': ["11110","10001","10001","11110","10100","10010","10001"],
 'S': ["01111","10000","10000","01110","00001","00001","11110"],
 'T': ["11111","00100","00100","00100","00100","00100","00100"],
 'U': ["10001","10001","10001","10001","10001","10001","01110"],
 'V': ["10001","10001","10001","10001","10001","01010","00100"],
 'W': ["10001","10001","10001","10101","10101","11011","10001"],
 'X': ["10001","10001","01010","00100","01010","10001","10001"],
 'Y': ["10001","10001","01010","00100","00100","00100","00100"],
 'Z': ["11111","00001","00010","00100","01000","10000","11111"],
 '0': ["01110","10001","10011","10101","11001","10001","01110"],
 '1': ["00100","01100","00100","00100","00100","00100","01110"],
 '2': ["01110","10001","00001","00010","00100","01000","11111"],
 '3': ["11110","00001","00001","01110","00001","00001","11110"],
 '4': ["00010","00110","01010","10010","11111","00010","00010"],
 '5': ["11111","10000","11110","00001","00001","10001","01110"],
 '6': ["00110","01000","10000","11110","10001","10001","01110"],
 '7': ["11111","00001","00010","00100","01000","01000","01000"],
 '8': ["01110","10001","10001","01110","10001","10001","01110"],
 '9': ["01110","10001","10001","01111","00001","00010","01100"],
 ':': ["00000","00100","00100","00000","00100","00100","00000"],
 '/': ["00001","00010","00010","00100","01000","01000","10000"],
 '>': ["10000","01000","00100","00010","00100","01000","10000"],
 '+': ["00000","00100","00100","11111","00100","00100","00000"],
 '-': ["00000","00000","00000","11111","00000","00000","00000"],
 '.': ["00000","00000","00000","00000","00000","01100","01100"],
 '!': ["00100","00100","00100","00100","00100","00000","00100"],
}

def text_width(s, scale):
    return len(s) * 6 * scale

def draw_text(s, x, y, scale, c, center=False):
    s = s.upper()
    if center:
        x -= text_width(s, scale) // 2
    cx = x
    for ch in s:
        glyph = FONT.get(ch, FONT['!'])
        for ry in range(7):
            row = glyph[ry]
            for rx in range(5):
                if row[rx] == '1':
                    rect(cx + rx * scale, y + ry * scale, scale, scale, c)
        cx += 6 * scale

def draw_text_glow(s, x, y, scale, c, glow, center=False):
    # cheap glow: draw offset copies in glow color then main
    s2 = s.upper()
    gi = idx(glow); ci = idx(c)
    xx = x - (text_width(s2, scale) // 2 if center else 0)
    for dx, dy in ((scale,0),(-scale,0),(0,scale),(0,-scale)):
        _draw_text_at(s2, xx+dx, y+dy, scale, gi)
    _draw_text_at(s2, xx, y, scale, ci)

def _draw_text_at(s, x, y, scale, c):
    cx = x
    for ch in s:
        glyph = FONT.get(ch, FONT['!'])
        for ry in range(7):
            row = glyph[ry]
            for rx in range(5):
                if row[rx] == '1':
                    rect(cx + rx * scale, y + ry * scale, scale, scale, c)
        cx += 6 * scale

# ----------------------------------------------------------------- iso cube
def draw_iso_cube(cx, cy, s, hue):
    hues = [(74,222,128),(56,189,248),(167,139,250),(34,197,94),(14,165,233),(245,158,11)]
    base = hues[hue % len(hues)]
    def sh(f):
        return idx((int(base[0]*f), int(base[1]*f), int(base[2]*f)))
    top = sh(1.25); left = sh(0.8); right = sh(1.0); edge = idx((10,14,22))
    s2 = s/2
    # top
    fill_poly([(cx,cy-s),(cx+s,cy-s2),(cx,cy),(cx-s,cy-s2)], top)
    # left
    fill_poly([(cx-s,cy-s2),(cx,cy),(cx,cy+s),(cx-s,cy+s2)], left)
    # right
    fill_poly([(cx,cy),(cx+s,cy-s2),(cx+s,cy+s2),(cx,cy+s)], right)

# floating voxels
import random
rnd = random.Random(7)
PARTS = [{'x':rnd.uniform(0,W),'y':rnd.uniform(0,H),
          'vx':rnd.uniform(-.4,.4),'vy':rnd.uniform(-.3,.3),
          'sz':rnd.randint(2,5),'h':rnd.randint(0,5)} for _ in range(34)]

def draw_particles(f):
    hues=[(74,222,128),(56,189,248),(167,139,250)]
    for p in PARTS:
        p['x']=(p['x']+p['vx'])%W; p['y']=(p['y']+p['vy'])%H
        c=hues[p['h']%3]
        rect(p['x'],p['y'],p['sz'],p['sz'], idx((c[0]//2,c[1]//2,c[2]//2)))

# ----------------------------------------------------------------- scenes
WHITE=(238,244,255); GREEN=(74,222,128); BLUE=(56,189,248); PURP=(167,139,250); MUT=(120,140,170)
GLOW=(20,60,90)

def render_frame(f):
    t = f / FPS
    clear_bg()
    draw_particles(f)
    pulse = 30 + 5*math.sin(t*3)
    draw_iso_cube(W//2, 70, pulse, int(t*1.2))
    if t < 2.0:
        n = int(min(11, (t/1.0)*11))
        draw_text_glow("VOXEL FORGE"[:n], W//2, 120, 3, WHITE, GLOW, center=True)
        if t>1.0: draw_text("3D > MINECRAFT BEDROCK", W//2, 165, 2, idx(MUT), center=True)
    elif t < 4.0:
        draw_text_glow("MODELOS 3D", W//2, 118, 3, GREEN, GLOW, center=True)
        draw_text("A GEOMETRIA .GEO.JSON", W//2, 150, 2, idx(WHITE), center=True)
        draw_text("+ TEXTURA  ESTILO BLOCKBENCH", W//2, 172, 2, idx(MUT), center=True)
    elif t < 6.0:
        draw_text_glow("+10 FORMATOS", W//2, 112, 3, BLUE, GLOW, center=True)
        draw_text("GLB OBJ FBX STL PLY", W//2, 146, 2, idx(WHITE), center=True)
        draw_text("DAE 3MF VOX WRL USDZ", W//2, 168, 2, idx(WHITE), center=True)
    elif t < 7.6:
        draw_text_glow("CUSTOM NPC PRO", W//2, 112, 2, PURP, GLOW, center=True)
        draw_text("30 MODELOS  8 SKINS", W//2, 142, 2, idx(WHITE), center=True)
        draw_text("DIALOGOS  COMANDOS  EDITOR", W//2, 164, 2, idx(MUT), center=True)
    else:
        draw_text_glow("PRUEBALO YA", W//2, 118, 3, GREEN, GLOW, center=True)
        draw_text("GITHUB / ANCAXYTTY / JDS", W//2, 158, 2, idx(BLUE), center=True)
    # progress bar
    total = N_FRAMES
    rect(0, H-3, int(W*(f/total)), 3, idx(BLUE))

# ----------------------------------------------------------------- LZW (GIF)
def lzw_encode(indices, mcs):
    clear = 1 << mcs
    end = clear + 1
    code_size = mcs + 1
    table = {(i,): i for i in range(clear)}
    next_code = end + 1
    out = bytearray(); acc = 0; nb = 0
    def emit(code):
        nonlocal acc, nb
        acc |= code << nb; nb += code_size
        while nb >= 8:
            out.append(acc & 0xFF); acc >>= 8; nb -= 8
    emit(clear)
    cur = (indices[0],)
    for k in indices[1:]:
        c2 = cur + (k,)
        if c2 in table:
            cur = c2
        else:
            emit(table[cur])
            if next_code < 4096:
                table[c2] = next_code; next_code += 1
                if next_code == (1 << code_size) and code_size < 12:
                    code_size += 1
            else:
                emit(clear)
                table = {(i,): i for i in range(clear)}
                next_code = end + 1; code_size = mcs + 1
            cur = (k,)
    emit(table[cur])
    emit(end)
    if nb > 0:
        out.append(acc & 0xFF)
    return bytes(out)

def block_chunks(data):
    out = bytearray()
    for i in range(0, len(data), 255):
        chunk = data[i:i+255]
        out.append(len(chunk)); out += chunk
    out.append(0)
    return bytes(out)

# ----------------------------------------------------------------- build all frames
N_FRAMES = 96
frames_idx = []
for f in range(N_FRAMES):
    render_frame(f)
    frames_idx.append(bytes(buf))  # copy current index buffer
    if f % 12 == 0:
        print("frame", f, "/", N_FRAMES, "palette", len(palette))

# pad palette to 256
while len(palette) < 256:
    palette.append((0, 0, 0))

# ----------------------------------------------------------------- write GIF
with open(OUT, "wb") as fp:
    fp.write(b"GIF89a")
    fp.write(struct.pack("<HH", W, H))
    fp.write(bytes([0xF7, 0, 0]))  # GCT 256, color res
    for (r, g, b) in palette:
        fp.write(bytes([r, g, b]))
    # loop forever
    fp.write(b"\x21\xFF\x0BNETSCAPE2.0\x03\x01\x00\x00\x00")
    for fr in frames_idx:
        # graphic control extension
        fp.write(b"\x21\xF9\x04\x00")
        fp.write(struct.pack("<H", DELAY))
        fp.write(b"\x00\x00")
        # image descriptor
        fp.write(b"\x2C")
        fp.write(struct.pack("<HHHH", 0, 0, W, H))
        fp.write(b"\x00")
        mcs = 8
        fp.write(bytes([mcs]))
        fp.write(block_chunks(lzw_encode(fr, mcs)))
    fp.write(b"\x3B")

print("DONE ->", OUT)
print("size:", os.path.getsize(OUT), "bytes,", N_FRAMES, "frames,", len(palette), "colors")
