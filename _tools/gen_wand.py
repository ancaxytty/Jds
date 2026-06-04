#!/usr/bin/env python3
"""Generate the 3D NPC Wand: geometry (model.json), 3D box-UV texture, and a
16x16 inventory icon. Pure standard library."""
import struct, zlib, os, json

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RP = os.path.join(ROOT, "custom_npc_addon", "resource_pack")
os.makedirs(os.path.join(RP, "models", "entity"), exist_ok=True)
os.makedirs(os.path.join(RP, "textures", "entity"), exist_ok=True)
os.makedirs(os.path.join(RP, "textures", "items"), exist_ok=True)

class Image:
    def __init__(s,w,h,bg=(0,0,0,0)): s.w,s.h=w,h; s.px=bytearray(bytes(bg)*(w*h))
    def set(s,x,y,c):
        x=int(x);y=int(y)
        if 0<=x<s.w and 0<=y<s.h:
            i=(y*s.w+x)*4; s.px[i:i+4]=bytes(c if len(c)==4 else (c[0],c[1],c[2],255))
    def fill(s,x,y,w,h,c):
        for yy in range(int(y),int(y+h)):
            for xx in range(int(x),int(x+w)): s.set(xx,yy,c)
    def save(s,p):
        raw=bytearray()
        for y in range(s.h): raw.append(0); raw+=s.px[y*s.w*4:(y+1)*s.w*4]
        def ch(t,d): return struct.pack(">I",len(d))+t+d+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
        open(p,"wb").write(b"\x89PNG\r\n\x1a\n"+ch(b"IHDR",struct.pack(">IIBBBBB",s.w,s.h,8,6,0,0,0))+ch(b"IDAT",zlib.compress(bytes(raw),9))+ch(b"IEND",b""))

def shd(c,f): return tuple(min(255,max(0,int(v*f))) for v in c[:3])

# wand cubes: handle, gold ring, gem, two small prongs
CUBES=[
    {"o":[-1,0,-1],"s":[2,12,2],"c":(120,86,52),"role":"wood"},   # handle
    {"o":[-2,10,-2],"s":[4,2,4],"c":(230,200,80),"role":"metal"}, # gold ring
    {"o":[-2,12,-2],"s":[4,4,4],"c":(95,215,245),"role":"gem"},   # gem
    {"o":[-3,13,-1],"s":[2,2,2],"c":(230,200,80),"role":"metal"}, # prong L
    {"o":[1,13,-1],"s":[2,2,2],"c":(230,200,80),"role":"metal"},  # prong R
]

def pack(cubes,pad=2):
    foot=[(2*(c["s"][2]+c["s"][0]),c["s"][2]+c["s"][1]) for c in cubes]
    aw=max(16,max(f[0] for f in foot)+pad*2)
    if aw%2: aw+=1
    x=pad;y=pad;shelf=0;place=[]
    for bw,bh in foot:
        if x+bw+pad>aw: y+=shelf+pad; x=pad; shelf=0
        place.append((x,y)); x+=bw+pad; shelf=max(shelf,bh)
    ah=y+shelf+pad
    if ah%2: ah+=1
    img=Image(aw,ah)
    for c,(u,v) in zip(cubes,place):
        paint(img,u,v,c); c["uv"]=[u,v]
    return img,aw,ah

def paint(img,u,v,c):
    w,h,d=c["s"]; col=c["c"]; role=c.get("role"); edge=shd(col,0.45)
    faces=[(u+d,v,w,d,shd(col,1.25)),(u+d+w,v,w,d,shd(col,0.55)),
           (u,v+d,d,h,shd(col,0.85)),(u+d,v+d,w,h,col),
           (u+d+w,v+d,d,h,shd(col,0.85)),(u+d+w+d,v+d,w,h,shd(col,0.72))]
    for fx,fy,fw,fh,fc in faces:
        img.fill(fx,fy,fw,fh,fc)
        for i in range(int(fw)): img.set(fx+i,fy,edge); img.set(fx+i,fy+fh-1,shd(edge,1.3))
        for i in range(int(fh)): img.set(fx,fy+i,edge); img.set(fx+fw-1,fy+i,shd(edge,1.3))
    if role=="gem":
        fx,fy=u+d,v+d
        for yy in range(1,h-1):
            for xx in range(1,w-1): img.set(fx+xx,fy+yy,shd(col,1.4))
        img.set(fx+w//2,fy+h//2,(255,255,255))
    if role=="wood":
        fx,fy=u+d,v+d
        for gx in range(0,w,1):
            if gx%2==0: img.fill(fx+gx,fy,1,h,shd(col,0.85))

img,aw,ah=pack(CUBES)
geo={"format_version":"1.16.0","minecraft:geometry":[{
    "description":{"identifier":"geometry.npc_wand","texture_width":aw,"texture_height":ah,
        "visible_bounds_width":2,"visible_bounds_height":3,"visible_bounds_offset":[0,1,0]},
    "bones":[{"name":"root","pivot":[0,0,0],"rotation":[0,0,0],
        "cubes":[{"origin":c["o"],"size":c["s"],"uv":c["uv"]} for c in CUBES]}]}]}
json.dump(geo,open(os.path.join(RP,"models","entity","npc_wand.geo.json"),"w"),indent=2)
img.save(os.path.join(RP,"textures","entity","npc_wand.png"))

# 16x16 inventory icon: a little wand diagonal with a gem
icon=Image(16,16)
wood=(120,86,52); gold=(230,200,80); gem=(95,215,245)
for i in range(10):  # diagonal handle
    icon.set(3+i,12-i,wood); icon.set(4+i,12-i,shd(wood,0.8))
icon.fill(11,1,4,4,gem); icon.set(12,2,(255,255,255)); icon.fill(11,5,4,1,gold)
for x in range(16):
    for y in range(16):
        pass
icon.save(os.path.join(RP,"textures","items","npc_wand.png"))
print("wand geo+texture:",aw,"x",ah,"icon 16x16 -> done")
