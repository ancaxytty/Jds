// =====================================================================
//  Floating Holograms Pro - User interface (forms)
//
//  The main editor uses the CUSTOM 3x3 textured grid provided by
//  ui/server_form.json. That layout activates ONLY when an ActionForm's
//  title is exactly "Custom Form" and buttons carry an icon path. So the
//  editor hub sets .title("Custom Form") and gives every button an icon
//  from textures/holo_ui/*. All other forms are normal vanilla forms.
// =====================================================================
import { system } from "@minecraft/server";
import { ActionFormData, ModalFormData, MessageFormData } from "@minecraft/server-ui";
import { COLORS, SIZES, PARTICLES, PATTERNS, ANIMS, WAND_REACH } from "./config.js";
import { forceShow, uiSound, msg, isValid, colorize } from "./util.js";
import * as Holo from "./holo.js";

const onOff = (b) => (b ? "ON" : "OFF");
const UI = "textures/holo_ui/";

// =====================================================================
//  PROJECTOR HUB  -  custom textured 3x3 grid ("Custom Form")
// =====================================================================
export async function openHub(player) {
  const count = Holo.listHolograms().length;
  const form = new ActionFormData()
    .title("Custom Form") // <-- triggers the custom grid layout
    .body("")
    // Order maps to the switch below. Icons come from textures/holo_ui/.
    .button("Crear", UI + "ic_create")
    .button("Lista (" + count + ")", UI + "ic_list")
    .button("Editar mirando", UI + "ic_text")
    .button("Color rapido", UI + "ic_color")
    .button("Mover aqui", UI + "ic_move")
    .button("Tamano", UI + "ic_size")
    .button("Particulas", UI + "ic_particle")
    .button("Borrar mirando", UI + "ic_delete")
    .button("Ayuda", UI + "ic_settings");

  const r = await forceShow(player, form);
  if (!r || r.canceled) return;

  switch (r.selection) {
    case 0: return createFlow(player);
    case 1: return listMenu(player);
    case 2: return editLookedAt(player);
    case 3: return quickColorLookedAt(player);
    case 4: return moveHereLookedAt(player);
    case 5: return sizeLookedAt(player);
    case 6: return particlesLookedAt(player);
    case 7: return deleteLookedAt(player);
    case 8: return helpScreen(player);
  }
}

function backHub(player) {
  system.runTimeout(() => openHub(player), 2);
}

// ---------------------------------------------------------------------
// Resolve the hologram the player is looking at, with a friendly error.
// ---------------------------------------------------------------------
function targetOrWarn(player) {
  const holo = Holo.findTargetHologram(player, WAND_REACH);
  if (!holo || !isValid(holo)) {
    msg(player, "§cNo hay ningun holograma cerca. Apunta a uno o crea uno nuevo.");
    uiSound(player, "note.bass", 0.8);
    return null;
  }
  return holo;
}

// =====================================================================
//  CREATE
// =====================================================================
async function createFlow(player) {
  const form = new ModalFormData()
    .title("§l§bCrear holograma")
    .textField(
      "§7Texto. Separa lineas con §f|§7.\n§8Usa & para colores (ej: &eHola &cmundo)",
      "Mi servidor|&7Bienvenido",
      "Mi holograma|&7Linea 2"
    )
    .dropdown("§7Color base", COLORS.map((c) => `§${c.code}${c.label}`), 0)
    .dropdown("§7Tamano", SIZES.map((s) => s.label), 2)
    .toggle("§7Colocar frente a mi (si no, sobre mi cabeza)", true);

  const r = await forceShow(player, form);
  if (!r || r.canceled) return backHub(player);
  const [text, color, size, inFront] = r.formValues;

  const holo = Holo.createHologram(player);
  Holo.setText(holo, text || "Holograma");
  Holo.setColor(holo, color);
  Holo.setSize(holo, size);
  if (inFront) Holo.moveToPlayerView(holo, player, 3);

  msg(player, "§a✔ Holograma creado. Apunta a el y usa el menu para editarlo.");
  uiSound(player);
  backHub(player);
}

// =====================================================================
//  LIST  (all holograms -> pick one -> full editor)
// =====================================================================
async function listMenu(player) {
  const holos = Holo.listHolograms();
  const form = new ActionFormData()
    .title("§l§bHologramas (" + holos.length + ")")
    .body(holos.length ? "§7Elige un holograma para editarlo o teletransportarte." : "§7No hay hologramas todavia.");
  for (const h of holos) {
    const first = (Holo.textLines(h)[0] || "Holograma").slice(0, 24);
    form.button(colorize(first));
  }
  form.button("§7Volver");

  const r = await forceShow(player, form);
  if (!r || r.canceled) return backHub(player);
  if (r.selection === holos.length) return backHub(player);
  const holo = holos[r.selection];
  if (!isValid(holo)) { msg(player, "§cEse holograma ya no existe."); return system.runTimeout(() => listMenu(player), 2); }
  return editorMenu(player, holo);
}

// =====================================================================
//  FULL EDITOR for a specific hologram (normal vanilla form)
// =====================================================================
export async function editorMenu(player, holo) {
  if (!isValid(holo)) { msg(player, "§cEl holograma ya no existe."); return; }
  Holo.ensureInit(holo);
  const c = Holo.getConfig(holo);
  const preview = Holo.textLines(holo).map(colorize).join("§r / ");

  const body =
    `§7Vista: §r${preview}\n\n` +
    `§fColor: §r§${COLORS[c.color]?.code ?? "b"}${COLORS[c.color]?.label ?? "?"}\n` +
    `§fTamano: §r${SIZES[c.size]?.label ?? "?"}\n` +
    `§fParticulas: §r${onOff(c.particleOn)} §8(${PARTICLES.find((p) => p.id === c.particleId)?.label ?? c.particleId} / ${PATTERNS[c.pattern] ?? "?"})\n` +
    `§fAnimacion: §r${ANIMS[c.anim] ?? "?"}`;

  const form = new ActionFormData()
    .title("§l§bEditar holograma")
    .body(body)
    .button("§l§eTexto", "textures/items/book_writable")
    .button("§l§bColor", "textures/items/dye_powder_blue")
    .button("§l§dTamano", "textures/items/blaze_powder")
    .button("§l§dParticulas", "textures/items/blaze_rod")
    .button("§l§5Animacion", "textures/items/firework_star")
    .button("§l§aMover", "textures/items/ender_pearl")
    .button("§l§3Teletransportarme", "textures/items/ender_eye")
    .button("§l§cBorrar", "textures/blocks/barrier")
    .button("§7Volver");

  const r = await forceShow(player, form);
  if (!r || r.canceled) return;
  switch (r.selection) {
    case 0: return editText(player, holo);
    case 1: return editColor(player, holo);
    case 2: return editSize(player, holo);
    case 3: return editParticles(player, holo);
    case 4: return editAnim(player, holo);
    case 5: return moveMenu(player, holo);
    case 6:
      try { player.teleport(holo.location, { dimension: holo.dimension }); msg(player, "§aTeletransportado al holograma."); } catch (e) {}
      return;
    case 7: return confirmDelete(player, holo);
    case 8: return; // Volver = close
  }
}

function backEditor(player, holo) {
  system.runTimeout(() => editorMenu(player, holo), 2);
}

// ---------------------------------------------------------------------
// TEXT
// ---------------------------------------------------------------------
async function editText(player, holo) {
  const c = Holo.getConfig(holo);
  const form = new ModalFormData()
    .title("§l§eTexto del holograma")
    .textField(
      "§7Una linea por renglon (o separa con §f|§7).\n§8Usa & para colores.",
      "Linea 1|Linea 2",
      c.text
    );
  const r = await forceShow(player, form);
  if (!r || r.canceled) return backEditor(player, holo);
  Holo.setText(holo, r.formValues[0]);
  uiSound(player);
  backEditor(player, holo);
}

// ---------------------------------------------------------------------
// COLOR
// ---------------------------------------------------------------------
async function editColor(player, holo) {
  const c = Holo.getConfig(holo);
  const form = new ModalFormData()
    .title("§l§bColor base")
    .dropdown("§7Color de las lineas sin codigo &", COLORS.map((x) => `§${x.code}${x.label}`), c.color);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return backEditor(player, holo);
  Holo.setColor(holo, r.formValues[0]);
  uiSound(player);
  backEditor(player, holo);
}

// ---------------------------------------------------------------------
// SIZE
// ---------------------------------------------------------------------
async function editSize(player, holo) {
  const c = Holo.getConfig(holo);
  const form = new ModalFormData()
    .title("§l§dTamano")
    .dropdown("§7Escala del holograma", SIZES.map((s) => s.label), c.size);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return backEditor(player, holo);
  Holo.setSize(holo, r.formValues[0]);
  uiSound(player);
  backEditor(player, holo);
}

// ---------------------------------------------------------------------
// PARTICLES
// ---------------------------------------------------------------------
async function editParticles(player, holo) {
  const c = Holo.getConfig(holo);
  const pIdx = Math.max(0, PARTICLES.findIndex((p) => p.id === c.particleId));
  const form = new ModalFormData()
    .title("§l§dParticulas 3D")
    .toggle("§7Activar particulas", c.particleOn)
    .dropdown("§7Efecto", PARTICLES.map((p) => p.label), pIdx)
    .dropdown("§7Patron 3D", PATTERNS, c.pattern);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return backEditor(player, holo);
  const [on, sel, pat] = r.formValues;
  Holo.setParticles(holo, on, PARTICLES[sel].id, pat);
  uiSound(player);
  msg(player, on ? `§dParticulas: §f${PARTICLES[sel].label} §7(${PATTERNS[pat]})` : "§7Particulas desactivadas.");
  backEditor(player, holo);
}

// ---------------------------------------------------------------------
// ANIMATION
// ---------------------------------------------------------------------
async function editAnim(player, holo) {
  const c = Holo.getConfig(holo);
  const form = new ModalFormData()
    .title("§l§5Animacion del texto")
    .dropdown("§7Efecto animado", ANIMS, c.anim);
  const r = await forceShow(player, form);
  if (!r || r.canceled) return backEditor(player, holo);
  Holo.setAnim(holo, r.formValues[0]);
  uiSound(player);
  backEditor(player, holo);
}

// ---------------------------------------------------------------------
// MOVE
// ---------------------------------------------------------------------
async function moveMenu(player, holo) {
  const form = new ActionFormData()
    .title("§l§aMover holograma")
    .body("§7Ajusta la posicion. Cada toque mueve 0.5 bloques.")
    .button("§a▲ Subir")
    .button("§c▼ Bajar")
    .button("§bNorte (-Z)")
    .button("§bSur (+Z)")
    .button("§bEste (+X)")
    .button("§bOeste (-X)")
    .button("§eTraer frente a mi")
    .button("§7Volver");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return backEditor(player, holo);
  const step = 0.5;
  switch (r.selection) {
    case 0: Holo.nudge(holo, 0, step, 0); break;
    case 1: Holo.nudge(holo, 0, -step, 0); break;
    case 2: Holo.nudge(holo, 0, 0, -step); break;
    case 3: Holo.nudge(holo, 0, 0, step); break;
    case 4: Holo.nudge(holo, step, 0, 0); break;
    case 5: Holo.nudge(holo, -step, 0, 0); break;
    case 6: Holo.moveToPlayerView(holo, player, 3); break;
    case 7: return backEditor(player, holo);
  }
  uiSound(player, "random.click");
  system.runTimeout(() => moveMenu(player, holo), 2);
}

// ---------------------------------------------------------------------
// DELETE
// ---------------------------------------------------------------------
async function confirmDelete(player, holo) {
  const form = new MessageFormData()
    .title("§l§cBorrar holograma")
    .body("§7Seguro que quieres borrar este holograma?")
    .button1("§7Cancelar")
    .button2("§cBorrar");
  const r = await forceShow(player, form);
  if (!r || r.canceled || r.selection !== 1) return backEditor(player, holo);
  Holo.removeHologram(holo);
  msg(player, "§cHolograma borrado.");
  uiSound(player, "random.break", 0.9);
}

// =====================================================================
//  QUICK ACTIONS on the hologram the player is looking at
// =====================================================================
function editLookedAt(player) {
  const holo = targetOrWarn(player);
  if (!holo) return backHub(player);
  return editorMenu(player, holo);
}

async function quickColorLookedAt(player) {
  const holo = targetOrWarn(player);
  if (!holo) return backHub(player);
  return editColor(player, holo);
}

async function sizeLookedAt(player) {
  const holo = targetOrWarn(player);
  if (!holo) return backHub(player);
  return editSize(player, holo);
}

async function particlesLookedAt(player) {
  const holo = targetOrWarn(player);
  if (!holo) return backHub(player);
  return editParticles(player, holo);
}

function moveHereLookedAt(player) {
  const holo = targetOrWarn(player);
  if (!holo) return backHub(player);
  Holo.moveToPlayerView(holo, player, 3);
  msg(player, "§aHolograma traido frente a ti.");
  uiSound(player);
  backHub(player);
}

async function deleteLookedAt(player) {
  const holo = targetOrWarn(player);
  if (!holo) return backHub(player);
  return confirmDelete(player, holo);
}

// =====================================================================
//  HELP
// =====================================================================
async function helpScreen(player) {
  const form = new ActionFormData()
    .title("§l§bAyuda - Hologramas")
    .body(
      "§7• §bProyector§7: abre este menu (cuadricula custom).\n" +
      "§7• §bVarita§7: toca/usa apuntando a un holograma para editarlo al instante.\n" +
      "§7• Escribe §f!holo§7 en el chat para conseguir los items.\n" +
      "§7• El texto admite varias lineas (§f|§7) y colores con §f&§7.\n" +
      "§7• Cada holograma guarda su texto, color, tamano, particulas 3D y animacion.\n" +
      "§8Hecho con Kiro - v1.0.0"
    )
    .button("§7Volver");
  const r = await forceShow(player, form);
  if (!r || r.canceled) return;
  backHub(player);
}

// =====================================================================
//  Entry from the WAND (edit the looked-at hologram directly)
// =====================================================================
export function openWandEditor(player) {
  const holo = Holo.findTargetHologram(player, WAND_REACH);
  if (!holo || !isValid(holo)) {
    msg(player, "§7Apunta a un holograma con la §bVarita§7 para editarlo, o usa el §bProyector§7 para crear uno.");
    uiSound(player, "note.bass", 0.8);
    return;
  }
  system.run(() => editorMenu(player, holo).catch((e) => console.warn("[Holo] " + e)));
}
