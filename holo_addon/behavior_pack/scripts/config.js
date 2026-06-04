// =====================================================================
//  Floating Holograms Pro - Configuration constants
// =====================================================================

export const HOLO_ID = "holo:hologram";

// Items
export const PROJECTOR_ID = "holo:projector"; // opens the main hub / creates
export const WAND_ID = "holo:wand";           // edits the nearest hologram

// Dynamic property keys stored on each hologram entity
export const DP = {
  text: "holo:text",          // raw multi-line text ("|" or newline separated)
  color: "holo:color",        // index into COLORS
  size: "holo:size",          // index into SIZES
  particleOn: "holo:particle_on",
  particleId: "holo:particle_id",
  pattern: "holo:pattern",    // index into PATTERNS
  anim: "holo:anim",          // index into ANIMS (bob / spin text effects)
  owner: "holo:owner",        // player name that created it
  init: "holo:init",
};

// World dynamic property: JSON array index of all hologram entity ids
export const WORLD_INDEX = "holo:index";

// ---------------------------------------------------------------------
// Text colours (Minecraft section codes). label shown in the menu.
// ---------------------------------------------------------------------
export const COLORS = [
  { label: "Cian",      code: "b" },
  { label: "Aqua claro", code: "3" },
  { label: "Blanco",    code: "f" },
  { label: "Amarillo",  code: "e" },
  { label: "Verde",     code: "a" },
  { label: "Rojo",      code: "c" },
  { label: "Morado",    code: "d" },
  { label: "Azul",      code: "9" },
  { label: "Oro",       code: "6" },
  { label: "Gris",      code: "7" },
];

// ---------------------------------------------------------------------
// Hologram scale tiers. event matches the entity behaviour file.
// ---------------------------------------------------------------------
export const SIZES = [
  { label: "Diminuto",  value: 0.5, event: "holo:size_xs" },
  { label: "Pequeno",   value: 0.8, event: "holo:size_s" },
  { label: "Normal",    value: 1.0, event: "holo:size_m" },
  { label: "Grande",    value: 1.4, event: "holo:size_l" },
  { label: "Enorme",    value: 2.0, event: "holo:size_xl" },
  { label: "Colosal",   value: 3.0, event: "holo:size_xxl" },
];

// ---------------------------------------------------------------------
// Editable particle effects (label -> particle id). First two are custom.
// ---------------------------------------------------------------------
export const PARTICLES = [
  { label: "Chispa holo (custom)", id: "holo:spark" },
  { label: "Haz holo (custom)",    id: "holo:beam" },
  { label: "Final (end rod)",      id: "minecraft:end_rod" },
  { label: "Portal",               id: "minecraft:portal_particle" },
  { label: "Encantamiento",        id: "minecraft:enchanting_table_particle" },
  { label: "Corazones",            id: "minecraft:heart_particle" },
  { label: "Nota",                 id: "minecraft:note_particle" },
];

// ---------------------------------------------------------------------
// 3D particle arrangement patterns (drawn around the hologram by script).
// ---------------------------------------------------------------------
export const PATTERNS = [
  "Anillo giratorio",
  "Helice (espiral)",
  "Halo (corona)",
  "Orbita doble",
  "Lluvia ascendente",
];

// ---------------------------------------------------------------------
// Text animation effects applied to the floating text by the script.
// ---------------------------------------------------------------------
export const ANIMS = [
  "Ninguna",
  "Flotar (sube/baja)",
  "Latido (color brilla)",
  "Escribiendo (typewriter)",
];

// Default configuration for a freshly created hologram
export const DEFAULTS = {
  text: "Hola mundo|&7Linea de ejemplo",
  color: 0,        // cyan
  size: 2,         // normal
  particleOn: true,
  particleId: "holo:spark",
  pattern: 0,
  anim: 0,
};

export const MAX_TEXT_LEN = 512;

// How far the wand looks for a hologram to edit
export const WAND_REACH = 24;
