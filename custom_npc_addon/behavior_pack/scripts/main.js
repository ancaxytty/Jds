// =====================================================================
//  Custom NPC Pro Editor  -  main entry point
//  by Kiro  -  v5.0.0
//
//  Interact with a Custom NPC:
//   - sneak + tap  -> always opens the EDITOR
//   - tap          -> shop (if trader) / dialogue (if talk) / editor
//   - commands set to "run on click" execute on every tap
//
//  Features: name, tags, commands (run on save & on click), functions,
//  size, 30 pro 3D models (own textures), skin, look, movement on/off,
//  damage, animations, parchment dialogues, EDITABLE TRADES (shop),
//  presets, custom 3D aura particles, and more.
// =====================================================================
import { world, system } from "@minecraft/server";
import { NPC_ID, DP } from "./config.js";
import { openMainMenu, showDialogue, showTrades } from "./ui.js";
import { getConfig, runCommands } from "./npc.js";

// ---------------------------------------------------------------------
// Interaction: run-on-click commands, then shop / dialogue / editor
// ---------------------------------------------------------------------
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target } = ev;
  if (!target || target.typeId !== NPC_ID) return;

  let trader = false, talk = false, hasDialogue = false, runOnClick = false, commands = "";
  try {
    trader = !!target.getDynamicProperty(DP.trader);
    talk = !!target.getDynamicProperty(DP.talk);
    runOnClick = !!target.getDynamicProperty(DP.runOnClick);
    commands = target.getDynamicProperty(DP.commands) || "";
    const d = target.getDynamicProperty(DP.dialogue);
    hasDialogue = typeof d === "string" && d.trim().length > 0;
  } catch (e) { /* ignore */ }

  // Commands that should run when the NPC is clicked.
  if (runOnClick && commands.trim().length) {
    system.run(() => { try { runCommands(target, commands); } catch (e) {} });
  }

  // Sneak always opens the editor.
  if (player.isSneaking) {
    system.run(() => openMainMenu(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }
  // Trader: open our editable shop screen.
  if (trader) {
    system.run(() => showTrades(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }
  // Dialogue mode.
  if (talk && hasDialogue) {
    system.run(() => showDialogue(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }
  // Otherwise the editor.
  system.run(() => openMainMenu(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
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
// Custom 3D aura particles: a rotating 3D ring of custom particles
// around each NPC near a player (gives a 3D, animated effect).
// ---------------------------------------------------------------------
let pTick = 0;
const RING = 7;
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
      const loc = e.location;
      for (let k = 0; k < RING; k++) {
        const a = t + k * (Math.PI * 2 / RING);
        const r = 0.75;
        const pos = {
          x: loc.x + Math.cos(a) * r,
          y: loc.y + 1.0 + Math.sin(t * 0.8 + k) * 0.35,
          z: loc.z + Math.sin(a) * r,
        };
        try { e.dimension.spawnParticle("custom:npc_aura", pos); } catch (err) { /* particle not loaded */ }
      }
    }
  }
}, 5);

// ---------------------------------------------------------------------
// Helper chat command: "!npc" gives a spawn egg and quick help.
// ---------------------------------------------------------------------
world.beforeEvents.chatSend.subscribe((ev) => {
  if (ev.message.trim().toLowerCase() !== "!npc") return;
  ev.cancel = true;
  const player = ev.sender;
  system.run(() => {
    try { player.runCommand("give @s custom:npc_spawn_egg"); } catch (e) {}
    player.sendMessage([
      "§a§l=== Custom NPC Pro Editor v5 ===",
      "§7Coloca el §ehuevo generador§7 para crear un NPC.",
      "§7Toca el NPC: §etienda / dialogo / editor§7 (sneak + toca = editor).",
      "§730 modelos 3D, intercambios editables, particulas 3D y mas.",
    ].join("\n"));
  });
});

// ---------------------------------------------------------------------
// Startup + safety refresh of visuals on load
// ---------------------------------------------------------------------
system.run(() => console.log("[CustomNPC] Pro Editor v5.0.0 cargado correctamente."));

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
