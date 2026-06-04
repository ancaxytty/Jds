// =====================================================================
//  Floating Holograms Pro - Hologram state management
//  Reads / writes the configuration of a single hologram entity.
//  Persistence uses dynamic properties + entity events, which survive
//  world reloads automatically.
// =====================================================================
import { world, system } from "@minecraft/server";
import {
  HOLO_ID,
  DP,
  DEFAULTS,
  COLORS,
  SIZES,
  PARTICLES,
  PATTERNS,
  ANIMS,
  MAX_TEXT_LEN,
} from "./config.js";
import { clamp, colorize, isValid } from "./util.js";

// ---------------------------------------------------------------------
// Low level getters
// ---------------------------------------------------------------------
function getDP(holo, key, fallback) {
  const v = holo.getDynamicProperty(key);
  return v === undefined ? fallback : v;
}

/** Read the full configuration object of a hologram. */
export function getConfig(holo) {
  return {
    text: getDP(holo, DP.text, DEFAULTS.text),
    color: getDP(holo, DP.color, DEFAULTS.color),
    size: getDP(holo, DP.size, DEFAULTS.size),
    particleOn: getDP(holo, DP.particleOn, DEFAULTS.particleOn),
    particleId: getDP(holo, DP.particleId, DEFAULTS.particleId),
    pattern: getDP(holo, DP.pattern, DEFAULTS.pattern),
    anim: getDP(holo, DP.anim, DEFAULTS.anim),
    owner: getDP(holo, DP.owner, ""),
  };
}

// ---------------------------------------------------------------------
// Text -> nameTag rendering
//   Lines separated by "|" or newline. "&" colour codes supported.
//   The chosen base colour is applied to lines without an explicit code.
// ---------------------------------------------------------------------
export function textLines(holo) {
  const raw = getDP(holo, DP.text, DEFAULTS.text);
  return raw
    .split(/\||\n/)
    .map((l) => l.replace(/\r/g, ""));
}

/** Rebuild the floating nameTag from stored text + colour (+ optional flash). */
export function refreshText(holo, flashCode) {
  const c = getConfig(holo);
  const base = COLORS[clamp(c.color, 0, COLORS.length - 1)]?.code ?? "b";
  const code = flashCode || base;
  const lines = textLines(holo).map((line) => {
    // If the line already contains a colour code, respect it; else apply base.
    const colored = colorize(line);
    return colored.includes("\u00a7") ? colored : `\u00a7${code}${colored}`;
  });
  try { holo.nameTag = lines.join("\n"); } catch (e) { /* ignore */ }
}

// ---------------------------------------------------------------------
// Setters - each persists + applies the change
// ---------------------------------------------------------------------
export function setText(holo, text) {
  const clean = (text ?? "").toString().slice(0, MAX_TEXT_LEN);
  holo.setDynamicProperty(DP.text, clean);
  refreshText(holo);
}

export function setColor(holo, index) {
  const i = clamp(Math.round(index), 0, COLORS.length - 1);
  holo.setDynamicProperty(DP.color, i);
  refreshText(holo);
}

export function setSize(holo, index) {
  const i = clamp(Math.round(index), 0, SIZES.length - 1);
  holo.setDynamicProperty(DP.size, i);
  try { holo.triggerEvent(SIZES[i].event); } catch (e) { /* ignore */ }
}

export function setParticles(holo, on, id, pattern) {
  holo.setDynamicProperty(DP.particleOn, !!on);
  if (id !== undefined) holo.setDynamicProperty(DP.particleId, String(id));
  if (pattern !== undefined) holo.setDynamicProperty(DP.pattern, pattern | 0);
}

export function setAnim(holo, index) {
  const i = clamp(Math.round(index), 0, ANIMS.length - 1);
  holo.setDynamicProperty(DP.anim, i);
  refreshText(holo);
}

export function setOwner(holo, name) {
  holo.setDynamicProperty(DP.owner, (name ?? "").toString().slice(0, 64));
}

// ---------------------------------------------------------------------
// Bulk apply + first-spawn init
// ---------------------------------------------------------------------
export function applyConfig(holo, cfg) {
  if (cfg.text !== undefined) setText(holo, cfg.text);
  if (cfg.color !== undefined) setColor(holo, cfg.color);
  if (cfg.size !== undefined) setSize(holo, cfg.size);
  if (cfg.particleOn !== undefined || cfg.particleId !== undefined || cfg.pattern !== undefined) {
    setParticles(
      holo,
      cfg.particleOn ?? true,
      cfg.particleId,
      cfg.pattern
    );
  }
  if (cfg.anim !== undefined) setAnim(holo, cfg.anim);
}

/** Apply defaults the first time a hologram is created / edited. */
export function ensureInit(holo) {
  if (holo.getDynamicProperty(DP.init)) {
    refreshText(holo);
    return;
  }
  applyConfig(holo, DEFAULTS);
  setSize(holo, DEFAULTS.size);
  holo.setDynamicProperty(DP.init, true);
}

// ---------------------------------------------------------------------
// World index of all holograms (for the "list" menu)
// ---------------------------------------------------------------------
export function listHolograms(dimensionFilter) {
  const out = [];
  for (const dimId of ["overworld", "nether", "the_end"]) {
    if (dimensionFilter && dimId !== dimensionFilter) continue;
    let dim;
    try { dim = world.getDimension(dimId); } catch (e) { continue; }
    let ents;
    try { ents = dim.getEntities({ type: HOLO_ID }); } catch (e) { continue; }
    for (const e of ents) out.push(e);
  }
  return out;
}

// ---------------------------------------------------------------------
// Create / remove
// ---------------------------------------------------------------------
export function createHologram(player, location) {
  const dim = player.dimension;
  const loc = location ?? {
    x: Math.floor(player.location.x) + 0.5,
    y: player.location.y + 1.6,
    z: Math.floor(player.location.z) + 0.5,
  };
  const holo = dim.spawnEntity(HOLO_ID, loc);
  ensureInit(holo);
  setOwner(holo, player.name);
  return holo;
}

export function removeHologram(holo) {
  try {
    if (typeof holo.remove === "function") holo.remove();
    else holo.kill();
    return true;
  } catch (e) {
    try { holo.kill(); return true; } catch (e2) { return false; }
  }
}

/** Find the hologram the player is looking at (raycast) or the nearest one. */
export function findTargetHologram(player, reach) {
  // 1) Try entity raycast (most precise).
  try {
    const hits = player.getEntitiesFromViewDirection({ maxDistance: reach, type: HOLO_ID });
    if (hits && hits.length) {
      const ent = hits[0].entity ?? hits[0];
      if (isValid(ent)) return ent;
    }
  } catch (e) { /* older API: ignore */ }

  // 2) Fallback: nearest hologram within reach.
  let best = null, bestD = Infinity;
  let ents;
  try { ents = player.dimension.getEntities({ location: player.location, maxDistance: reach, type: HOLO_ID }); }
  catch (e) { return null; }
  const p = player.location;
  for (const e of ents) {
    const d = (e.location.x - p.x) ** 2 + (e.location.y - p.y) ** 2 + (e.location.z - p.z) ** 2;
    if (d < bestD) { bestD = d; best = e; }
  }
  return best;
}

// ---------------------------------------------------------------------
// Movement helpers (used by the "move" menu)
// ---------------------------------------------------------------------
export function nudge(holo, dx, dy, dz) {
  const l = holo.location;
  try {
    holo.teleport({ x: l.x + dx, y: l.y + dy, z: l.z + dz }, { dimension: holo.dimension });
  } catch (e) { /* ignore */ }
}

export function moveToPlayerView(holo, player, distance = 3) {
  try {
    const dir = player.getViewDirection();
    const eye = player.getHeadLocation ? player.getHeadLocation() : player.location;
    holo.teleport({
      x: eye.x + dir.x * distance,
      y: eye.y + dir.y * distance,
      z: eye.z + dir.z * distance,
    }, { dimension: player.dimension });
  } catch (e) { /* ignore */ }
}
