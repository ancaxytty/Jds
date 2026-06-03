// =====================================================================
//  Custom NPC Pro Editor  -  main entry point
//  by Kiro  -  v2.0.0
//
//  Click / tap a Custom NPC to open a full customization menu:
//  name, tags, commands, size, skin, look-at-player, damage,
//  functions, animations, presets (save/load) and more.
// =====================================================================
import { world, system } from "@minecraft/server";
import { NPC_ID, DP } from "./config.js";
import { openMainMenu } from "./ui.js";
import { getConfig } from "./npc.js";

// ---------------------------------------------------------------------
// Open the editor when a player interacts with a Custom NPC
// ---------------------------------------------------------------------
world.afterEvents.playerInteractWithEntity.subscribe((ev) => {
  const { player, target } = ev;
  if (!target || target.typeId !== NPC_ID) return;

  // When the NPC is a trader, a normal tap opens the trade screen, so the
  // editor is only opened while sneaking. Otherwise any tap opens it.
  let isTrader = false;
  try {
    isTrader = !!target.getDynamicProperty(DP.trader);
  } catch (e) {
    /* ignore */
  }
  if (isTrader && !player.isSneaking) return;

  system.run(() => {
    openMainMenu(player, target).catch((e) =>
      console.warn("[CustomNPC] menu error: " + e)
    );
  });
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
    hitEntity.applyDamage(dmg, {
      cause: "entityAttack",
      damagingEntity,
    });
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
      "§7Toca / click derecho al NPC para abrir el §eeditor§7.",
      "§7Comandos, tamano, skin, animaciones, dano, presets y mas.",
    ].join("\n"));
  });
});

// ---------------------------------------------------------------------
// Startup banner
// ---------------------------------------------------------------------
system.run(() => {
  console.log("[CustomNPC] Pro Editor v2.0.0 cargado correctamente.");
});

// Re-apply persisted skin/animation properties shortly after load so the
// visuals always match the saved configuration (properties already persist,
// this is just a safety refresh for older worlds).
world.afterEvents.worldInitialize?.subscribe(() => {
  system.runTimeout(() => {
    try {
      for (const dim of ["overworld", "nether", "the_end"]) {
        const d = world.getDimension(dim);
        for (const e of d.getEntities({ type: NPC_ID })) {
          const c = getConfig(e);
          e.setProperty("custom:skin", c.skin);
          e.setProperty("custom:anim", c.anim);
        }
      }
    } catch (err) {
      /* ignore */
    }
  }, 40);
});
