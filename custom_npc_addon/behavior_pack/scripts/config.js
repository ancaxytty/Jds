// =====================================================================
//  Custom NPC Pro Editor - Configuration constants
// =====================================================================

export const NPC_ID = "custom:npc";

// Dynamic property keys stored on each NPC entity
export const DP = {
  name: "npc:name",
  skin: "npc:skin",
  size: "npc:size",
  look: "npc:look",
  hostile: "npc:hostile",
  trader: "npc:trader",
  god: "npc:god",
  damage: "npc:damage",
  anim: "npc:anim",
  commands: "npc:commands",
  functions: "npc:functions",
  init: "npc:init",
};

// World dynamic property holding the JSON array of preset names
export const WORLD_PRESETS_INDEX = "npc:presets_index";
export const WORLD_PRESET_PREFIX = "npc:preset:";

// Skin catalogue - order MUST match the render controller Array.skins
export const SKINS = [
  "§aClasico",
  "§9Guardia",
  "§dMago",
  "§6Aldeano",
  "§7Caballero",
  "§cRealeza",
  "§8Ninja",
  "§fMedico",
];

// Size tiers - index maps to the entity event triggered
export const SIZES = [
  { label: "§7Diminuto §8(0.5x)", value: 0.5, event: "npc:size_xs" },
  { label: "§7Pequeno §8(0.75x)", value: 0.75, event: "npc:size_s" },
  { label: "§aNormal §8(1.0x)", value: 1.0, event: "npc:size_m" },
  { label: "§eGrande §8(1.5x)", value: 1.5, event: "npc:size_l" },
  { label: "§6Gigante §8(2.0x)", value: 2.0, event: "npc:size_xl" },
  { label: "§cColosal §8(3.0x)", value: 3.0, event: "npc:size_xxl" },
];

// Animations - index maps to the custom:anim entity property value
export const ANIMS = [
  "§7Ninguna (idle)",
  "§eSaludar",
  "§aAsentir",
  "§bGirar",
  "§dBailar",
];

// Default configuration applied to a freshly spawned NPC
export const DEFAULTS = {
  name: "§aNPC Personalizado",
  skin: 0,
  size: 2, // index in SIZES -> Normal
  look: true,
  hostile: false,
  trader: false,
  god: false,
  damage: 4,
  anim: 0,
  commands: "",
  functions: "",
};

export const MAX_DAMAGE = 100;
