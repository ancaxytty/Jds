// =====================================================================
//  Custom NPC Pro Editor  -  main entry point
//  by Kiro  -  v4.0.0
//
//  Interact with a Custom NPC to open a full customization menu OR talk:
//   - sneak + tap  -> always opens the EDITOR
//   - tap          -> trade (if trader) / dialogue (if talk) / editor
//
//  Features: name, tags, commands, functions, size, skin, 3D models (30),
//  look-at-player, movement on/off, damage, animations, custom dialogues,
//  presets (save/load) and more.
// =====================================================================
import { world, system } from "@minecraft/server";
import { NPC_ID, DP } from "./config.js";
import { openMainMenu, showDialogue } from "./ui.js";
import { getConfig } from "./npc.js";

// ---------------------------------------------------------------------
// Interaction: open editor or talk depending on state
// ---------------------------------------------------------------------
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target } = ev;
  if (!target || target.typeId !== NPC_ID) return;

  let trader = false;
  let talk = false;
  let hasDialogue = false;
  try {
    trader = !!target.getDynamicProperty(DP.trader);
    talk = !!target.getDynamicProperty(DP.talk);
    const d = target.getDynamicProperty(DP.dialogue);
    hasDialogue = typeof d === "string" && d.trim().length > 0;
  } catch (e) {
    /* ignore */
  }

  // Sneak always opens the editor.
  if (player.isSneaking) {
    system.run(() => openMainMenu(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }

  // Normal tap: trader takes priority (let vanilla trade screen open).
  if (trader) return;

  // Dialogue mode: talk to the player.
  if (talk && hasDialogue) {
    system.run(() => showDialogue(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
    return;
  }

  // Otherwise open the editor.
  system.run(() => openMainMenu(player, target).catch((e) => console.warn("[CustomNPC] " + e)));
});

// ---------------------------------------------------------------------
// Configurable melee damage.
// The hostile component group attacks with 0 vanilla damage; the real
// (configurable) damage is applied here so it can be any value.
// ---------------------------------------------------------------------
world.afterEvents.entityHitEntity.subscribe((ev) => {
  const { damagingEntity, hitEntity } = ev;
  if (!damagingEntity || damagingEntity.typeId !== NPC_ID) return;
  if (!hitEntity) return;

  let dmg = 0;
  let hostile = false;
  try {
    hostile = !!damagingEntity.getDynamicProperty(DP.hostile);
    dmg = Number(damagingEntity.getDynamicProperty(DP.damage) ?? 0);
  } catch (e) {
    return;
  }
  if (!hostile || dmg <= 0) return;

  try {
    hitEntity.applyDamage(dmg, { cause: "entityAttack", damagingEntity });
  } catch (e) {
    /* target may be invulnerable / invalid */
  }
});

// ---------------------------------------------------------------------
// Helper chat command: "!npc" gives a spawn egg and quick help.
// ---------------------------------------------------------------------
world.beforeEvents.chatSend.subscribe((ev) => {
  const message = ev.message.trim().toLowerCase();
  if (message !== "!npc") return;
  ev.cancel = true;
  const player = ev.sender;
  system.run(() => {
    try {
      player.runCommand("give @s custom:npc_spawn_egg");
    } catch (e) {
      /* item id may differ across versions */
    }
    player.sendMessage([
      "§a§l=== Custom NPC Pro Editor ===",
      "§7Coloca el §ehuevo generador§7 para crear un NPC.",
      "§7Toca el NPC para §eeditar§7 o §ehablar§7 (sneak + toca = editor).",
      "§7Modelos 3D, skins, dialogos, movimiento, dano, presets y mas.",
    ].join("\n"));
  });
});

// ---------------------------------------------------------------------
// Startup banner + safety refresh of visuals on load
// ---------------------------------------------------------------------
system.run(() => {
  console.log("[CustomNPC] Pro Editor v4.0.0 cargado correctamente.");
});

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
    } catch (err) {
      /* ignore */
    }
  }, 40);
});
