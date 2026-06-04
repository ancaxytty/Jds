#!/usr/bin/env python3
"""Generate 30 placeholder cube models (Blockbench-style), a default cube
texture, and rebuild the client entity + render controller so geometry and
texture can be switched at runtime via entity properties.

Pure standard library only.
Run from the repo root (folder that contains custom_npc_addon/).
"""
import struct, zlib, os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RP = os.path.join(ROOT, "custom_npc_addon", "resource_pack")
MODELS_DIR = os.path.join(RP, "models", "entity")
TEX_DIR = os.path.join(RP, "textures", "entity", "models")
os.makedirs(MODELS_DIR, exist_ok=True)
os.makedirs(TEX_DIR, exist_ok=True)

N_MODELS = 30

# --------------------------------------------------------------------------
# Minimal RGBA PNG writer
# --------------------------------------------------------------------------
class Image:
    def __init__(self, w, h, bg=(0, 0, 0, 0)):
        self.w, self.h = w, h
        self.px = bytearray(bytes(bg) * (w * h))

    def set(self, x, y, c):
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 4
            self.px[i:i + 4] = bytes(c if len(c) == 4 else (c[0], c[1], c[2], 255))

    def fill(self, x, y, w, h, c):
        for yy in range(y, y + h):
            for xx in range(x, x + w):
                self.set(xx, yy, c)

    def save(self, path):
        raw = bytearray()
        for y in range(self.h):
            raw.append(0)
            raw += self.px[y * self.w * 4:(y + 1) * self.w * 4]

        def chunk(tag, data):
            return (struct.pack(">I", len(data)) + tag + data +
                    struct.pack(">I", zlib.crc32(tag + data) & 0xffffffff))

        with open(path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)))
            f.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
            f.write(chunk(b"IEND", b""))


def shade(c, f):
    return tuple(min(255, max(0, int(v * f))) for v in c[:3])


# --------------------------------------------------------------------------
# Default cube texture (box UV, 64x32) - clean Blockbench-like cube
# --------------------------------------------------------------------------
def make_cube_texture(path):
    img = Image(64, 32)
    base = (170, 178, 190)
    edge = (96, 103, 117)
    faces = {
        (16, 0): shade(base, 1.18),   # top
        (32, 0): shade(base, 0.70),   # bottom
        (0, 16): shade(base, 0.90),   # right
        (16, 16): base,               # front
        (32, 16): shade(base, 0.90),  # left
        (48, 16): shade(base, 0.82),  # back
    }
    for (x, y), col in faces.items():
        img.fill(x, y, 16, 16, col)
        for i in range(16):
            img.set(x + i, y, edge)
            img.set(x + i, y + 15, edge)
            img.set(x, y + i, edge)
            img.set(x + 15, y + i, edge)
        img.set(x + 2, y + 2, shade(col, 1.25))
        img.set(x + 3, y + 2, shade(col, 1.15))
        img.set(x + 2, y + 3, shade(col, 1.15))
    img.save(path)
    print("wrote", path)


# --------------------------------------------------------------------------
# 30 cube model.json files in folders model-1 .. model-30
# --------------------------------------------------------------------------
def make_model(n):
    geo = {
        "format_version": "1.16.0",
        "minecraft:geometry": [
            {
                "description": {
                    "identifier": f"geometry.cube_model_{n}",
                    "texture_width": 64,
                    "texture_height": 32,
                    "visible_bounds_width": 3,
                    "visible_bounds_height": 3.5,
                    "visible_bounds_offset": [0, 1.25, 0],
                },
                "bones": [
                    {
                        "name": "root",
                        "pivot": [0, 0, 0],
                        "cubes": [
                            {
                                "origin": [-8, 0, -8],
                                "size": [16, 16, 16],
                                "uv": [0, 0],
                            }
                        ],
                    }
                ],
            }
        ],
    }
    folder = os.path.join(MODELS_DIR, f"model-{n}")
    os.makedirs(folder, exist_ok=True)
    with open(os.path.join(folder, "model.json"), "w") as f:
        json.dump(geo, f, indent=2)


# --------------------------------------------------------------------------
# Client entity (full rebuild)
# --------------------------------------------------------------------------
def write_client_entity():
    textures = {f"s{i}": f"textures/entity/custom_npc_{i}" for i in range(8)}
    textures["cube"] = "textures/entity/models/cube"

    geometry = {"default": "geometry.custom_npc"}
    for n in range(1, N_MODELS + 1):
        geometry[f"m{n}"] = f"geometry.cube_model_{n}"

    ce = {
        "format_version": "1.10.0",
        "minecraft:client_entity": {
            "description": {
                "identifier": "custom:npc",
                "materials": {"default": "entity_alphatest"},
                "textures": textures,
                "geometry": geometry,
                "scripts": {"animate": ["ctrl_main"]},
                "animations": {
                    "ctrl_main": "controller.animation.custom_npc.main",
                    "idle": "animation.custom_npc.idle",
                    "wave": "animation.custom_npc.wave",
                    "nod": "animation.custom_npc.nod",
                    "spin": "animation.custom_npc.spin",
                    "dance": "animation.custom_npc.dance",
                },
                "render_controllers": ["controller.render.custom_npc"],
                "spawn_egg": {"base_color": "#3B8E35", "overlay_color": "#8B4513"},
            }
        },
    }
    path = os.path.join(RP, "entity", "custom_npc.entity.json")
    with open(path, "w") as f:
        json.dump(ce, f, indent=2)
    print("wrote", path)


# --------------------------------------------------------------------------
# Render controller (full rebuild)
# --------------------------------------------------------------------------
def write_render_controller():
    geos = ["Geometry.default"] + [f"Geometry.m{n}" for n in range(1, N_MODELS + 1)]
    skins = [f"Texture.s{i}" for i in range(8)] + ["Texture.cube"]
    rc = {
        "format_version": "1.10.0",
        "render_controllers": {
            "controller.render.custom_npc": {
                "geometry": "Array.geos[query.property('custom:model')]",
                "materials": [{"*": "Material.default"}],
                "arrays": {
                    "geometries": {"Array.geos": geos},
                    "textures": {"Array.skins": skins},
                },
                "textures": ["Array.skins[query.property('custom:skin')]"],
            }
        },
    }
    path = os.path.join(RP, "render_controllers", "custom_npc.render_controllers.json")
    with open(path, "w") as f:
        json.dump(rc, f, indent=2)
    print("wrote", path)


if __name__ == "__main__":
    make_cube_texture(os.path.join(TEX_DIR, "cube.png"))
    for n in range(1, N_MODELS + 1):
        make_model(n)
    write_client_entity()
    write_render_controller()
    print(f"DONE - {N_MODELS} models, cube texture, client entity + render controller")
