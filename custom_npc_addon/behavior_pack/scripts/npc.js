// =====================================================================
//  Custom NPC Pro Editor - NPC state management
//  Reads / writes the configuration of a single NPC entity.
//  Persistence is handled by dynamic properties + entity properties +
//  component groups, all of which survive world reloads automatically.
// =====================================================================
import {
  DP,
  DEFAULTS,
  SIZES,
  SKINS,
  ANIMS,
  MAX_DAMAGE,
  MODEL_COUNT,
  modelTextureIndex,
} from "./config.js";
import { clamp } from "./util.js";

// ---------------------------------------------------------------------
// Low level getters
// ---------------------------------------------------------------------

function getDP(npc, key, fallback) {
  const v = npc.getDynamicProperty(key);
  return v === undefined ? fallback : v;
}

/** Read the full configuration object of an NPC. */
export function getConfig(npc) {
  return {
    name: getDP(npc, DP.name, DEFAULTS.name),
    skin: getDP(npc, DP.skin, DEFAULTS.skin),
    model: getDP(npc, DP.model, DEFAULTS.model),
    size: getDP(npc, DP.size, DEFAULTS.size),
    look: getDP(npc, DP.look, DEFAULTS.look),
    move: getDP(npc, DP.move, DEFAULTS.move),
    hostile: getDP(npc, DP.hostile, DEFAULTS.hostile),
    trader: getDP(npc, DP.trader, DEFAULTS.trader),
    god: getDP(npc, DP.god, DEFAULTS.god),
    damage: getDP(npc, DP.damage, DEFAULTS.damage),
    anim: getDP(npc, DP.anim, DEFAULTS.anim),
    commands: getDP(npc, DP.commands, DEFAULTS.commands),
    functions: getDP(npc, DP.functions, DEFAULTS.functions),
    dialogue: getDP(npc, DP.dialogue, DEFAULTS.dialogue),
    talk: getDP(npc, DP.talk, DEFAULTS.talk),
  };
}

// ---------------------------------------------------------------------
// Texture refresh: humanoid models use the chosen skin (0-7),
// 3D models use their OWN dedicated texture (index 8 + model-1).
// ---------------------------------------------------------------------
function refreshTexture(npc) {
  const model = getDP(npc, DP.model, DEFAULTS.model);
  const skin = getDP(npc, DP.skin, DEFAULTS.skin);
  const texIndex = model === 0
    ? clamp(Math.round(skin), 0, SKINS.length - 1)
    : modelTextureIndex(model);
  npc.setProperty("custom:skin", texIndex);
}

// ---------------------------------------------------------------------
// Individual setters - each one persists + applies the change in-world
// ---------------------------------------------------------------------

export function setName(npc, name) {
  const clean = (name ?? "").toString().slice(0, 64);
  npc.nameTag = clean.replace(/&/g, "\u00a7");
  npc.setDynamicProperty(DP.name, clean);
}

export function setSkin(npc, index) {
  const i = clamp(Math.round(index), 0, SKINS.length - 1);
  npc.setDynamicProperty(DP.skin, i);
  refreshTexture(npc);
}

export function setModel(npc, index) {
  const i = clamp(Math.round(index), 0, MODEL_COUNT);
  npc.setProperty("custom:model", i);
  npc.setDynamicProperty(DP.model, i);
  refreshTexture(npc);
}

export function setSize(npc, index) {
  const i = clamp(Math.round(index), 0, SIZES.length - 1);
  npc.triggerEvent(SIZES[i].event);
  npc.setDynamicProperty(DP.size, i);
}

export function setLook(npc, on) {
  npc.triggerEvent(on ? "npc:look_on" : "npc:look_off");
  npc.setDynamicProperty(DP.look, !!on);
}

export function setMove(npc, on) {
  npc.triggerEvent(on ? "npc:move_on" : "npc:move_off");
  npc.setDynamicProperty(DP.move, !!on);
}

export function setHostile(npc, on) {
  npc.triggerEvent(on ? "npc:hostile_on" : "npc:hostile_off");
  npc.setDynamicProperty(DP.hostile, !!on);
}

export function setTrader(npc, on) {
  npc.triggerEvent(on ? "npc:trader_on" : "npc:trader_off");
  npc.setDynamicProperty(DP.trader, !!on);
}

export function setGod(npc, on) {
  npc.triggerEvent(on ? "npc:godmode_on" : "npc:godmode_off");
  npc.setDynamicProperty(DP.god, !!on);
}

export function setDamage(npc, value) {
  const d = clamp(Math.round(value), 0, MAX_DAMAGE);
  npc.setDynamicProperty(DP.damage, d);
}

export function setAnim(npc, index) {
  const i = clamp(Math.round(index), 0, ANIMS.length - 1);
  npc.setProperty("custom:anim", i);
  npc.setDynamicProperty(DP.anim, i);
}

export function setCommands(npc, text) {
  npc.setDynamicProperty(DP.commands, (text ?? "").toString().slice(0, 1024));
}

export function setFunctions(npc, text) {
  npc.setDynamicProperty(DP.functions, (text ?? "").toString().slice(0, 512));
}

export function setDialogue(npc, text) {
  npc.setDynamicProperty(DP.dialogue, (text ?? "").toString().slice(0, 1024));
}

export function setTalk(npc, on) {
  npc.setDynamicProperty(DP.talk, !!on);
}

// ---------------------------------------------------------------------
// Tags
// ---------------------------------------------------------------------

export function addTags(npc, csv) {
  const added = [];
  for (const raw of (csv ?? "").split(/[,\n]/)) {
    const tag = raw.trim();
    if (tag.length === 0) continue;
    try {
      if (npc.addTag(tag)) added.push(tag);
    } catch (e) {
      /* invalid tag, skip */
    }
  }
  return added;
}

export function removeTag(npc, tag) {
  try {
    return npc.removeTag(tag);
  } catch (e) {
    return false;
  }
}

// ---------------------------------------------------------------------
// Command / function execution
// ---------------------------------------------------------------------

export function runCommands(npc, text) {
  const results = [];
  for (const raw of (text ?? "").split(/[;\n]/)) {
    let cmd = raw.trim();
    if (cmd.length === 0) continue;
    if (cmd.startsWith("/")) cmd = cmd.slice(1);
    try {
      npc.runCommand(cmd);
      results.push({ cmd, ok: true });
    } catch (e) {
      results.push({ cmd, ok: false, error: String(e) });
    }
  }
  return results;
}

export function runFunctions(npc, text) {
  const results = [];
  for (const raw of (text ?? "").split(/[;\n,]/)) {
    const fn = raw.trim();
    if (fn.length === 0) continue;
    try {
      npc.runCommand(`function ${fn}`);
      results.push({ fn, ok: true });
    } catch (e) {
      results.push({ fn, ok: false, error: String(e) });
    }
  }
  return results;
}

// ---------------------------------------------------------------------
// Dialogue helpers
// ---------------------------------------------------------------------

/** Split stored dialogue text into pages (separated by | or newline). */
export function dialoguePages(npc) {
  const text = getDP(npc, DP.dialogue, "");
  return text
    .split(/\||\n/)
    .map((p) => p.trim().replace(/&/g, "\u00a7"))
    .filter((p) => p.length > 0);
}

// ---------------------------------------------------------------------
// Bulk apply (used by presets / first spawn)
// ---------------------------------------------------------------------

export function applyConfig(npc, cfg) {
  if (cfg.name !== undefined) setName(npc, cfg.name);
  if (cfg.model !== undefined) setModel(npc, cfg.model);
  if (cfg.skin !== undefined) setSkin(npc, cfg.skin);
  if (cfg.size !== undefined) setSize(npc, cfg.size);
  if (cfg.look !== undefined) setLook(npc, cfg.look);
  if (cfg.move !== undefined) setMove(npc, cfg.move);
  if (cfg.hostile !== undefined) setHostile(npc, cfg.hostile);
  if (cfg.trader !== undefined) setTrader(npc, cfg.trader);
  if (cfg.god !== undefined) setGod(npc, cfg.god);
  if (cfg.damage !== undefined) setDamage(npc, cfg.damage);
  if (cfg.anim !== undefined) setAnim(npc, cfg.anim);
  if (cfg.commands !== undefined) setCommands(npc, cfg.commands);
  if (cfg.functions !== undefined) setFunctions(npc, cfg.functions);
  if (cfg.dialogue !== undefined) setDialogue(npc, cfg.dialogue);
  if (cfg.talk !== undefined) setTalk(npc, cfg.talk);
}

/** Apply defaults the first time an NPC is edited / spawned. */
export function ensureInit(npc) {
  if (npc.getDynamicProperty(DP.init)) {
    // Safety refresh so visuals match saved state after reloads.
    refreshTexture(npc);
    return;
  }
  applyConfig(npc, DEFAULTS);
  npc.setDynamicProperty(DP.init, true);
}
