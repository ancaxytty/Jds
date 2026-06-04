#!/usr/bin/env python3
"""Generate 30 PROFESSIONAL multi-cube 3D models, each with its own detailed
texture (gradient shading + accents), plus a professional pack_icon.
Rebuilds client entity + render controller. Pure standard library.
"""
import struct, zlib, os, json, random, math

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
RP = os.path.join(ROOT, "custom_npc_addon", "resource_pack")
BP = os.path.join(ROOT, "custom_npc_addon", "behavior_pack")
MODELS_DIR = os.path.join(RP, "models", "entity")
os.makedirs(MODELS_DIR, exist_ok=True)
N_MODELS = 30

class Image:
    def __init__(s, w, h, bg=(0,0,0,0)):
        s.w, s.h = w, h; s.px = bytearray(bytes(bg)*(w*h))
    def set(s, x, y, c):
        x=int(x); y=int(y)
        if 0<=x<s.w and 0<=y<s.h:
            i=(y*s.w+x)*4; s.px[i:i+4]=bytes(c if len(c)==4 else (c[0],c[1],c[2],255))
    def fill(s,x,y,w,h,c):
        for yy in range(int(y),int(y+h)):
            for xx in range(int(x),int(x+w)): s.set(xx,yy,c)
    def save(s,path):
        raw=bytearray()
        for y in range(s.h):
            raw.append(0); raw+=s.px[y*s.w*4:(y+1)*s.w*4]
        def ch(t,d): return struct.pack(">I",len(d))+t+d+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
        with open(path,"wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            f.write(ch(b"IHDR",struct.pack(">IIBBBBB",s.w,s.h,8,6,0,0,0)))
            f.write(ch(b"IDAT",zlib.compress(bytes(raw),9))); f.write(ch(b"IEND",b""))

def sh(c,f): return tuple(min(255,max(0,int(v*f))) for v in c[:3])
def lerp(a,b,t): return tuple(int(a[i]+(b[i]-a[i])*t) for i in range(3))

def box(cubes,x,y,z,w,h,d,color,role=None):
    w,h,d=int(round(w)),int(round(h)),int(round(d))
    if w<=0 or h<=0 or d<=0: return
    cubes.append({"origin":[x,y,z],"size":[w,h,d],"color":tuple(color),"role":role})

def pack_and_paint(cubes,pad=2):
    foot=[(2*(c["size"][2]+c["size"][0]), c["size"][2]+c["size"][1]) for c in cubes]
    aw=max(16,max(f[0] for f in foot)+pad*2)
    if aw%2: aw+=1
    x=pad;y=pad;shelf=0;place=[]
    for (bw,bh) in foot:
        if x+bw+pad>aw: y+=shelf+pad; x=pad; shelf=0
        place.append((x,y)); x+=bw+pad; shelf=max(shelf,bh)
    ah=y+shelf+pad
    if ah%2: ah+=1
    img=Image(aw,ah)
    for c,(u,v) in zip(cubes,place):
        paint_box(img,u,v,c); c["uv"]=[u,v]
    return img,aw,ah

def vgrad(img,x,y,w,h,ctop,cbot):
    for i in range(int(h)):
        t=i/max(1,h-1); img.fill(x,y+i,w,1,lerp(ctop,cbot,t))

def paint_box(img,u,v,c):
    w,h,d=c["size"]; col=c["color"]; role=c.get("role")
    edge=sh(col,0.45)
    vgrad(img,u+d,v,w,d, sh(col,1.32), sh(col,1.12))
    img.fill(u+d+w,v,w,d, sh(col,0.5))
    vgrad(img,u,v+d,d,h, sh(col,1.0), sh(col,0.7))
    vgrad(img,u+d+w,v+d,d,h, sh(col,0.95), sh(col,0.66))
    vgrad(img,u+d,v+d,w,h, sh(col,1.18), sh(col,0.82))
    vgrad(img,u+d+w+d,v+d,w,h, sh(col,0.86), sh(col,0.6))
    for (fx,fy,fw,fh) in [(u+d,v,w,d),(u+d+w,v,w,d),(u,v+d,d,h),(u+d,v+d,w,h),(u+d+w,v+d,d,h),(u+d+w+d,v+d,w,h)]:
        for i in range(int(fw)):
            img.set(fx+i,fy,edge); img.set(fx+i,fy+fh-1,sh(edge,1.3))
        for i in range(int(fh)):
            img.set(fx,fy+i,edge); img.set(fx+fw-1,fy+i,sh(edge,1.3))
    fx,fy=u+d,v+d
    if role=="head":
        ew=max(1,w//6); eo=max(1,w//6); ey=max(1,h//2-h//6)
        img.fill(fx+eo,fy+ey,ew,ew,(245,245,250)); img.fill(fx+w-eo-ew,fy+ey,ew,ew,(245,245,250))
        img.set(fx+eo+ew-1,fy+ey+ew-1,(15,18,32)); img.set(fx+w-eo-ew,fy+ey+ew-1,(15,18,32))
        img.fill(fx,fy,w,1,sh(col,0.7))
    elif role=="glow":
        for yy in range(1,h-1):
            for xx in range(1,w-1): img.set(fx+xx,fy+yy, sh(col,1.5))
        img.set(fx+max(0,w//2),fy+max(0,h//2),(255,255,255))
    elif role=="gem":
        img.fill(fx+1,fy+1,max(1,w-2),max(1,h-2),sh(col,1.4)); img.set(fx+1,fy+1,(255,255,255))
    elif role=="metal":
        for yy in range(0,h,2): img.fill(fx,fy+yy,w,1,sh(col,1.12))
    elif role=="wood":
        rnd=random.Random(u*7+v)
        for _ in range(max(1,w//3)):
            gx=rnd.randint(0,max(0,w-1)); img.fill(fx+gx,fy,1,h,sh(col,0.86))

def humanoid(skin,shirt,pants,hair):
    c=[]
    box(c,-4,20,-4,8,8,8,skin,"head"); box(c,-4,26,-4,8,3,8,hair)
    box(c,-4,8,-2,8,12,4,shirt)
    box(c,-6,8,-2,2,11,4,shirt); box(c,4,8,-2,2,11,4,shirt)
    box(c,-6,8,-2,2,3,4,skin); box(c,4,8,-2,2,3,4,skin)
    box(c,-4,0,-2,3,8,4,pants); box(c,1,0,-2,3,8,4,pants)
    return c

def quad(body,head_c,legs,tail=None,ears=None):
    c=[]
    box(c,-3,5,-7,6,6,12,body); box(c,-3,6,-12,6,6,6,head_c,"head")
    for zx in (-3,1):
        box(c,zx,0,-6,2,5,2,legs); box(c,zx,0,2,2,5,2,legs)
    if tail: box(c,-1,7,5,2,2,6,tail)
    if ears: box(c,-3,12,-11,2,3,2,ears); box(c,1,12,-11,2,3,2,ears)
    return c

def d1():
    c=humanoid((150,160,178),(70,80,110),(40,45,60),(58,64,82))
    box(c,-3,23,-5,6,2,1,(56,189,248),"glow"); box(c,-2,13,-3,4,4,1,(56,189,248),"glow")
    box(c,-8,18,-3,4,3,6,(56,189,248)); box(c,4,18,-3,4,3,6,(56,189,248)); return c
def d2():
    c=humanoid((224,178,138),(120,128,142),(90,95,105),(120,128,142))
    box(c,-1,28,-2,2,4,6,(170,40,50)); box(c,-8,17,-4,4,4,8,(150,155,165)); box(c,4,17,-4,4,4,8,(150,155,165))
    box(c,7,2,-1,2,16,2,(210,215,225),"metal"); return c
def d3():
    c=humanoid((230,200,170),(120,70,170),(95,55,135),(120,70,170))
    box(c,-3,28,-3,6,3,6,(120,70,170)); box(c,-2,31,-2,4,3,4,(120,70,170)); box(c,-1,34,-1,2,3,2,(120,70,170))
    box(c,7,0,-1,2,26,2,(110,80,50),"wood"); box(c,5,25,-3,5,5,5,(120,220,255),"glow"); return c
def d4():
    c=[]; box(c,-4,18,-4,8,9,8,(140,140,152),"head"); box(c,-7,6,-4,14,14,8,(120,120,132))
    box(c,-12,4,-3,5,16,6,(140,140,152)); box(c,7,4,-3,5,16,6,(140,140,152))
    box(c,-5,0,-3,5,6,6,(120,120,132)); box(c,0,0,-3,5,6,6,(120,120,132))
    box(c,-3,14,-4,6,3,1,(90,170,90),"glow"); return c
def d5():
    c=[]; box(c,-7,0,-7,14,12,14,(90,210,130),"head"); box(c,-3,2,-3,6,6,6,(60,170,100))
    box(c,-5,12,-5,10,2,10,(230,200,80),"gem"); box(c,-5,14,-5,2,3,2,(230,200,80))
    box(c,3,14,-5,2,3,2,(230,200,80)); box(c,-1,14,3,2,3,2,(230,200,80)); return c
def d6():
    c=[]; box(c,-3,12,-3,6,6,6,(120,128,145),"head"); box(c,-2,14,-4,4,2,1,(255,120,90),"glow")
    box(c,-6,14,-1,2,2,2,(60,66,80)); box(c,4,14,-1,2,2,2,(60,66,80)); box(c,-1,18,-1,2,2,2,(60,66,80)); return c
def d7():
    c=[]; box(c,-4,2,-3,8,12,6,(40,44,54)); box(c,-3,3,-3,6,9,1,(238,240,245))
    box(c,-3,13,-3,6,6,6,(40,44,54),"head"); box(c,-1,14,-4,2,2,2,(240,150,40))
    box(c,-5,4,-2,1,8,4,(40,44,54)); box(c,4,4,-2,1,8,4,(40,44,54))
    box(c,-3,0,-1,3,2,4,(240,150,40)); box(c,0,0,-1,3,2,4,(240,150,40)); return c
def d8(): return quad((220,130,60),(220,130,60),(60,45,35),tail=(240,238,235),ears=(60,45,35))
def d9():
    c=[]; box(c,-7,8,-5,14,14,10,(70,76,92)); box(c,-3,22,-3,6,5,6,(120,128,142),"head")
    box(c,-2,24,-4,4,1,1,(255,200,60),"glow"); box(c,-11,16,-5,4,6,10,(70,76,92)); box(c,7,16,-5,4,6,10,(70,76,92))
    box(c,-6,0,-4,5,8,8,(120,128,142)); box(c,1,0,-4,5,8,8,(120,128,142)); return c
def d10():
    c=[]; box(c,-4,0,-4,8,16,8,(110,80,50),"wood"); box(c,-5,15,-5,10,8,10,(90,64,40),"head")
    box(c,-9,23,-9,18,8,18,(70,160,80)); box(c,-9,10,-2,5,3,3,(110,80,50)); box(c,4,10,-2,5,3,3,(110,80,50)); return c
def d11():
    c=[]; box(c,-3,6,-3,6,6,10,(150,60,70)); box(c,-3,8,-9,6,6,6,(170,70,80),"head"); box(c,-2,8,-12,4,2,3,(120,40,50))
    box(c,-9,9,-1,6,1,8,(120,40,50)); box(c,3,9,-1,6,1,8,(120,40,50)); box(c,-2,3,5,4,4,8,(150,60,70))
    for zx in (-3,1): box(c,zx,0,-2,2,6,2,(120,40,50)); box(c,zx,0,3,2,6,2,(120,40,50))
    box(c,-2,14,-10,1,2,1,(240,220,80)); box(c,1,14,-10,1,2,1,(240,220,80)); return c
def d12():
    c=humanoid((225,225,220),(60,64,78),(60,64,78),(225,225,220))
    box(c,-5,28,-5,10,3,10,(230,200,80),"gem"); box(c,-5,31,-5,2,3,2,(230,200,80))
    box(c,3,31,-5,2,3,2,(230,200,80)); box(c,-1,31,-5,2,3,2,(230,200,80)); return c
def d13():
    c=humanoid((220,175,135),(35,38,48),(25,27,34),(20,20,24))
    box(c,-4,22,-4,8,2,1,(220,40,60)); box(c,7,4,-1,1,14,2,(180,185,195),"metal"); return c
def d14():
    c=humanoid((180,170,200),(50,40,80),(35,28,60),(50,40,80))
    box(c,-3,28,-3,6,3,6,(50,40,80)); box(c,-1,31,-1,2,5,2,(50,40,80))
    box(c,7,0,-1,2,28,2,(40,30,60),"wood"); box(c,5,27,-3,5,5,5,(180,80,220),"glow"); return c
def d15():
    c=humanoid((235,200,90),(210,175,70),(180,150,60),(235,200,90))
    box(c,-3,23,-5,6,2,1,(120,255,200),"glow"); box(c,-2,13,-3,4,4,1,(120,255,200),"glow"); return c
def d16(): return quad((110,80,55),(120,88,60),(80,58,40),ears=(80,58,40))
def d17(): return quad((90,92,100),(95,97,105),(70,72,80),tail=(90,92,100),ears=(70,72,80))
def d18():
    c=humanoid((190,60,60),(120,30,30),(80,20,20),(60,15,15))
    box(c,-4,28,-4,1,3,1,(40,10,10)); box(c,3,28,-4,1,3,1,(40,10,10)); box(c,-2,8,-6,4,1,6,(120,30,30)); return c
def d19():
    c=humanoid((240,225,205),(240,240,245),(220,220,230),(245,230,120))
    box(c,-1,29,-2,2,1,2,(245,230,120),"gem"); box(c,-9,10,0,6,1,8,(255,255,255)); box(c,3,10,0,6,1,8,(255,255,255)); return c
def d20():
    c=humanoid((220,178,140),(120,50,50),(50,40,35),(40,30,25))
    box(c,-4,27,-4,8,2,8,(30,30,35)); box(c,-4,29,-2,8,2,4,(30,30,35)); box(c,-3,23,-5,2,2,1,(20,20,24)); return c
def d21():
    c=humanoid((230,235,240),(230,235,240),(210,215,225),(230,235,240))
    box(c,-4,20,-4,8,8,8,(60,66,80),"head"); box(c,-3,22,-5,6,4,1,(120,220,255),"glow"); box(c,-5,9,2,10,8,3,(200,205,215)); return c
def d22():
    c=humanoid((224,178,138),(150,40,50),(40,40,50),(30,25,22))
    box(c,-5,27,-5,10,2,10,(30,30,38)); box(c,-1,29,-1,2,4,2,(200,170,60))
    box(c,-8,17,-4,4,3,8,(120,30,40)); box(c,4,17,-4,4,3,8,(120,30,40)); box(c,7,2,-1,1,16,2,(210,215,225),"metal"); return c
def d23():
    c=[]; box(c,-4,8,-3,8,10,6,(240,200,60)); box(c,-4,10,-3,8,2,6,(40,40,40)); box(c,-4,14,-3,8,2,6,(40,40,40))
    box(c,-3,18,-3,6,6,6,(40,40,40),"head"); box(c,-2,24,-2,1,3,1,(40,40,40)); box(c,1,24,-2,1,3,1,(40,40,40))
    box(c,-9,15,0,6,1,7,(220,240,255)); box(c,3,15,0,6,1,7,(220,240,255)); box(c,-2,26,-3,4,2,4,(240,200,60),"gem"); return c
def d24(): return quad((130,135,145),(140,145,155),(90,94,104),tail=(130,135,145),ears=(90,94,104))
def d25():
    c=[]; box(c,-4,4,-4,8,12,8,(120,210,230),"gem"); box(c,-3,16,-3,6,6,6,(150,230,250),"head")
    box(c,-2,22,-2,4,5,4,(150,230,250),"gem"); box(c,-6,8,-2,2,8,4,(120,210,230)); box(c,4,8,-2,2,8,4,(120,210,230)); return c
def d26():
    c=quad((100,150,90),(120,170,100),(80,120,70)); box(c,-5,9,-6,10,5,11,(80,110,60),"gem"); return c
def d27():
    c=[]; box(c,-3,0,-3,6,9,6,(235,225,205)); box(c,-6,8,-6,12,6,12,(210,70,70))
    box(c,-4,9,-4,2,2,2,(245,245,245)); box(c,2,9,-4,2,2,2,(245,245,245)); box(c,-1,9,2,2,2,2,(245,245,245))
    box(c,-2,3,-4,1,1,1,(40,30,30)); box(c,1,3,-4,1,1,1,(40,30,30)); return c
def d28():
    c=[]; box(c,-4,6,-4,8,10,8,(225,230,245),"head"); box(c,-4,2,-4,3,4,8,(210,216,235)); box(c,1,2,-4,3,4,8,(210,216,235))
    box(c,-3,9,-5,2,2,1,(40,60,120),"glow"); box(c,1,9,-5,2,2,1,(40,60,120),"glow"); return c
def d29():
    c=humanoid((110,116,128),(96,102,114),(80,86,98),(96,102,114))
    box(c,-4,28,-4,1,2,1,(70,76,88)); box(c,3,28,-4,1,2,1,(70,76,88))
    box(c,-9,11,0,6,1,7,(96,102,114)); box(c,3,11,0,6,1,7,(96,102,114)); return c
def d30():
    c=humanoid((235,200,150),(180,40,50),(200,165,60),(40,30,25))
    box(c,-5,28,-5,10,3,10,(240,210,80),"gem"); box(c,-5,31,-5,2,3,2,(240,210,80))
    box(c,3,31,-5,2,3,2,(240,210,80)); box(c,-1,31,-5,2,3,2,(240,210,80))
    box(c,-5,8,-3,10,12,5,(180,40,50)); box(c,-4,9,-3,8,10,1,(240,210,80),"gem"); return c

BUILDERS=[d1,d2,d3,d4,d5,d6,d7,d8,d9,d10,d11,d12,d13,d14,d15,d16,d17,d18,d19,d20,d21,d22,d23,d24,d25,d26,d27,d28,d29,d30]
NAMES=["Mecha Robot","Caballero","Mago","Golem","Rey Slime","Dron","Pinguino","Zorro","Mech Pesado","Treant",
       "Dragon","Esqueleto Rey","Ninja","Mago Oscuro","Robot Dorado","Oso","Gato","Demonio","Angel","Pirata",
       "Astronauta","Samurai","Reina Abeja","Lobo","Cristal Viviente","Tortuga","Hongo","Fantasma","Gargola","Rey Dorado"]

def write_model(n,cubes):
    img,aw,ah=pack_and_paint(cubes)
    minx=miny=minz=1e9;maxx=maxy=maxz=-1e9; gc=[]
    for c in cubes:
        x,y,z=c["origin"]; w,h,d=c["size"]
        minx=min(minx,x);miny=min(miny,y);minz=min(minz,z)
        maxx=max(maxx,x+w);maxy=max(maxy,y+h);maxz=max(maxz,z+d)
        gc.append({"origin":[x,y,z],"size":[w,h,d],"uv":c["uv"]})
    geo={"format_version":"1.16.0","minecraft:geometry":[{
        "description":{"identifier":f"geometry.model_{n}","texture_width":aw,"texture_height":ah,
            "visible_bounds_width":max(maxx-minx,maxz-minz)/16+1,"visible_bounds_height":(maxy-miny)/16+1,
            "visible_bounds_offset":[0,(maxy-miny)/32,0]},
        "bones":[{"name":"root","pivot":[0,0,0],"cubes":gc}]}]}
    folder=os.path.join(MODELS_DIR,f"model-{n}"); os.makedirs(folder,exist_ok=True)
    with open(os.path.join(folder,"model.json"),"w") as f: json.dump(geo,f,indent=2)
    img.save(os.path.join(folder,"texture.png"))

for i,b in enumerate(BUILDERS,start=1): write_model(i,b())

def write_client_entity():
    textures={f"s{i}":f"textures/entity/custom_npc_{i}" for i in range(8)}
    for n in range(1,N_MODELS+1): textures[f"m{n}"]=f"models/entity/model-{n}/texture"
    geometry={"default":"geometry.custom_npc"}
    for n in range(1,N_MODELS+1): geometry[f"m{n}"]=f"geometry.model_{n}"
    ce={"format_version":"1.10.0","minecraft:client_entity":{"description":{
        "identifier":"custom:npc","materials":{"default":"entity_alphatest"},
        "textures":textures,"geometry":geometry,"scripts":{"animate":["ctrl_main"]},
        "animations":{"ctrl_main":"controller.animation.custom_npc.main","idle":"animation.custom_npc.idle",
            "wave":"animation.custom_npc.wave","nod":"animation.custom_npc.nod","spin":"animation.custom_npc.spin",
            "dance":"animation.custom_npc.dance"},
        "render_controllers":["controller.render.custom_npc"],
        "spawn_egg":{"base_color":"#3B8E35","overlay_color":"#8B4513"}}}}
    with open(os.path.join(RP,"entity","custom_npc.entity.json"),"w") as f: json.dump(ce,f,indent=2)

def write_render_controller():
    geos=["Geometry.default"]+[f"Geometry.m{n}" for n in range(1,N_MODELS+1)]
    skins=[f"Texture.s{i}" for i in range(8)]+[f"Texture.m{n}" for n in range(1,N_MODELS+1)]
    rc={"format_version":"1.10.0","render_controllers":{"controller.render.custom_npc":{
        "geometry":"Array.geos[query.property('custom:model')]","materials":[{"*":"Material.default"}],
        "arrays":{"geometries":{"Array.geos":geos},"textures":{"Array.skins":skins}},
        "textures":["Array.skins[query.property('custom:skin')]"]}}}
    with open(os.path.join(RP,"render_controllers","custom_npc.render_controllers.json"),"w") as f: json.dump(rc,f,indent=2)

def pack_icon(path,n=256):
    img=Image(n,n)
    for y in range(n):
        t=y/(n-1); base=lerp((40,120,200),(20,24,60),t)
        for x in range(n):
            dx=(x-n/2)/(n/2); dy=(y-n*0.42)/(n/2); vg=max(0.0,1-(dx*dx+dy*dy)*0.5)
            img.set(x,y, sh(base,0.55+0.45*vg))
    cx,cy,s=n//2,int(n*0.42),52
    def quadf(pts,c):
        ys=[p[1] for p in pts]; y0,y1=int(min(ys)),int(max(ys))
        for y in range(y0,y1+1):
            xs=[]
            for i in range(4):
                ax,ay=pts[i];bx,by=pts[(i+1)%4]
                if (ay<=y<by) or (by<=y<ay): xs.append(ax+(bx-ax)*(y-ay)/(by-ay))
            xs.sort()
            for i in range(0,len(xs)-1,2):
                for x in range(int(xs[i]),int(xs[i+1])+1): img.set(x,y,c)
    skin=(224,178,138)
    quadf([(cx,cy-s),(cx+s,cy-s//2),(cx,cy),(cx-s,cy-s//2)],sh(skin,1.25))
    quadf([(cx-s,cy-s//2),(cx,cy),(cx,cy+s),(cx-s,cy+s//2)],sh(skin,0.78))
    quadf([(cx,cy),(cx+s,cy-s//2),(cx+s,cy+s//2),(cx,cy+s)],sh(skin,1.0))
    img.fill(cx+14,cy+2,10,12,(245,245,250)); img.fill(cx+30,cy-4,10,12,(245,245,250))
    img.fill(cx+18,cy+6,5,6,(40,60,140)); img.fill(cx+34,cy,5,6,(40,60,140))
    gx,gy,gr=n//2,int(n*0.78),26
    for a in range(0,360,45):
        rad=math.radians(a); img.fill(gx+int(math.cos(rad)*gr)-5,gy+int(math.sin(rad)*gr)-5,10,10,(80,200,140))
    for yy in range(-gr,gr):
        for xx in range(-gr,gr):
            if xx*xx+yy*yy<=gr*gr: img.set(gx+xx,gy+yy,(70,180,120))
    for yy in range(-10,10):
        for xx in range(-10,10):
            if xx*xx+yy*yy<=100: img.set(gx+xx,gy+yy,(20,30,50))
    for (sxp,syp,sr) in [(n*0.2,n*0.2,3),(n*0.82,n*0.26,4),(n*0.8,n*0.7,3),(n*0.18,n*0.66,2)]:
        for dd in range(-sr,sr+1):
            img.set(sxp+dd,syp,(255,255,255)); img.set(sxp,syp+dd,(255,255,255))
    for i in range(4):
        col=(230,210,150) if i in (1,2) else (120,90,50)
        img.fill(i,i,n-2*i,1,col); img.fill(i,n-1-i,n-2*i,1,col)
        img.fill(i,i,1,n-2*i,col); img.fill(n-1-i,i,1,n-2*i,col)
    img.save(path); print("wrote",path)

write_client_entity(); write_render_controller()
pack_icon(os.path.join(BP,"pack_icon.png")); pack_icon(os.path.join(RP,"pack_icon.png"))
with open(os.path.join(ROOT,"_tools","model_names.json"),"w") as f: json.dump(NAMES,f,ensure_ascii=False)
print(f"DONE: {N_MODELS} pro models + per-model textures + pro pack_icon")
print("Names:",NAMES)
