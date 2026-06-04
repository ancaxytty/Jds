# Custom NPC Pro Editor — Minecraft Bedrock Addon

<p align="center">
  <img src="promo/voxel_forge_promo.gif" alt="Vídeo promocional animado" width="640" />
</p>

> 🎬 **Vídeo promocional animado** arriba (GIF). Versión HD en HTML5 con sonido y
> opción de grabar a vídeo `.webm` en [`promo/index.html`](promo/index.html).
> Descarga: [`voxel-forge-promo.zip`](voxel-forge-promo.zip).

NPCs totalmente personalizables mediante un **menú interactivo en el juego**, con
**modelos 3D profesionales** (textura independiente por modelo) y **diálogos estilo pergamino**.
Toca un NPC para **editarlo o hablar con él**; agáchate (sneak) + toca para abrir siempre el editor.

**Versión:** 4.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** no requeridos

### 🆕 v6.0.0
- 🪄 **Varita 3D** (`custom:npc_wand`, modelo + textura 3D) **requerida para abrir el editor**. Consíguela con `!npc`.
- ✨ **Partículas editables**: elige efecto (aura 3D custom, llama, corazones, portal…) y patrón 3D (anillo, hélice, fuente, órbita, corona).
- 🧱 Texturas de modelos **sin solape/bleeding** (más padding en el atlas).

### 🆕 v5.0.0
- 🏆 **30 modelos 3D profesionales** (multi-cubo) con **textura propia** cada uno.
- 🎨 Texturas mejoradas (degradados, bordes, detalles) y **pack_icon profesional** nuevo.
- 🛒 **Intercambios editables (Tienda)**: define items de coste/recompensa; al tocar se abre una pantalla de comercio funcional.
- ⌨️ Comandos que se ejecutan **al guardar** y/o **al tocar (click)**.
- ✨ **Partículas 3D custom** (anillo giratorio) alrededor de cada NPC.

### 🆕 v4.0.0
- 🧊 **Textura independiente por modelo**: cada carpeta `model-N` tiene su propio `model.json` **y** `texture.png`.
- 🏆 **10 modelos 3D profesionales**: Mecha Robot, Caballero, Mago, Golem, Rey Slime, Dron, Pingüino, Zorro, Mech Pesado, Treant (+20 cubos-criatura).
- 💬 **Diálogos estilo pergamino** (referencia "Village Elder"): nombre del hablante, texto en pergamino, paginado.
- 📜 **Texture pack opcional** ([`ui_theme_pack.mcpack`](ui_theme_pack.mcpack)) con look de pergamino + marco de piedra para los formularios.

---

## ⬇️ Descargas

| Archivo | Para qué sirve |
|---|---|
| [`custom_npc_v6.mcaddon`](custom_npc_v6.mcaddon) | **Instalación con 1 clic** (behavior + resource pack). |
| [`custom_npc_addon/behavior_pack.mcpack`](custom_npc_addon/behavior_pack.mcpack) | Solo el behavior pack (scripts + entidad). |
| [`custom_npc_addon/resource_pack.mcpack`](custom_npc_addon/resource_pack.mcpack) | Solo el resource pack (texturas + modelos). |
| [`custom_npc_addon_complete.zip`](custom_npc_addon_complete.zip) | Código fuente completo + paquetes. |

> Para descargar: abre el archivo en GitHub y pulsa **Download** / **Raw**.

---

## ✨ Novedades v3.0.0

- 🧊 **Modelos 3D (model.json):** botón **Modelos** con **30 modelos** intercambiables
  (`model-1`…`model-30`), cada uno un cubo por defecto listo para reemplazar por tu modelo de Blockbench.
- 💬 **Diálogos custom:** crea diálogos por páginas que se muestran al tocar el NPC.
- 🚶 **Movimiento on/off:** que el NPC **camine o se quede estático**.
- 🔧 JSON mejorado (propiedades de entidad, component groups y eventos nuevos).

## ✨ Personalización completa

Nombre · Skin (8) · **Modelos 3D (30)** · Tamaño (6) · Animaciones (5) · Mirar al jugador ·
**Movimiento** · Hostil + **Daño (0–100)** · Inmortal · **Diálogos** · Tags · Comandos ·
Funciones · Comerciante · **Presets** · Acciones (traer, teleportar, curar, clonar, eliminar).

Todo se **guarda automáticamente** y persiste al cerrar el mundo.

---

## 🧊 Modelos 3D — estructura

```
resource_pack/models/entity/
├── model-1/model.json     (geometry.cube_model_1)
├── ...
└── model-30/model.json    (geometry.cube_model_30)
```

Para usar tu propio modelo de Blockbench: exporta la geometría, pégala en
`model-N/model.json` y cambia su `identifier` a `geometry.cube_model_N`
(el mismo número de carpeta). Luego elígelo en el editor → **Modelos 3D**.

Más detalles en **[`custom_npc_addon/README.md`](custom_npc_addon/README.md)**.

---

## 📥 Instalación rápida

1. Descarga **`custom_npc_v6.mcaddon`** y ábrelo (Minecraft lo importa solo).
2. Activa **ambos** packs (behavior + resource) en el mundo.
3. En el chat escribe `!npc` para el huevo (o `/summon custom:npc`).
4. **Toca** el NPC → editar/hablar · **sneak + toca** → editor.

> El behavior y el resource pack están vinculados: actívalos **los dos**.

---

## 🛠️ Tecnología

- **Script API** de Minecraft Bedrock: `@minecraft/server` `1.11.0` + `@minecraft/server-ui` `1.2.0`
- Geometría y textura intercambiables por **propiedades de entidad** (`custom:model`, `custom:skin`) vía render controller con arrays
- Movimiento y comportamientos vía **component groups** + eventos
- Daño configurable por script en `entityHitEntity`; diálogos con `MessageFormData`
- Persistencia con **dynamic properties**; presets guardados en el mundo

---

Addon creado con **Kiro AI Assistant** · Uso libre para proyectos personales y educativos.
