// =====================================================================
//  Custom NPC Pro Editor - NPC state management
//  Reads / writes the configuration of a single NPC entity.
//  Persistence is handled by dynamic properties + entity properties +
//  component groups, all of which survive world reloads automatically.
// =====================================================================
import { DP, DEFAULTS, SIZES, SKINS, ANIMS, MAX_DAMAGE } from "./config.js";
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
    size: getDP(npc, DP.size, DEFAULTS.size),
    look: getDP(npc, DP.look, DEFAULTS.look),
    hostile: getDP(npc, DP.hostile, DEFAULTS.hostile),
    trader: getDP(npc, DP.trader, DEFAULTS.trader),
    god: getDP(npc, DP.god, DEFAULTS.god),
    damage: getDP(npc, DP.damage, DEFAULTS.damage),
    anim: getDP(npc, DP.anim, DEFAULTS.anim),
    commands: getDP(npc, DP.commands, DEFAULTS.commands),
    functions: getDP(npc, DP.functions, DEFAULTS.functions),
  };
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
  npc.setProperty("custom:skin", i);
  npc.setDynamicProperty(DP.skin, i);
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
// Bulk apply (used by presets / first spawn)
// ---------------------------------------------------------------------

export function applyConfig(npc, cfg) {
  if (cfg.name !== undefined) setName(npc, cfg.name);
  if (cfg.skin !== undefined) setSkin(npc, cfg.skin);
  if (cfg.size !== undefined) setSize(npc, cfg.size);
  if (cfg.look !== undefined) setLook(npc, cfg.look);
  if (cfg.hostile !== undefined) setHostile(npc, cfg.hostile);
  if (cfg.trader !== undefined) setTrader(npc, cfg.trader);
  if (cfg.god !== undefined) setGod(npc, cfg.god);
  if (cfg.damage !== undefined) setDamage(npc, cfg.damage);
  if (cfg.anim !== undefined) setAnim(npc, cfg.anim);
  if (cfg.commands !== undefined) setCommands(npc, cfg.commands);
  if (cfg.functions !== undefined) setFunctions(npc, cfg.functions);
}

/** Apply defaults the first time an NPC is edited / spawned. */
export function ensureInit(npc) {
  if (npc.getDynamicProperty(DP.init)) return;
  applyConfig(npc, DEFAULTS);
  npc.setDynamicProperty(DP.init, true);
}
