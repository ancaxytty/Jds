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
  runOnClick: "npc:run_on_click",
  functions: "npc:functions",
  dialogue: "npc:dialogue",
  talk: "npc:talk",
  trades: "npc:trades",
  particleOn: "npc:particle_on",
  particleId: "npc:particle_id",
  particlePattern: "npc:particle_pattern",
  init: "npc:init",
};

// Item id of the 3D wand required to open the editor menu
export const WAND_ID = "custom:npc_wand";

// Editable particle effects (label -> particle id). First is the custom 3D aura.
export const PARTICLES = [
  { label: "§bAura 3D (custom)", id: "custom:npc_aura" },
  { label: "§cLlama", id: "minecraft:basic_flame_particle" },
  { label: "§dCorazones", id: "minecraft:heart_particle" },
  { label: "§aFeliz (aldeano)", id: "minecraft:villager_happy" },
  { label: "§eChispa final", id: "minecraft:end_rod" },
  { label: "§5Portal", id: "minecraft:portal_particle" },
  { label: "§fNota", id: "minecraft:note_particle" },
  { label: "§6Lava", id: "minecraft:lava_particle" },
  { label: "§7Humo", id: "minecraft:basic_smoke_particle" },
  { label: "§9Encantamiento", id: "minecraft:enchanting_table_particle" },
];

// Particle arrangement patterns (3D)
export const PATTERNS = [
  "§bAnillo giratorio",
  "§dHelice (espiral)",
  "§aFuente (arriba)",
  "§eOrbita doble",
  "§6Corona (halo)",
];

// Common items for the trade editor dropdown (label -> item id)
export const COMMON_ITEMS = [
  { label: "Esmeralda", id: "minecraft:emerald" },
  { label: "Diamante", id: "minecraft:diamond" },
  { label: "Lingote de oro", id: "minecraft:gold_ingot" },
  { label: "Lingote de hierro", id: "minecraft:iron_ingot" },
  { label: "Netherita", id: "minecraft:netherite_ingot" },
  { label: "Carbon", id: "minecraft:coal" },
  { label: "Lapislazuli", id: "minecraft:lapis_lazuli" },
  { label: "Redstone", id: "minecraft:redstone" },
  { label: "Manzana dorada", id: "minecraft:golden_apple" },
  { label: "Manzana dorada encantada", id: "minecraft:enchanted_golden_apple" },
  { label: "Pan", id: "minecraft:bread" },
  { label: "Espada de diamante", id: "minecraft:diamond_sword" },
  { label: "Pico de diamante", id: "minecraft:diamond_pickaxe" },
  { label: "Manzana", id: "minecraft:apple" },
  { label: "Cofre", id: "minecraft:chest" },
  { label: "Libro encantado", id: "minecraft:enchanted_book" },
  { label: "Perla de ender", id: "minecraft:ender_pearl" },
  { label: "Bloque de diamante", id: "minecraft:diamond_block" },
  { label: "Bloque de oro", id: "minecraft:gold_block" },
  { label: "TNT", id: "minecraft:tnt" },
];

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

// First 10 are professional humanoid/creature 3D models; all 30 are pro.
export const MODEL_NAMES = [
  "Mecha Robot", "Caballero", "Mago", "Golem", "Rey Slime",
  "Dron", "Pinguino", "Zorro", "Mech Pesado", "Treant",
  "Dragon", "Esqueleto Rey", "Ninja", "Mago Oscuro", "Robot Dorado",
  "Oso", "Gato", "Demonio", "Angel", "Pirata",
  "Astronauta", "Samurai", "Reina Abeja", "Lobo", "Cristal Viviente",
  "Tortuga", "Hongo", "Fantasma", "Gargola", "Rey Dorado",
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
    const nm = MODEL_NAMES[i - 1] || ("Modelo " + i);
    out.push(`§b★ §f${nm} §8#${i}`);
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
  runOnClick: false,
  functions: "",
  dialogue: "",
  talk: false,
  trades: "[]",
  particleOn: true,
  particleId: "custom:npc_aura",
  particlePattern: 0,
};

export const MAX_DAMAGE = 100;
