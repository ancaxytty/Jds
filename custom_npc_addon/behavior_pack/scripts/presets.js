// =====================================================================
//  Custom NPC Pro Editor - Preset save / load system
//  Presets are stored as JSON in WORLD dynamic properties so they can be
//  reused across any NPC and survive world reloads.
// =====================================================================
import { world } from "@minecraft/server";
import { WORLD_PRESETS_INDEX, WORLD_PRESET_PREFIX } from "./config.js";
import { getConfig, applyConfig } from "./npc.js";

function readIndex() {
  const raw = world.getDynamicProperty(WORLD_PRESETS_INDEX);
  if (!raw) return [];
  try {
    const arr = JSON.parse(raw);
    return Array.isArray(arr) ? arr : [];
  } catch (e) {
    return [];
  }
}

function writeIndex(names) {
  world.setDynamicProperty(WORLD_PRESETS_INDEX, JSON.stringify(names));
}

/** List all saved preset names. */
export function listPresets() {
  return readIndex();
}

/** Save the current configuration of an NPC under a preset name. */
export function savePreset(npc, name) {
  const clean = (name ?? "").trim().slice(0, 32);
  if (clean.length === 0) return false;
  const cfg = getConfig(npc);
  world.setDynamicProperty(WORLD_PRESET_PREFIX + clean, JSON.stringify(cfg));
  const idx = readIndex();
  if (!idx.includes(clean)) {
    idx.push(clean);
    writeIndex(idx);
  }
  return true;
}

/** Load a saved preset onto an NPC. */
export function loadPreset(npc, name) {
  const raw = world.getDynamicProperty(WORLD_PRESET_PREFIX + name);
  if (!raw) return false;
  try {
    const cfg = JSON.parse(raw);
    applyConfig(npc, cfg);
    return true;
  } catch (e) {
    return false;
  }
}

/** Delete a saved preset. */
export function deletePreset(name) {
  world.setDynamicProperty(WORLD_PRESET_PREFIX + name, undefined);
  const idx = readIndex().filter((n) => n !== name);
  writeIndex(idx);
  return true;
}
