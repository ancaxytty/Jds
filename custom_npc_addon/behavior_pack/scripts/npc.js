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
import { ItemStack } from "@minecraft/server";

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
    runOnClick: getDP(npc, DP.runOnClick, DEFAULTS.runOnClick),
    functions: getDP(npc, DP.functions, DEFAULTS.functions),
    dialogue: getDP(npc, DP.dialogue, DEFAULTS.dialogue),
    talk: getDP(npc, DP.talk, DEFAULTS.talk),
    trades: getDP(npc, DP.trades, DEFAULTS.trades),
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

export function setRunOnClick(npc, on) {
  npc.setDynamicProperty(DP.runOnClick, !!on);
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
// Trades (editable, functional, vanilla-like)
//   A trade = { wantId, wantQty, want2Id, want2Qty, giveId, giveQty }
//   Stored as JSON in DP.trades.
// ---------------------------------------------------------------------

export function getTrades(npc) {
  try {
    const arr = JSON.parse(getDP(npc, DP.trades, "[]"));
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

export function setTrades(npc, arr) {
  npc.setDynamicProperty(DP.trades, JSON.stringify(arr ?? []).slice(0, 8000));
}

export function addTrade(npc, trade) {
  const arr = getTrades(npc);
  arr.push(trade);
  setTrades(npc, arr);
}

export function updateTrade(npc, index, trade) {
  const arr = getTrades(npc);
  if (index >= 0 && index < arr.length) arr[index] = trade;
  setTrades(npc, arr);
}

export function removeTrade(npc, index) {
  const arr = getTrades(npc);
  if (index >= 0 && index < arr.length) arr.splice(index, 1);
  setTrades(npc, arr);
}

function countItem(container, id) {
  let total = 0;
  for (let i = 0; i < container.size; i++) {
    const it = container.getItem(i);
    if (it && it.typeId === id) total += it.amount;
  }
  return total;
}

function removeItem(container, id, qty) {
  let remaining = qty;
  for (let i = 0; i < container.size && remaining > 0; i++) {
    const it = container.getItem(i);
    if (it && it.typeId === id) {
      if (it.amount > remaining) {
        it.amount -= remaining;
        container.setItem(i, it);
        remaining = 0;
      } else {
        remaining -= it.amount;
        container.setItem(i, undefined);
      }
    }
  }
  return remaining === 0;
}

/** Attempt a trade for a player. Returns {ok, msg}. */
export function tryTrade(player, npc, index) {
  const t = getTrades(npc)[index];
  if (!t) return { ok: false, msg: "Intercambio no valido." };
  const inv = player.getComponent("minecraft:inventory");
  if (!inv || !inv.container) return { ok: false, msg: "Sin inventario." };
  const c = inv.container;

  const needs = [{ id: t.wantId, qty: t.wantQty }];
  if (t.want2Id && t.want2Qty > 0) needs.push({ id: t.want2Id, qty: t.want2Qty });

  for (const n of needs) {
    if (countItem(c, n.id) < n.qty) {
      return { ok: false, msg: "Te faltan items para este intercambio." };
    }
  }
  // try to give first (validate item id by constructing it)
  let giveStack;
  try {
    giveStack = new ItemStack(t.giveId, t.giveQty);
  } catch (e) {
    return { ok: false, msg: "Item de recompensa invalido: " + t.giveId };
  }
  // consume
  for (const n of needs) removeItem(c, n.id, n.qty);
  // give (drop overflow at player)
  const leftover = c.addItem(giveStack);
  if (leftover) {
    try { player.dimension.spawnItem(leftover, player.location); } catch (e) {}
  }
  return { ok: true, msg: "Intercambio realizado!" };
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
  if (cfg.runOnClick !== undefined) setRunOnClick(npc, cfg.runOnClick);
  if (cfg.functions !== undefined) setFunctions(npc, cfg.functions);
  if (cfg.dialogue !== undefined) setDialogue(npc, cfg.dialogue);
  if (cfg.talk !== undefined) setTalk(npc, cfg.talk);
  if (cfg.trades !== undefined) npc.setDynamicProperty(DP.trades, typeof cfg.trades === "string" ? cfg.trades : JSON.stringify(cfg.trades));
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
