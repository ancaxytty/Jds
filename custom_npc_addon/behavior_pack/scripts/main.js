// =====================================================================
//  Custom NPC Pro Editor  -  main entry point
//  by Kiro  -  v6.0.0
//
//  - Hold the 3D NPC Wand and tap an NPC -> opens the EDITOR menu.
//  - Tap without the wand -> shop (trader) / dialogue (talk).
//  - "Run on click" commands execute on every tap.
//  - Editable 3D particle auras around each NPC.
// =====================================================================
import { world, system } from "@minecraft/server";
import { NPC_ID, DP, WAND_ID, PATTERNS } from "./config.js";
import { openMainMenu, showDialogue, showTrades } from "./ui.js";
import { getConfig, runCommands } from "./npc.js";

// ---------------------------------------------------------------------
// Interaction: wand opens editor; otherwise shop / dialogue
// ---------------------------------------------------------------------
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target, itemStack } = ev;
  if (!target || target.typeId !== NPC_ID) return;

  const holdingWand = !!itemStack && itemStack.typeId === WAND_ID;

  let trader = false, talk = false, hasDialogue = false, runOnClick = false, commands = "";
  try {
    trader = !!target.getDynamicProperty(DP.trader);
    talk = !!target.getDynamicProperty(DP.talk);
    runOnClick = !!target.getDynamicProperty(DP.runOnClick);
    commands = target.getDynamicProperty(DP.commands) || "";
    const d = target.getDynamicProperty(DP.dialogue);
    hasDialogue = typeof d === "string" && d.trim().length > 0;
  } catch (e) { /* ignore */ }

  if (runOnClick && commands.trim().length) {
    system.run(() => { try { runCommands(target, commands); } catch (e) {} });
  }

  // The 3D wand is REQUIRED to open the editor.
  if (holdingWand) {
    system.run(() => openMainMenu(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }

  // Without the wand: shop, then dialogue, else a hint.
  if (trader) {
    system.run(() => showTrades(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }
  if (talk && hasDialogue) {
    system.run(() => showDialogue(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }
  try { player.onScreenDisplay.setActionBar("§7Usa la §bVarita de NPC§7 para editar este NPC."); } catch (e) {}
});

// ---------------------------------------------------------------------
// Configurable melee damage (hostile group attacks with 0 vanilla damage).
// ---------------------------------------------------------------------
world.afterEvents.entityHitEntity.subscribe((ev) => {
  const { damagingEntity, hitEntity } = ev;
  if (!damagingEntity || damagingEntity.typeId !== NPC_ID || !hitEntity) return;
  let dmg = 0, hostile = false;
  try {
    hostile = !!damagingEntity.getDynamicProperty(DP.hostile);
    dmg = Number(damagingEntity.getDynamicProperty(DP.damage) ?? 0);
  } catch (e) { return; }
  if (!hostile || dmg <= 0) return;
  try { hitEntity.applyDamage(dmg, { cause: "entityAttack", damagingEntity }); } catch (e) {}
});

// ---------------------------------------------------------------------
// Editable 3D particle auras (pattern + effect per NPC)
// ---------------------------------------------------------------------
let pTick = 0;
function emitPattern(e, id, pattern, t) {
  const loc = e.location;
  const spawn = (x, y, z) => {
    try { e.dimension.spawnParticle(id, { x: loc.x + x, y: loc.y + y, z: loc.z + z }); } catch (err) {}
  };
  const TAU = Math.PI * 2;
  if (pattern === 1) { // helix
    for (let k = 0; k < 3; k++) {
      const a = t * 2 + k * (TAU / 3);
      const y = ((t * 0.5 + k * 0.33) % 1) * 2.0;
      spawn(Math.cos(a) * 0.6, 0.2 + y, Math.sin(a) * 0.6);
    }
  } else if (pattern === 2) { // fountain
    for (let k = 0; k < 3; k++) {
      const a = Math.random() * TAU;
      spawn(Math.cos(a) * 0.25, 1.8, Math.sin(a) * 0.25);
    }
  } else if (pattern === 3) { // double orbit
    for (let k = 0; k < 4; k++) {
      const a = t + k * (TAU / 4);
      spawn(Math.cos(a) * 0.85, 1.0, Math.sin(a) * 0.85);
      spawn(Math.cos(-a) * 0.55, 1.4, Math.sin(-a) * 0.55);
    }
  } else if (pattern === 4) { // crown / halo (flat ring up high)
    for (let k = 0; k < 8; k++) {
      const a = t * 0.5 + k * (TAU / 8);
      spawn(Math.cos(a) * 0.5, 2.1, Math.sin(a) * 0.5);
    }
  } else { // 0 ring
    for (let k = 0; k < 7; k++) {
      const a = t + k * (TAU / 7);
      spawn(Math.cos(a) * 0.75, 1.0 + Math.sin(t * 0.8 + k) * 0.35, Math.sin(a) * 0.75);
    }
  }
}
system.runInterval(() => {
  pTick++;
  const t = pTick * 0.5;
  let players;
  try { players = world.getAllPlayers(); } catch (e) { return; }
  for (const p of players) {
    let npcs;
    try { npcs = p.dimension.getEntities({ location: p.location, maxDistance: 18, type: NPC_ID }); }
    catch (e) { continue; }
    for (const e of npcs) {
      let on = true, id = "custom:npc_aura", pat = 0;
      try {
        const v = e.getDynamicProperty(DP.particleOn);
        on = v === undefined ? true : !!v;
        id = e.getDynamicProperty(DP.particleId) || "custom:npc_aura";
        pat = (e.getDynamicProperty(DP.particlePattern) | 0) || 0;
      } catch (err) {}
      if (!on) continue;
      emitPattern(e, id, pat, t);
    }
  }
}, 5);

// ---------------------------------------------------------------------
// Helper chat command: "!npc" gives the 3D wand + spawn egg and help.
// ---------------------------------------------------------------------
world.beforeEvents.chatSend.subscribe((ev) => {
  if (ev.message.trim().toLowerCase() !== "!npc") return;
  ev.cancel = true;
  const player = ev.sender;
  system.run(() => {
    try { player.runCommand("give @s custom:npc_spawn_egg"); } catch (e) {}
    try { player.runCommand("give @s custom:npc_wand"); } catch (e) {}
    player.sendMessage([
      "§a§l=== Custom NPC Pro Editor v6 ===",
      "§7Coloca el §ehuevo generador§7 para crear un NPC.",
      "§7Sostén la §bVarita de NPC§7 y toca el NPC para abrir el §eeditor§7.",
      "§7Sin varita: tienda / dialogo. 30 modelos 3D, particulas editables y mas.",
    ].join("\n"));
  });
});

// ---------------------------------------------------------------------
// Startup + safety refresh of visuals on load
// ---------------------------------------------------------------------
system.run(() => console.log("[CustomNPC] Pro Editor v6.0.0 cargado correctamente."));

world.afterEvents.worldInitialize?.subscribe(() => {
  system.runTimeout(() => {
    try {
      for (const dim of ["overworld", "nether", "the_end"]) {
        const d = world.getDimension(dim);
        for (const e of d.getEntities({ type: NPC_ID })) {
          const c = getConfig(e);
          e.setProperty("custom:model", c.model);
          e.setProperty("custom:anim", c.anim);
          e.setProperty("custom:skin", c.model === 0 ? c.skin : 7 + c.model);
        }
      }
    } catch (err) { /* ignore */ }
  }, 40);
});
