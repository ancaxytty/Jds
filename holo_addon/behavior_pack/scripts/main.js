// =====================================================================
//  Floating Holograms Pro  -  main entry point
//  by Kiro  -  v1.0.0
//
//  - Use the Hologram Projector (holo:projector) -> opens the custom
//    textured 3x3 grid hub (create / list / quick edit looked-at holo).
//  - Use the Hologram Wand (holo:wand) aiming at a hologram -> instant editor.
//  - Tap a hologram entity -> opens its editor.
//  - "!holo" in chat gives the items + help.
//  - Editable 3D particle auras + animated floating text per hologram.
// =====================================================================
import { world, system } from "@minecraft/server";
import { HOLO_ID, PROJECTOR_ID, WAND_ID, DP, PATTERNS, ANIMS } from "./config.js";
import { openHub, openWandEditor, editorMenu } from "./ui.js";
import * as Holo from "./holo.js";
import { isValid } from "./util.js";

// ---------------------------------------------------------------------
// Item use: projector opens hub, wand edits the looked-at hologram.
// ---------------------------------------------------------------------
world.afterEvents.itemUse.subscribe((ev) => {
  const { source, itemStack } = ev;
  if (!source || !itemStack) return;
  if (itemStack.typeId === PROJECTOR_ID) {
    system.run(() => openHub(source).catch((e) => console.warn("[Holo] " + e)));
  } else if (itemStack.typeId === WAND_ID) {
    system.run(() => openWandEditor(source));
  }
});

// ---------------------------------------------------------------------
// Tap a hologram entity -> open its editor (wand not required).
// ---------------------------------------------------------------------
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target } = ev;
  if (!target || target.typeId !== HOLO_ID) return;
  system.run(() => editorMenu(player, target).catch((e) => console.warn("[Holo] " + e)));
});

// ---------------------------------------------------------------------
// Chat helper: "!holo" gives items + quick guide.
// ---------------------------------------------------------------------
world.beforeEvents.chatSend.subscribe((ev) => {
  const m = ev.message.trim().toLowerCase();
  if (m !== "!holo" && m !== "!holograma") return;
  ev.cancel = true;
  const player = ev.sender;
  system.run(() => {
    try { player.runCommand(`give @s ${PROJECTOR_ID}`); } catch (e) {}
    try { player.runCommand(`give @s ${WAND_ID}`); } catch (e) {}
    player.sendMessage([
      "§b§l=== Hologramas Flotantes Pro v1 ===",
      "§7Usa el §bProyector de Holograma§7 para abrir el menu (cuadricula custom).",
      "§7Usa la §bVarita de Holograma§7 apuntando a un holograma para editarlo.",
      "§7Tambien puedes §etocar§7 un holograma para editarlo.",
      "§7Texto multilinea con §f|§7 y colores con §f&§7.",
    ].join("\n"));
  });
});

// ---------------------------------------------------------------------
// 3D particle auras (pattern + effect per hologram)
// ---------------------------------------------------------------------
function emitPattern(holo, id, pattern, t) {
  const loc = holo.location;
  const dim = holo.dimension;
  const spawn = (x, y, z) => {
    try { dim.spawnParticle(id, { x: loc.x + x, y: loc.y + y, z: loc.z + z }); } catch (err) {}
  };
  const TAU = Math.PI * 2;
  if (pattern === 1) { // helix
    for (let k = 0; k < 3; k++) {
      const a = t * 2 + k * (TAU / 3);
      const y = ((t * 0.5 + k * 0.33) % 1) * 1.6;
      spawn(Math.cos(a) * 0.6, y, Math.sin(a) * 0.6);
    }
  } else if (pattern === 2) { // halo (flat ring up high)
    for (let k = 0; k < 8; k++) {
      const a = t * 0.5 + k * (TAU / 8);
      spawn(Math.cos(a) * 0.6, 0.6, Math.sin(a) * 0.6);
    }
  } else if (pattern === 3) { // double orbit
    for (let k = 0; k < 4; k++) {
      const a = t + k * (TAU / 4);
      spawn(Math.cos(a) * 0.85, 0.2, Math.sin(a) * 0.85);
      spawn(Math.cos(-a) * 0.55, 0.5, Math.sin(-a) * 0.55);
    }
  } else if (pattern === 4) { // rising rain
    for (let k = 0; k < 3; k++) {
      const a = Math.random() * TAU;
      const r = Math.random() * 0.6;
      spawn(Math.cos(a) * r, Math.random() * 1.4, Math.sin(a) * r);
    }
  } else { // 0 ring
    for (let k = 0; k < 7; k++) {
      const a = t + k * (TAU / 7);
      spawn(Math.cos(a) * 0.75, 0.3 + Math.sin(t * 0.8 + k) * 0.25, Math.sin(a) * 0.75);
    }
  }
}

let pTick = 0;
system.runInterval(() => {
  pTick++;
  const t = pTick * 0.5;
  let players;
  try { players = world.getAllPlayers(); } catch (e) { return; }
  const seen = new Set();
  for (const p of players) {
    let holos;
    try { holos = p.dimension.getEntities({ location: p.location, maxDistance: 24, type: HOLO_ID }); }
    catch (e) { continue; }
    for (const h of holos) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      let on = true, id = "holo:spark", pat = 0;
      try {
        const v = h.getDynamicProperty(DP.particleOn);
        on = v === undefined ? true : !!v;
        id = h.getDynamicProperty(DP.particleId) || "holo:spark";
        pat = (h.getDynamicProperty(DP.pattern) | 0) || 0;
      } catch (err) {}
      if (on) emitPattern(h, id, pat, t);
    }
  }
}, 5);

// ---------------------------------------------------------------------
// Animated floating text (bob / heartbeat colour / typewriter).
//   Runs less often than particles to keep it cheap.
// ---------------------------------------------------------------------
const FLASH = ["b", "3", "f", "9"]; // heartbeat colour cycle
let aTick = 0;
system.runInterval(() => {
  aTick++;
  let players;
  try { players = world.getAllPlayers(); } catch (e) { return; }
  const seen = new Set();
  for (const p of players) {
    let holos;
    try { holos = p.dimension.getEntities({ location: p.location, maxDistance: 24, type: HOLO_ID }); }
    catch (e) { continue; }
    for (const h of holos) {
      if (seen.has(h.id)) continue;
      seen.add(h.id);
      let anim = 0;
      try { anim = (h.getDynamicProperty(DP.anim) | 0) || 0; } catch (e) { continue; }
      if (anim === 0) continue;
      try {
        if (anim === 1) {
          // Bob: small vertical sine offset on the entity itself.
          const l = h.location;
          const dy = Math.sin(aTick * 0.4) * 0.04;
          h.teleport({ x: l.x, y: l.y + dy, z: l.z }, { dimension: h.dimension });
        } else if (anim === 2) {
          // Heartbeat: cycle the flash colour of the text.
          const code = FLASH[aTick % FLASH.length];
          Holo.refreshText(h, code);
        } else if (anim === 3) {
          // Typewriter: reveal characters progressively then reset.
          typewriter(h, aTick);
        }
      } catch (e) { /* ignore */ }
    }
  }
}, 4);

// Typewriter helper - reveals the first line progressively.
function typewriter(holo, tick) {
  const lines = Holo.textLines(holo);
  if (!lines.length) return;
  const full = lines.join("\n");
  const visible = full.replace(/\u00a7./g, "").length || 1;
  const n = (Math.floor(tick / 2) % (visible + 6));
  // Build a substring that respects original lines/colours roughly.
  let count = n, out = "";
  for (const ch of lines.join("\n")) {
    if (count <= 0) break;
    out += ch;
    if (ch !== "\n") count--;
  }
  try { holo.nameTag = "\u00a7b" + out.replace(/&/g, "\u00a7"); } catch (e) {}
  if (n >= visible) {
    // settle on the full styled text for a moment
    Holo.refreshText(holo);
  }
}

// ---------------------------------------------------------------------
// Startup + safety refresh after world load
// ---------------------------------------------------------------------
system.run(() => console.log("[Holo] Floating Holograms Pro v1.0.0 cargado."));

world.afterEvents.worldInitialize?.subscribe(() => {
  system.runTimeout(() => {
    try {
      for (const h of Holo.listHolograms()) {
        if (!isValid(h)) continue;
        Holo.ensureInit(h);
        const c = Holo.getConfig(h);
        Holo.setSize(h, c.size); // re-apply scale event after reload
        Holo.refreshText(h);
      }
    } catch (e) { /* ignore */ }
  }, 40);
});
