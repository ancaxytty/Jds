// =====================================================================
//  Custom NPC Pro Editor - Configuration constants
// =====================================================================

export const NPC_ID = "custom:npc";

// Dynamic property keys stored on each NPC entity
export const DP = {
  name: "npc:name",
  skin: "npc:skin",
  model: "npc:model",
  size: "npc:size",
  look: "npc:look",
  move: "npc:move",
  hostile: "npc:hostile",
  trader: "npc:trader",
  god: "npc:god",
  damage: "npc:damage",
  anim: "npc:anim",
  commands: "npc:commands",
  functions: "npc:functions",
  dialogue: "npc:dialogue",
  talk: "npc:talk",
  init: "npc:init",
};

// World dynamic property holding the JSON array of preset names
export const WORLD_PRESETS_INDEX = "npc:presets_index";
export const WORLD_PRESET_PREFIX = "npc:preset:";

// Skin catalogue - order MUST match the render controller Array.skins
// (8 humanoid skins). The render controller also has a 9th texture (index 8)
// used automatically for the cube/3D models.
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

// Texture index reserved for the cube / 3D model skin (index 8 in Array.skins)
export const CUBE_SKIN_INDEX = 8;

// Number of 3D model.json placeholders (model-1 .. model-30)
export const MODEL_COUNT = 30;

// First 10 are professional multi-cube 3D models; rest are themed cubes.
export const MODEL_NAMES = [
  "Mecha Robot", "Caballero", "Mago", "Golem", "Rey Slime",
  "Dron", "Pinguino", "Zorro", "Mech Pesado", "Treant",
];

// Per-model texture index inside Array.skins: humanoid skins occupy 0..7,
// model textures occupy 8..(8+MODEL_COUNT-1). Model N (1-based) -> 7 + N.
export function modelTextureIndex(model) {
  return 7 + model;
}

// Model option labels: index 0 = humanoid, 1..30 = 3D models
export function modelLabels() {
  const out = ["§aHumanoide §8(usa skin)"];
  for (let i = 1; i <= MODEL_COUNT; i++) {
    const nm = MODEL_NAMES[i - 1] || ("Cubo Criatura " + (i - 10));
    const tag = i <= 10 ? "§b★ " : "§3";
    out.push(`${tag}${nm} §8#${i}`);
  }
  return out;
}

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
  model: 0, // 0 = humanoid
  size: 2, // index in SIZES -> Normal
  look: true,
  move: true,
  hostile: false,
  trader: false,
  god: false,
  damage: 4,
  anim: 0,
  commands: "",
  functions: "",
  dialogue: "",
  talk: false,
};

export const MAX_DAMAGE = 100;
