#!/usr/bin/env python3
"""Generate professional multi-cube 3D models + per-model textures for the
Custom NPC addon, and rebuild the client entity + render controller so each
model has its OWN independent texture (swap model.json + texture.png easily).

- model-1 .. model-10  : 10 detailed multi-cube 3D models (real 3D look)
- model-11 .. model-30 : 20 themed creature cubes
Each folder: models/entity/model-N/model.json  +  models/entity/model-N/texture.png

Pure standard library only.
"""
import struct, zlib, os, json, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RP = os.path.join(ROOT, "custom_npc_addon", "resource_pack")
MODELS_DIR = os.path.join(RP, "models", "entity")
os.makedirs(MODELS_DIR, exist_ok=True)

N_MODELS = 30
N_PRO = 10

# --------------------------------------------------------------------------- PNG
class Image:
    def __init__(self, w, h, bg=(0, 0, 0, 0)):
        self.w, self.h = w, h
        self.px = bytearray(bytes(bg) * (w * h))
    def set(self, x, y, c):
        x = int(x); y = int(y)
        if 0 <= x < self.w and 0 <= y < self.h:
            i = (y * self.w + x) * 4
            self.px[i:i+4] = bytes(c if len(c) == 4 else (c[0], c[1], c[2], 255))
    def fill(self, x, y, w, h, c):
        for yy in range(int(y), int(y+h)):
            for xx in range(int(x), int(x+w)):
                self.set(xx, yy, c)
    def save(self, path):
        raw = bytearray()
        for y in range(self.h):
            raw.append(0); raw += self.px[y*self.w*4:(y+1)*self.w*4]
        def chunk(t, d):
            return struct.pack(">I", len(d)) + t + d + struct.pack(">I", zlib.crc32(t+d) & 0xffffffff)
        with open(path, "wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            f.write(chunk(b"IHDR", struct.pack(">IIBBBBB", self.w, self.h, 8, 6, 0, 0, 0)))
            f.write(chunk(b"IDAT", zlib.compress(bytes(raw), 9)))
            f.write(chunk(b"IEND", b""))

def shade(c, f):
    return tuple(min(255, max(0, int(v*f))) for v in c[:3])

# --------------------------------------------------------------------------- builder
def box(cubes, x, y, z, w, h, d, color, role=None):
    # texture box-UV needs integer face sizes; round dimensions (origins may stay fractional)
    w, h, d = int(round(w)), int(round(h)), int(round(d))
    cubes.append({"origin": [x, y, z], "size": [w, h, d], "color": tuple(color), "role": role})

# Box-UV packing: each cube footprint = 2*(d+w) x (d+h)
def pack_and_paint(cubes, pad=1):
    foot = []
    for c in cubes:
        w, h, d = c["size"]
        foot.append((2*(d+w), d+h))
    atlas_w = max(16, max(f[0] for f in foot) + pad*2)
    if atlas_w % 2: atlas_w += 1
    x = pad; y = pad; shelf = 0; place = []
    for (bw, bh) in foot:
        if x + bw + pad > atlas_w:
            y += shelf + pad; x = pad; shelf = 0
        place.append((x, y)); x += bw + pad; shelf = max(shelf, bh)
    atlas_h = y + shelf + pad
    if atlas_h % 2: atlas_h += 1
    img = Image(atlas_w, atlas_h)
    for c, (u, v) in zip(cubes, place):
        paint_box(img, u, v, c)
        c["uv"] = [u, v]
    return img, atlas_w, atlas_h

def paint_box(img, u, v, c):
    w, h, d = c["size"]; col = c["color"]; role = c.get("role")
    up = shade(col, 1.22); dn = shade(col, 0.55); side = shade(col, 0.82)
    front = col; back = shade(col, 0.74); edge = shade(col, 0.5)
    faces = [
        (u+d,       v,     w, d, up),    # top
        (u+d+w,     v,     w, d, dn),    # bottom
        (u,         v+d,   d, h, side),  # right
        (u+d,       v+d,   w, h, front), # front
        (u+d+w,     v+d,   d, h, side),  # left
        (u+d+w+d,   v+d,   w, h, back),  # back
    ]
    for (fx, fy, fw, fh, fc) in faces:
        img.fill(fx, fy, fw, fh, fc)
        # subtle edge for 3D definition
        for i in range(int(fw)):
            img.set(fx+i, fy, edge); img.set(fx+i, fy+fh-1, shade(fc, 0.7))
        for i in range(int(fh)):
            img.set(fx, fy+i, edge); img.set(fx+fw-1, fy+i, shade(fc, 0.7))
    if role == "head":
        # eyes on the front face
        fx, fy = u+d, v+d
        ex = max(1, w//5); ey = max(1, h//2 - h//6)
        eo = max(1, w//6); ew = max(1, w//6)
        white = (245, 245, 250); pup = (20, 24, 40)
        img.fill(fx+eo, fy+ey, ew, ew, white)
        img.fill(fx+w-eo-ew, fy+ey, ew, ew, white)
        img.set(fx+eo+ew-1, fy+ey+ew-1, pup)
        img.set(fx+w-eo-ew, fy+ey+ew-1, pup)
    if role == "light":
        fx, fy = u+d, v+d
        img.fill(fx+1, fy+1, max(1, w-2), max(1, h-2), shade(col, 1.6))

# --------------------------------------------------------------------------- 10 pro archetypes
def m_robot():
    c = []; steel=(150,160,178); dark=(58,64,82); acc=(56,189,248)
    box(c,-4,20,-4,8,8,8,steel,"head")
    box(c,-1,28,-1,2,4,2,dark)
    box(c,-3,23,-5,6,2,1,acc,"light")           # visor
    box(c,-5,10,-3,10,10,6,steel)
    box(c,-2,13,-3.0,4,4,1,acc,"light")          # chest core
    box(c,-8,18,-3,4,3,6,acc)                    # shoulders
    box(c,4,18,-3,4,3,6,acc)
    box(c,-8,9,-2,3,11,4,dark); box(c,5,9,-2,3,11,4,dark)
    box(c,-4,0,-2,3.5,10,4,steel); box(c,0.5,0,-2,3.5,10,4,steel)
    return c
def m_knight():
    c=[]; gray=(120,128,142); red=(170,40,50); sil=(200,205,215); dk=(70,55,40)
    box(c,-4,20,-4,8,8,8,gray,"head")
    box(c,-1,28,-2,2,3,6,red)                    # plume
    box(c,-5,9,-3,10,11,6,gray)
    box(c,-5,11,-3.1,10,1,1,dk)                  # belt
    box(c,-8,17,-4,4,4,8,gray); box(c,4,17,-4,4,4,8,gray)  # pauldrons
    box(c,-8,8,-2,3,11,4,gray); box(c,5,8,-2,3,11,4,gray)
    box(c,-4,0,-2,3.5,9,4,gray); box(c,0.5,0,-2,3.5,9,4,gray)
    box(c,7,2,-1,2,16,2,sil); box(c,6,2,-2,4,2,4,dk)       # sword
    return c
def m_mage():
    c=[]; skin=(230,200,170); rob=(120,70,170); rob2=(95,55,135); st=(110,80,50); orb=(120,220,255)
    box(c,-4,19,-4,8,8,8,skin,"head")
    box(c,-5,27,-5,10,1,10,rob)
    box(c,-3,28,-3,6,3,6,rob); box(c,-2,31,-2,4,3,4,rob); box(c,-1,34,-1,2,3,2,rob)
    box(c,-5,2,-3,10,18,6,rob)
    box(c,-6,0,-4,12,3,8,rob2)
    box(c,-8,9,-2,3,11,4,rob); box(c,5,9,-2,3,11,4,rob)
    box(c,7,0,-1,2,26,2,st); box(c,5,25,-3,5,5,5,orb,"light")
    return c
def m_golem():
    c=[]; st=(140,140,152); st2=(120,120,132); gr=(90,170,90)
    box(c,-4,18,-4,8,9,8,st,"head")
    box(c,-7,6,-4,14,14,8,st2)
    box(c,-12,4,-3,5,16,6,st); box(c,7,4,-3,5,16,6,st)
    box(c,-5,0,-3,5,6,6,st2); box(c,0,0,-3,5,6,6,st2)
    box(c,-7,7,-4.1,4,3,1,gr); box(c,3,14,-4.1,4,3,1,gr)
    return c
def m_slime():
    c=[]; g=(90,210,130); g2=(60,170,100); gold=(230,200,80)
    box(c,-7,0,-7,14,12,14,g,"head")
    box(c,-3,2,-3,6,6,6,g2)
    box(c,-5,12,-5,10,2,10,gold)
    box(c,-5,14,-5,2,3,2,gold); box(c,3,14,-5,2,3,2,gold); box(c,-1,14,3,2,3,2,gold)
    return c
def m_drone():
    c=[]; mt=(120,128,145); acc=(255,120,90); dk=(60,66,80)
    box(c,-3,12,-3,6,6,6,mt,"head"); box(c,-2,14,-4,4,2,1,acc,"light")
    box(c,-6,14,-1,2,2,2,dk); box(c,4,14,-1,2,2,2,dk)
    box(c,-1,18,-1,2,2,2,dk)                       # top rotor
    box(c,-7,13,-1,1,1,1,acc); box(c,6,13,-1,1,1,1,acc)
    return c
def m_penguin():
    c=[]; blk=(40,44,54); wht=(238,240,245); org=(240,150,40)
    box(c,-4,2,-3,8,12,6,blk)
    box(c,-3,3,-3.1,6,9,1,wht)
    box(c,-3,13,-3,6,6,6,blk,"head")
    box(c,-1,14,-4,2,2,2,org)
    box(c,-5,4,-2,1,8,4,blk); box(c,4,4,-2,1,8,4,blk)
    box(c,-3,0,-1,3,2,4,org); box(c,0,0,-1,3,2,4,org)
    return c
def m_fox():
    c=[]; org=(220,130,60); wht=(240,238,235); dk=(60,45,35)
    box(c,-3,5,-6,6,6,12,org)
    box(c,-3,7,-12,6,6,6,org,"head")
    box(c,-2,7,-15,4,3,3,wht)
    box(c,-3,13,-11,2,3,2,dk); box(c,1,13,-11,2,3,2,dk)
    for zx in (-3,1):
        box(c,zx,0,-6,2,5,2,dk); box(c,zx,0,2,2,5,2,dk)
    box(c,-2,5,6,4,4,7,org)
    return c
def m_mech():
    c=[]; ds=(70,76,92); st=(120,128,142); acc=(255,200,60)
    box(c,-7,8,-5,14,14,10,ds)
    box(c,-3,22,-3,6,5,6,st,"head"); box(c,-2,24,-4,4,1,1,acc,"light")
    box(c,-11,16,-5,4,6,10,ds); box(c,7,16,-5,4,6,10,ds)
    box(c,-11,18,-9,4,4,5,acc); box(c,7,18,-9,4,4,5,acc)
    box(c,-6,0,-4,5,8,8,st); box(c,1,0,-4,5,8,8,st)
    return c
def m_treant():
    c=[]; br=(110,80,50); br2=(90,64,40); gr=(70,160,80)
    box(c,-4,0,-4,8,16,8,br)
    box(c,-5,15,-5,10,8,10,br2,"head")
    box(c,-9,23,-9,18,8,18,gr)
    box(c,-9,10,-2,5,3,3,br); box(c,4,10,-2,5,3,3,br)
    box(c,-6,0,-5,3,2,3,br2); box(c,3,0,2,3,2,3,br2)
    return c

PRO = [
    ("Mecha Robot", m_robot), ("Caballero", m_knight), ("Mago", m_mage),
    ("Golem", m_golem), ("Rey Slime", m_slime), ("Dron", m_drone),
    ("Pinguino", m_penguin), ("Zorro", m_fox), ("Mech Pesado", m_mech),
    ("Treant", m_treant),
]

# 20 themed creature cubes
CUBE_COLORS = [
    (90,200,130),(80,150,240),(190,120,230),(240,170,70),(230,90,110),
    (70,200,210),(240,220,90),(150,160,175),(120,90,70),(60,70,90),
    (230,130,180),(150,210,90),(90,120,250),(250,140,90),(110,220,160),
    (200,80,80),(80,180,140),(170,170,60),(120,110,200),(200,200,210),
]

# --------------------------------------------------------------------------- write models
def write_model(n, cubes):
    img, aw, ah = pack_and_paint(cubes)
    # bounds
    minx=miny=minz=1e9; maxx=maxy=maxz=-1e9
    geo_cubes=[]
    for c in cubes:
        x,y,z=c["origin"]; w,h,d=c["size"]
        minx=min(minx,x);miny=min(miny,y);minz=min(minz,z)
        maxx=max(maxx,x+w);maxy=max(maxy,y+h);maxz=max(maxz,z+d)
        geo_cubes.append({"origin":[x,y,z],"size":[w,h,d],"uv":c["uv"]})
    geo={
        "format_version":"1.16.0",
        "minecraft:geometry":[{
            "description":{
                "identifier":f"geometry.model_{n}",
                "texture_width":aw,"texture_height":ah,
                "visible_bounds_width":max(maxx-minx,maxz-minz)/16+1,
                "visible_bounds_height":(maxy-miny)/16+1,
                "visible_bounds_offset":[0,(maxy-miny)/32,0],
            },
            "bones":[{"name":"root","pivot":[0,0,0],"cubes":geo_cubes}]
        }]
    }
    folder=os.path.join(MODELS_DIR,f"model-{n}")
    os.makedirs(folder,exist_ok=True)
    with open(os.path.join(folder,"model.json"),"w") as f:
        json.dump(geo,f,indent=2)
    img.save(os.path.join(folder,"texture.png"))

NAMES=[]
for i,(name,fn) in enumerate(PRO, start=1):
    write_model(i, fn()); NAMES.append(name)
for j in range(N_PRO+1, N_MODELS+1):
    col=CUBE_COLORS[(j-N_PRO-1)%len(CUBE_COLORS)]
    cubes=[]; box(cubes,-8,0,-8,16,16,16,col,"head")
    write_model(j,cubes); NAMES.append(f"Cubo Criatura {j-N_PRO}")

# --------------------------------------------------------------------------- client entity + render controller
def write_client_entity():
    textures={f"s{i}":f"textures/entity/custom_npc_{i}" for i in range(8)}
    for n in range(1,N_MODELS+1):
        textures[f"m{n}"]=f"models/entity/model-{n}/texture"
    geometry={"default":"geometry.custom_npc"}
    for n in range(1,N_MODELS+1):
        geometry[f"m{n}"]=f"geometry.model_{n}"
    ce={"format_version":"1.10.0","minecraft:client_entity":{"description":{
        "identifier":"custom:npc",
        "materials":{"default":"entity_alphatest"},
        "textures":textures,"geometry":geometry,
        "scripts":{"animate":["ctrl_main"]},
        "animations":{"ctrl_main":"controller.animation.custom_npc.main",
            "idle":"animation.custom_npc.idle","wave":"animation.custom_npc.wave",
            "nod":"animation.custom_npc.nod","spin":"animation.custom_npc.spin",
            "dance":"animation.custom_npc.dance"},
        "render_controllers":["controller.render.custom_npc"],
        "spawn_egg":{"base_color":"#3B8E35","overlay_color":"#8B4513"}}}}
    with open(os.path.join(RP,"entity","custom_npc.entity.json"),"w") as f:
        json.dump(ce,f,indent=2)

def write_render_controller():
    geos=["Geometry.default"]+[f"Geometry.m{n}" for n in range(1,N_MODELS+1)]
    skins=[f"Texture.s{i}" for i in range(8)]+[f"Texture.m{n}" for n in range(1,N_MODELS+1)]
    rc={"format_version":"1.10.0","render_controllers":{"controller.render.custom_npc":{
        "geometry":"Array.geos[query.property('custom:model')]",
        "materials":[{"*":"Material.default"}],
        "arrays":{"geometries":{"Array.geos":geos},"textures":{"Array.skins":skins}},
        "textures":["Array.skins[query.property('custom:skin')]"]}}}
    with open(os.path.join(RP,"render_controllers","custom_npc.render_controllers.json"),"w") as f:
        json.dump(rc,f,indent=2)

write_client_entity()
write_render_controller()

# emit model names for config.js
with open(os.path.join(ROOT,"_tools","model_names.json"),"w") as f:
    json.dump(NAMES,f,ensure_ascii=False)

print(f"DONE: {N_MODELS} models ({N_PRO} pro + {N_MODELS-N_PRO} cubes), per-model textures.")
print("Skins array length:", 8+N_MODELS, "-> custom:skin range [0,", 8+N_MODELS-1, "]")
print("Names:", NAMES[:N_PRO])
