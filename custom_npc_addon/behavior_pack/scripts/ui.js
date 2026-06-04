// =====================================================================
//  Custom NPC Pro Editor - User interface (forms)
// =====================================================================
import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { SKINS, SIZES, ANIMS, MAX_DAMAGE, NPC_ID, modelLabels, MODEL_NAMES, COMMON_ITEMS, PARTICLES, PATTERNS } from "./config.js";
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
const modelName = (i) => (i === 0 ? "Humanoide" : (MODEL_NAMES[i - 1] || ("Cubo " + (i - 10))));

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
    `§fModelo: §r${modelName(c.model)}  §fSkin: §r${SKINS[c.skin] ?? "?"}\n` +
    `§fTamano: §r${SIZES[c.size]?.label ?? "?"}  §fAnim: §r${ANIMS[c.anim] ?? "?"}\n` +
    `§fMira: ${onOff(c.look)} §fCamina: ${onOff(c.move)} §fHostil: ${onOff(c.hostile)}\n` +
    `§fInmortal: ${onOff(c.god)} §fTienda: ${onOff(c.trader)} §fDialogo: ${onOff(c.talk)}\n` +
    `§fDano: §r${c.damage} §8| §fTags: §r${npc.getTags().length}`;

  const form = new ActionFormData()
    .title("§l§2Editor de NPC")
    .body(body)
    .button("§l§eNombre", "textures/items/name_tag")
    .button("§l§bApariencia / Skin", "textures/items/leather")
    .button("§l§3Modelos 3D §8(30)", "textures/blocks/crafting_table_front")
    .button("§l§dTamano", "textures/items/blaze_powder")
    .button("§l§5Animacion", "textures/items/firework_star")
    .button("§l§aComportamiento", "textures/items/spyglass")
    .button("§l§dParticulas §8(editable)", "textures/items/blaze_rod")
    .button("§l§cDano", "textures/items/diamond_sword")
    .button("§l§6Dialogos", "textures/items/book_normal")
    .button("§l§2Intercambios §8(Tienda)", "textures/items/emerald")
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
    case 2: return editModel(player, npc);
    case 3: return editSize(player, npc);
    case 4: return editAnim(player, npc);
    case 5: return editBehavior(player, npc);
    case 6: return editParticles(player, npc);
    case 7: return editDamage(player, npc);
    case 8: return editDialogue(player, npc);
    case 9: return tradesEditor(player, npc);
    case 10: return tagsMenu(player, npc);
    case 11: return editCommands(player, npc);
    case 12: return editFunctions(player, npc);
    case 13: return presetsMenu(player, npc);
    case 14: return actionsMenu(player, npc);
  }
}

function back(player, npc) {
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
    .dropdown("§7Skin (solo modelo Humanoide)", SKINS, c.skin);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setSkin(npc, r.formValues[0]);
  if (c.model !== 0) msg(player, "§7Nota: este NPC usa un modelo 3D. Cambia a §fHumanoide§7 en Modelos 3D para ver la skin.");
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// MODELS 3D
// ---------------------------------------------------------------------
async function editModel(player, npc) {
  const c = NPC.getConfig(npc);
  const labels = modelLabels();
  const form = new ActionFormData()
    .title("§l§3Modelos 3D")
    .body(
      `§7Modelo actual: §f${modelName(c.model)}\n` +
      `§7Elige Humanoide o uno de los 30 modelos 3D profesionales.\n` +
      `§8Cada modelo usa su propia textura. Para cambiarlo: reemplaza\n§8models/entity/model-N/model.json y texture.png (identifier geometry.model_N).`
    );
  for (const l of labels) form.button(l);

  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setModel(npc, r.selection); // 0 = humanoid, 1..30 = model
  msg(player, `§aModelo aplicado: §f${modelName(r.selection)}`);
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
    .dropdown("§7Animacion en bucle §8(solo Humanoide)", ANIMS, c.anim);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setAnim(npc, r.formValues[0]);
  uiSound(player);
  back(player, npc);
}

// ---------------------------------------------------------------------
// BEHAVIOR (look / move / hostile / god / trader)
// ---------------------------------------------------------------------
async function editBehavior(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§aComportamiento")
    .toggle("§7Mirar al jugador", c.look)
    .toggle("§7Se mueve / camina", c.move)
    .toggle("§7Hostil (ataca jugadores y mobs)", c.hostile)
    .toggle("§7Inmortal (no recibe dano)", c.god)
    .toggle("§7Comerciante (abre tienda al tocar)", c.trader);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  const [look, move, hostile, god, trader] = r.formValues;
  NPC.setLook(npc, look);
  NPC.setMove(npc, move);
  NPC.setHostile(npc, hostile);
  NPC.setGod(npc, god);
  NPC.setTrader(npc, trader);
  uiSound(player);
  if (trader) msg(player, "§eTienda activada: §7toca el NPC = abrir tienda. Define items en §fIntercambios§7. Sneak + toca = editor.");
  back(player, npc);
}

// ---------------------------------------------------------------------
// PARTICLES (editable)
// ---------------------------------------------------------------------
async function editParticles(player, npc) {
  const c = NPC.getConfig(npc);
  const pIdx = Math.max(0, PARTICLES.findIndex((p) => p.id === c.particleId));
  const form = new ModalFormData()
    .title("§l§dParticulas")
    .toggle("§7Activar particulas", c.particleOn)
    .dropdown("§7Efecto de particula", PARTICLES.map((p) => p.label), pIdx < 0 ? 0 : pIdx)
    .dropdown("§7Patron 3D", PATTERNS, c.particlePattern);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  const [on, pSel, pat] = r.formValues;
  NPC.setParticles(npc, on, PARTICLES[pSel].id, pat);
  uiSound(player);
  msg(player, on ? `§aParticulas: §f${PARTICLES[pSel].label} §7(${PATTERNS[pat]})` : "§7Particulas desactivadas.");
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
// DIALOGUES
// ---------------------------------------------------------------------
async function editDialogue(player, npc) {
  const c = NPC.getConfig(npc);
  const form = new ModalFormData()
    .title("§l§6Dialogos")
    .textField(
      "§7Texto del dialogo. Separa paginas con §f|§7.\n§8Usa & para colores.",
      "Hola viajero!|Bienvenido a mi tienda.|Vuelve pronto.",
      c.dialogue
    )
    .toggle("§7Hablar al tocar (modo dialogo)", c.talk);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  NPC.setDialogue(npc, r.formValues[0]);
  NPC.setTalk(npc, r.formValues[1]);
  uiSound(player);
  if (r.formValues[1]) msg(player, "§aModo dialogo activado: §7toca el NPC para hablar, sneak + toca para editar.");
  back(player, npc);
}

/** Show the NPC dialogue pages to a player, styled like a parchment scroll
 *  (speaker name as the title, quoted parchment text, page counter, buttons).
 *  The optional JSON-UI theme pack renders this as a medieval dialogue box. */
export async function showDialogue(player, npc) {
  const pages = NPC.dialoguePages(npc);
  if (pages.length === 0) return openMainMenu(player, npc);
  const name = (npc.nameTag && npc.nameTag.length ? npc.nameTag : "NPC");
  uiSound(player, "mob.villager.idle");
  for (let i = 0; i < pages.length; i++) {
    const last = i === pages.length - 1;
    const body =
      `§r§8✦ ────────────────────── ✦\n\n` +
      `§7§o"${pages[i]}"§r\n\n` +
      `§8✦ ────────────────────── ✦\n` +
      `§8        Pagina §7${i + 1}§8/§7${pages.length}`;
    const form = new ActionFormData()
      .title(`§l§6✦ ${name} ✦`)
      .body(body)
      .button(last ? "§l§4✖  Cerrar" : "§l§2❯  Continuar", "textures/ui/dialog_bubble");
    if (!last) form.button("§8✖  Salir");
    const r = await forceShow(player, form);
    if (!r || r.canceled) return;
    if (last) return;
    if (r.selection === 1) return; // Salir
    uiSound(player, "random.click");
  }
}

// ---------------------------------------------------------------------
// TRADES (editable shop + vanilla-like trade screen)
// ---------------------------------------------------------------------
function itemLabel(id) {
  const found = COMMON_ITEMS.find((x) => x.id === id);
  if (found) return found.label;
  return (id || "?").replace("minecraft:", "");
}
function itemIndex(id) {
  const i = COMMON_ITEMS.findIndex((x) => x.id === id);
  return i < 0 ? 0 : i;
}
function tradeSummary(t) {
  let cost = `§f${t.wantQty}x §e${itemLabel(t.wantId)}`;
  if (t.want2Id && t.want2Qty > 0) cost += ` §7+ §f${t.want2Qty}x §e${itemLabel(t.want2Id)}`;
  return `${cost} §7➜ §f${t.giveQty}x §a${itemLabel(t.giveId)}`;
}

async function tradesEditor(player, npc) {
  const trades = NPC.getTrades(npc);
  const c = NPC.getConfig(npc);
  const form = new ActionFormData()
    .title("§l§2Intercambios (Tienda)")
    .body(
      `§7Comercio: ${onOff(c.trader)} §8(actívalo en Comportamiento)\n` +
      `§7Define los intercambios. Al tocar el NPC (con tienda activa) se abrira la tienda.\n` +
      (trades.length ? "§7Toca un intercambio para editar/eliminar." : "§8Aun no hay intercambios.")
    )
    .button("§a+ Anadir intercambio", "textures/items/emerald");
  for (const t of trades) form.button(tradeSummary(t));
  form.button("§b👁 Vista previa de la tienda", "textures/items/gold_ingot");
  form.button("§7Volver");

  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  if (r.selection === 0) return editTradeForm(player, npc, null);
  if (r.selection === trades.length + 1) {
    if (!trades.length) { msg(player, "§7No hay intercambios para mostrar."); return system.runTimeout(() => tradesEditor(player, npc), 2); }
    return showTrades(player, npc, true);
  }
  if (r.selection === trades.length + 2) return back(player, npc);
  return tradeItemForm(player, npc, r.selection - 1);
}

async function tradeItemForm(player, npc, index) {
  const t = NPC.getTrades(npc)[index];
  if (!t) return system.runTimeout(() => tradesEditor(player, npc), 2);
  const form = new ActionFormData()
    .title("§l§2Intercambio #" + (index + 1))
    .body("§7" + tradeSummary(t))
    .button("§eEditar")
    .button("§cEliminar")
    .button("§7Volver");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return system.runTimeout(() => tradesEditor(player, npc), 2);
  if (r.selection === 0) return editTradeForm(player, npc, index);
  if (r.selection === 1) {
    NPC.removeTrade(npc, index);
    msg(player, "§cIntercambio eliminado.");
    uiSound(player, "mob.villager.no");
  }
  system.runTimeout(() => tradesEditor(player, npc), 2);
}

async function editTradeForm(player, npc, index) {
  const t = index === null
    ? { wantId: "minecraft:emerald", wantQty: 1, want2Id: null, want2Qty: 0, giveId: "minecraft:diamond", giveQty: 1 }
    : NPC.getTrades(npc)[index];
  const ids = COMMON_ITEMS.map((x) => x.label);
  const form = new ModalFormData()
    .title(index === null ? "§l§2Nuevo intercambio" : "§l§2Editar intercambio")
    .dropdown("§7Item que pide", ids, itemIndex(t.wantId))
    .textField("§8ID personalizado del item pedido (opcional)", "minecraft:...", "")
    .slider("§7Cantidad pedida", 1, 64, 1, t.wantQty || 1)
    .toggle("§7Pedir un 2º item", !!(t.want2Id && t.want2Qty > 0))
    .dropdown("§72º item (si activado)", ids, itemIndex(t.want2Id))
    .slider("§7Cantidad 2º item", 1, 64, 1, t.want2Qty || 1)
    .dropdown("§aItem que entrega (recompensa)", ids, itemIndex(t.giveId))
    .textField("§8ID personalizado de la recompensa (opcional)", "minecraft:...", "")
    .slider("§aCantidad recompensa", 1, 64, 1, t.giveQty || 1);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return system.runTimeout(() => tradesEditor(player, npc), 2);
  const [wSel, wCustom, wQty, w2on, w2Sel, w2Qty, gSel, gCustom, gQty] = r.formValues;
  const wantId = (wCustom || "").trim() || COMMON_ITEMS[wSel].id;
  const giveId = (gCustom || "").trim() || COMMON_ITEMS[gSel].id;
  const trade = {
    wantId, wantQty: wQty,
    want2Id: w2on ? COMMON_ITEMS[w2Sel].id : null,
    want2Qty: w2on ? w2Qty : 0,
    giveId, giveQty: gQty,
  };
  if (index === null) NPC.addTrade(npc, trade);
  else NPC.updateTrade(npc, index, trade);
  msg(player, "§aIntercambio guardado: §7" + tradeSummary(trade));
  uiSound(player);
  system.runTimeout(() => tradesEditor(player, npc), 2);
}

/** Vanilla-like shop screen for players. preview=true returns to editor. */
export async function showTrades(player, npc, preview = false) {
  const trades = NPC.getTrades(npc);
  const name = (npc.nameTag && npc.nameTag.length ? npc.nameTag : "Mercader");
  if (!trades.length) {
    msg(player, "§7Este mercader no tiene nada que ofrecer.");
    return preview ? system.runTimeout(() => tradesEditor(player, npc), 2) : undefined;
  }
  const form = new ActionFormData()
    .title("§l§6⚖ " + name)
    .body("§7Elige un intercambio:\n§8(coste ➜ recompensa)");
  for (const t of trades) form.button(tradeSummary(t), "textures/items/emerald");
  if (preview) form.button("§7Volver al editor");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return preview ? system.runTimeout(() => tradesEditor(player, npc), 2) : undefined;
  if (preview && r.selection === trades.length) return system.runTimeout(() => tradesEditor(player, npc), 2);

  const res = NPC.tryTrade(player, npc, r.selection);
  if (res.ok) {
    msg(player, "§a✔ " + res.msg);
    uiSound(player, "random.orb");
  } else {
    msg(player, "§c✘ " + res.msg);
    uiSound(player, "note.bass");
  }
  // reopen shop for more trades
  system.runTimeout(() => showTrades(player, npc, preview), 3);
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
    .toggle("§7Ejecutar ahora (al guardar)", true)
    .toggle("§7Guardar para reutilizar", true)
    .toggle("§7Ejecutar al tocar el NPC (click)", c.runOnClick);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return back(player, npc);
  const [text, runNow, save, onClick] = r.formValues;
  if (save) NPC.setCommands(npc, text);
  NPC.setRunOnClick(npc, onClick);
  if (runNow) {
    const res = NPC.runCommands(npc, text);
    const ok = res.filter((x) => x.ok).length;
    msg(player, `§aComandos ejecutados: §f${ok}/${res.length}`);
    for (const e of res.filter((x) => !x.ok)) msg(player, `§c  fallo: §7${e.cmd}`);
  }
  if (onClick) msg(player, "§eLos comandos se ejecutaran cada vez que un jugador toque el NPC.");
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
