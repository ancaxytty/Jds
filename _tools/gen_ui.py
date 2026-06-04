#!/usr/bin/env python3
"""Generate a professional 'parchment + stone frame' UI texture pack for the
NPC forms/dialogues (inspired by the Village Elder dialogue reference).

Safe approach: drop-in replacements for vanilla UI textures used by forms.
No JSON-UI overrides (so it can't break form functionality).
Pure standard library.
"""
import struct, zlib, os, random

ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
PACK = os.path.join(ROOT, "ui_theme_pack")
UI = os.path.join(PACK, "textures", "ui")
os.makedirs(UI, exist_ok=True)

class Image:
    def __init__(self, w, h, bg=(0,0,0,0)):
        self.w, self.h = w, h
        self.px = bytearray(bytes(bg) * (w*h))
    def set(self, x, y, c):
        x=int(x); y=int(y)
        if 0<=x<self.w and 0<=y<self.h:
            i=(y*self.w+x)*4
            self.px[i:i+4]=bytes(c if len(c)==4 else (c[0],c[1],c[2],255))
    def get(self,x,y):
        i=(y*self.w+x)*4; return tuple(self.px[i:i+4])
    def fill(self,x,y,w,h,c):
        for yy in range(int(y),int(y+h)):
            for xx in range(int(x),int(x+w)): self.set(xx,yy,c)
    def rectframe(self,x,y,w,h,c,t=1):
        for i in range(t):
            self.fill(x+i,y+i,w-2*i,1,c); self.fill(x+i,y+h-1-i,w-2*i,1,c)
            self.fill(x+i,y+i,1,h-2*i,c); self.fill(x+w-1-i,y+i,1,h-2*i,c)
    def save(self,path):
        raw=bytearray()
        for y in range(self.h):
            raw.append(0); raw+=self.px[y*self.w*4:(y+1)*self.w*4]
        def chunk(t,d): return struct.pack(">I",len(d))+t+d+struct.pack(">I",zlib.crc32(t+d)&0xffffffff)
        with open(path,"wb") as f:
            f.write(b"\x89PNG\r\n\x1a\n")
            f.write(chunk(b"IHDR",struct.pack(">IIBBBBB",self.w,self.h,8,6,0,0,0)))
            f.write(chunk(b"IDAT",zlib.compress(bytes(raw),9)))
            f.write(chunk(b"IEND",b""))

def shade(c,f): return tuple(min(255,max(0,int(v*f))) for v in c[:3])

def parchment_panel(path, w=160, h=160, dark=False):
    img=Image(w,h)
    base=(222,202,158) if not dark else (200,180,138)
    rnd=random.Random(42)
    # parchment fill with soft mottling
    for y in range(h):
        for x in range(w):
            n=rnd.randint(-10,10)
            # radial darkening toward edges
            dx=(x-w/2)/(w/2); dy=(y-h/2)/(h/2)
            v=1-(dx*dx+dy*dy)*0.12
            c=shade(base, v)
            img.set(x,y,(min(255,c[0]+n),min(255,c[1]+n),min(255,c[2]+n),255))
    # a few faint ink stains
    for _ in range(5):
        sx=rnd.randint(10,w-10); sy=rnd.randint(10,h-10); r=rnd.randint(2,5)
        for yy in range(-r,r):
            for xx in range(-r,r):
                if xx*xx+yy*yy<=r*r and rnd.random()<0.5:
                    img.set(sx+xx,sy+yy, shade(base,0.82)+(255,))
    # stone frame border (like the reference)
    stone=(120,124,132); stoneD=(86,90,98); stoneL=(160,164,172)
    bt=10
    img.rectframe(0,0,w,h,stoneD,1)
    for i in range(1,bt):
        col = stoneL if i in (2,3) else stone
        img.rectframe(i,i,w-2*i,h-2*i,col,1)
    img.rectframe(bt,bt,w-2*bt,h-2*bt,(70,52,30),1)   # inner parchment edge
    # rivets in corners
    for (cx,cy) in [(5,5),(w-6,5),(5,h-6),(w-6,h-6)]:
        img.fill(cx-1,cy-1,3,3,stoneD); img.set(cx,cy,stoneL)
    img.save(path); print("wrote",path)

def wood_button(path, base, w=48, h=20):
    img=Image(w,h)
    top=shade(base,1.18); bot=shade(base,0.74); edge=shade(base,0.5); hi=shade(base,1.35)
    for y in range(h):
        t=y/(h-1); img.fill(0,y,w,1, shade(base,1.12-0.4*t))
    # wood grain lines
    rnd=random.Random(7)
    for _ in range(w//3):
        gx=rnd.randint(2,w-3); img.fill(gx,2,1,h-4, shade(base,0.9))
    img.rectframe(0,0,w,h,edge,2)
    img.fill(2,2,w-4,2,hi)         # top highlight
    img.fill(2,h-3,w-4,1,bot)      # bottom shadow
    # corner studs
    for (cx,cy) in [(3,3),(w-4,3),(3,h-4),(w-4,h-4)]:
        img.fill(cx-1,cy-1,2,2,(60,48,30))
    img.save(path); print("wrote",path)

def scroll_icon(path, n=128):
    img=Image(n,n)
    # background transparent; draw a parchment scroll
    base=(224,204,160)
    img.fill(n*0.18, n*0.16, n*0.64, n*0.68, base)
    img.rectframe(int(n*0.18),int(n*0.16),int(n*0.64),int(n*0.68),(120,90,50),3)
    # rolled ends
    for yy in (int(n*0.12), int(n*0.80)):
        img.fill(n*0.14, yy, n*0.72, n*0.08, (150,110,60))
        img.rectframe(int(n*0.14),yy,int(n*0.72),int(n*0.08),(100,72,40),2)
    # text lines
    for i in range(5):
        img.fill(n*0.26, n*0.28+i*n*0.09, n*0.48, max(2,n//40), (110,84,52))
    # a green check / quill accent
    img.fill(n*0.62,n*0.5,n*0.04,n*0.18,(74,140,60))
    img.save(path); print("wrote",path)

# Parchment backgrounds (replace common form panel textures)
parchment_panel(os.path.join(UI,"dialog_background_opaque.png"))
parchment_panel(os.path.join(UI,"dialog_background_opaque_dark.png"), dark=True)

# Wood buttons (replace borderless light button states used by forms)
wood_button(os.path.join(UI,"button_borderless_light.png"), (150,108,60))
wood_button(os.path.join(UI,"button_borderless_lighthover.png"), (176,130,74))
wood_button(os.path.join(UI,"button_borderless_lightpressed.png"), (120,86,46))

# pack icon
scroll_icon(os.path.join(PACK,"pack_icon.png"))

print("DONE UI theme textures")
