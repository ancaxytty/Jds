// =====================================================================
//  Custom NPC Pro Editor - User interface (forms)
// =====================================================================
import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { SKINS, SIZES, ANIMS, MAX_DAMAGE, NPC_ID } from "./config.js";
import { forceShow, uiSound, msg } from "./util.js";
import * as NPC from "./npc.js";
import * as Presets from "./presets.js";

function isValid(npc) {
  if (!npc) return false;
  try {
    return typeof npc.isValid === "function" ? npc.isValid() : !!npc.isValid;
  } catch (e) {
    return false;
  }
}

const onOff = (b) => (b ? "§aON" : "§cOFF");

// ---------------------------------------------------------------------
// MAIN MENU
// ---------------------------------------------------------------------
export async function openMainMenu(player, npc) {
  if (!isValid(npc)) {
    msg(player, "§cEl NPC ya no existe.");
    return;
  }
  NPC.ensureInit(npc);
  const c = NPC.getConfig(npc);

  const body =
    `§7Configura este NPC con los botones de abajo.\n\n` +
    `§fNombre: §r${c.name}\n` +
    `§fSkin: §r${SKINS[c.skin] ?? "?"}\n` +
    `§fTamano: §r${SIZES[c.size]?.label ?? "?"}\n` +
    `§fAnimacion: §r${ANIMS[c.anim] ?? "?"}\n` +
    `§fMirar jugador: ${onOff(c.look)}  §fHostil: ${onOff(c.hostile)}\n` +
    `§fInmortal: ${onOff(c.god)}  §fComerciante: ${onOff(c.trader)}\n` +
    `§fDano: §r${c.damage} §8| §fTags: §r${npc.getTags().length}`;

  const form = new ActionFormData()
    .title("§l§2Editor de NPC")
    .body(body)
    .button("§l§eNombre", "textures/items/name_tag")
    .button("§l§bApariencia / Skin", "textures/items/leather")
    .button("§l§dTamano", "textures/items/blaze_powder")
    .button("§l§5Animacion", "textures/items/firework_star")
    .button("§l§aComportamiento", "textures/items/spyglass")
    .button("§l§cDano", "textures/items/diamond_sword")
    .button("§l§6Etiquetas (Tags)", "textures/items/paper")
    .button("§l§eComandos", "textures/items/book_writable")
    .button("§l§9Funciones", "textures/items/book_enchanted")
    .button("§l§3Presets §8(guardar/cargar)", "textures/items/ender_pearl")
    .button("§l§4Acciones del NPC", "textures/ui/icon_setting");

  const r = await forceShow(player, form);
  if (!r || r.canceled) return;

  switch (r.selection) {
    case 0: return editName(player, npc);
    case 1: return editSkin(player, npc);
    case 2: return editSize(player, npc);
    case 3: return editAnim(player, npc);
    case 4: return editBehavior(player, npc);
    case 5: return editDamage(player, npc);
    case 6: return tagsMenu(player, npc);
    case 7: return editCommands(player, npc);
    case 8: return editFunctions(player, npc);
    case 9: return presetsMenu(player, npc);
    case 10: return actionsMenu(player, npc);
  }
}

function back(player, npc) {
  // small delay then reopen the main menu for a smooth flow
  system.runTimeout(() => openMainMenu(player, npc), 2);
}

// ---------------------------------------------------------------------
// NAME
// ---------------------------------------------------------------------
async function editName(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§eNombre del NPC")
    .textField("§7Nombre §8(usa & para colores, ej: &bAzul)", "Nombre...", c.name);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setName(npc, r.formValues[0]);
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// SKIN
// ---------------------------------------------------------------------
async function editSkin(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§bApariencia / Skin")
    .dropdown("§7Elige una skin", SKINS, c.skin);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setSkin(npc, r.formValues[0]);
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// SIZE
// ---------------------------------------------------------------------
async function editSize(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§dTamano del NPC")
    .dropdown("§7Elige el tamano", SIZES.map((s) => s.label), c.size);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setSize(npc, r.formValues[0]);
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// ANIMATION
// ---------------------------------------------------------------------
async function editAnim(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§5Animacion")
    .dropdown("§7Animacion en bucle", ANIMS, c.anim);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setAnim(npc, r.formValues[0]);
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// BEHAVIOR (look / hostile / god / trader)
// ---------------------------------------------------------------------
async function editBehavior(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§aComportamiento")
    .toggle("§7Mirar al jugador", c.look)
    .toggle("§7Hostil (ataca jugadores y mobs)", c.hostile)
    .toggle("§7Inmortal (no recibe dano)", c.god)
    .toggle("§7Comerciante (abre tienda al tocar)", c.trader);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  const [look, hostile, god, trader] = r.formValues;
  NPC.setLook(npc, look);
  NPC.setHostile(npc, hostile);
  NPC.setGod(npc, god);
  NPC.setTrader(npc, trader);
  uiSound(player);
  if (trader) msg(player, "§eComerciante activado: §7toca el NPC normal para comerciar, agachate (sneak) + toca para abrir el editor.");
  back(player, npc);
}

// ---------------------------------------------------------------------
// DAMAGE
// ---------------------------------------------------------------------
async function editDamage(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§cDano de ataque")
    .slider("§7Dano por golpe §8(corazones = dano/2)", 0, MAX_DAMAGE, 1, c.damage)
    .toggle("§7Activar modo hostil ahora", c.hostile);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setDamage(npc, r.formValues[0]);
  if (r.formValues[1]) NPC.setHostile(npc, true);
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// TAGS
// ---------------------------------------------------------------------
async function tagsMenu(player, npc) {
  const tags = npc.getTags();
  const form = new ActionFormData()
    .title("§l§6Etiquetas (Tags)")
    .body(tags.length ? "§7Toca una etiqueta para eliminarla:" : "§7Este NPC no tiene etiquetas todavia.")
    .button("§a+ Anadir etiqueta(s)");
  for (const t of tags) form.button("§c[X] §r" + t);

  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  if (r.selection === 0) return addTagForm(player, npc);
  const tag = tags[r.selection - 1];
  NPC.removeTag(npc, tag);
  msg(player, `§cEtiqueta eliminada: §r${tag}`);
  uiSound(player, "mob.villager.no");
  system.runTimeout(() => tagsMenu(player, npc), 2);
}

async function addTagForm(player, npc) {
  const form = new ModalFormData()
    .title("§l§6Anadir etiquetas")
    .textField("§7Separa varias con comas", "amigo, tienda, jefe");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return system.runTimeout(() => tagsMenu(player, npc), 2);
  const added = NPC.addTags(npc, r.formValues[0]);
  msg(player, added.length ? `§aAnadidas: §r${added.join(", ")}` : "§7No se anadio ninguna etiqueta.");
  uiSound(player);
  system.runTimeout(() => tagsMenu(player, npc), 2);
}

// ---------------------------------------------------------------------
// COMMANDS
// ---------------------------------------------------------------------
async function editCommands(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§eComandos")
    .textField(
      "§7Comandos (separa con ; o salto de linea).\n§8Se ejecutan desde el NPC.",
      "say Hola!; particle minecraft:heart_particle ~~1~",
      c.commands
    )
    .toggle("§7Ejecutar ahora", true)
    .toggle("§7Guardar para reutilizar", true);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  const [text, runNow, save] = r.formValues;
  if (save) NPC.setCommands(npc, text);
  if (runNow) {
    const res = NPC.runCommands(npc, text);
    const ok = res.filter((x) => x.ok).length;
    msg(player, `§aComandos ejecutados: §f${ok}/${res.length}`);
    for (const e of res.filter((x) => !x.ok)) msg(player, `§c  fallo: §7${e.cmd}`);
  }
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// FUNCTIONS
// ---------------------------------------------------------------------
async function editFunctions(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§9Funciones")
    .textField(
      "§7Nombre(s) de function (sin .mcfunction).\n§8Separa con coma. Ej: mipack/saludo",
      "mipack/saludo",
      c.functions
    )
    .toggle("§7Ejecutar ahora", true)
    .toggle("§7Guardar para reutilizar", true);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  const [text, runNow, save] = r.formValues;
  if (save) NPC.setFunctions(npc, text);
  if (runNow) {
    const res = NPC.runFunctions(npc, text);
    const ok = res.filter((x) => x.ok).length;
    msg(player, `§aFunciones ejecutadas: §f${ok}/${res.length}`);
    for (const e of res.filter((x) => !x.ok)) msg(player, `§c  fallo: §7${e.fn}`);
  }
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// PRESETS
// ---------------------------------------------------------------------
async function presetsMenu(player, npc) {
  const names = Presets.listPresets();
  const form = new ActionFormData()
    .title("§l§3Presets")
    .body(names.length ? "§7Toca un preset para cargarlo en este NPC:" : "§7No hay presets guardados.")
    .button("§a+ Guardar config actual");
  for (const n of names) form.button("§b" + n);

  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  if (r.selection === 0) return savePresetForm(player, npc);
  const name = names[r.selection - 1];
  return presetActionForm(player, npc, name);
}

async function savePresetForm(player, npc) {
  const form = new ModalFormData()
    .title("§l§3Guardar preset")
    .textField("§7Nombre del preset", "mi_npc_tienda");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return system.runTimeout(() => presetsMenu(player, npc), 2);
  if (Presets.savePreset(npc, r.formValues[0])) {
    msg(player, "§aPreset guardado.");
    uiSound(player);
  } else {
    msg(player, "§cNombre invalido.");
  }
  system.runTimeout(() => presetsMenu(player, npc), 2);
}

async function presetActionForm(player, npc, name) {
  const form = new ActionFormData()
    .title("§l§3Preset: §r" + name)
    .body("§7Que quieres hacer con este preset?")
    .button("§aCargar en este NPC")
    .button("§cEliminar preset")
    .button("§7Volver");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return system.runTimeout(() => presetsMenu(player, npc), 2);
  if (r.selection === 0) {
    Presets.loadPreset(npc, name);
    msg(player, "§aPreset cargado en el NPC.");
    uiSound(player);
    return back(player, npc);
  }
  if (r.selection === 1) {
    Presets.deletePreset(name);
    msg(player, "§cPreset eliminado.");
  }
  system.runTimeout(() => presetsMenu(player, npc), 2);
}

// ---------------------------------------------------------------------
// NPC ACTIONS
// ---------------------------------------------------------------------
async function actionsMenu(player, npc) {
  const form = new ActionFormData()
    .title("§l§4Acciones del NPC")
    .body("§7Acciones rapidas sobre este NPC.")
    .button("§aTraer NPC hacia mi")
    .button("§aTeleportarme al NPC")
    .button("§aCurar NPC")
    .button("§bClonar NPC")
    .button("§eDarme huevo generador")
    .button("§cEliminar NPC")
    .button("§7Volver");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);

  try {
    switch (r.selection) {
      case 0:
        npc.teleport(player.location, { dimension: player.dimension });
        msg(player, "§aNPC traido hacia ti.");
        break;
      case 1:
        player.teleport(npc.location, { dimension: npc.dimension });
        msg(player, "§aTeletransportado al NPC.");
        break;
      case 2: {
        const hp = npc.getComponent("minecraft:health");
        if (hp) hp.setCurrentValue(hp.effectiveMax ?? 200);
        msg(player, "§aNPC curado.");
        break;
      }
      case 3: {
        const clone = npc.dimension.spawnEntity(NPC_ID, npc.location);
        NPC.applyConfig(clone, NPC.getConfig(npc));
        msg(player, "§bNPC clonado.");
        break;
      }
      case 4:
        player.runCommand("give @s custom:npc_spawn_egg");
        msg(player, "§eHuevo generador entregado.");
        break;
      case 5:
        return confirmRemove(player, npc);
      case 6:
        return back(player, npc);
    }
  } catch (e) {
    msg(player, "§cError: §7" + e);
  }
  uiSound(player);
  if (r.selection !== 5) back(player, npc);
}

async function confirmRemove(player, npc) {
  const form = new MessageFormData()
    .title("§l§cEliminar NPC")
    .body("§7Seguro que quieres eliminar este NPC? Esta accion no se puede deshacer.")
    .button1("§7Cancelar")
    .button2("§cEliminar");
  const r = await forceShow(player, form);
  if (!r || r.canceled || r.selection !== 1) return back(player, npc);
  try {
    if (typeof npc.remove === "function") npc.remove();
    else npc.kill();
    msg(player, "§cNPC eliminado.");
    uiSound(player, "mob.villager.death");
  } catch (e) {
    try {
      npc.kill();
      msg(player, "§cNPC eliminado.");
    } catch (e2) {
      msg(player, "§cNo se pudo eliminar: §7" + e2);
    }
  }
}
