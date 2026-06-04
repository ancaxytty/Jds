# Custom NPC Pro Editor — Minecraft Bedrock Addon

> NPCs ultra personalizables con **30 modelos 3D profesionales** (cada uno con su textura
> propia), **intercambios editables (tienda)**, **diálogos estilo pergamino**,
> **partículas 3D custom**, comandos que se ejecutan al guardar o al tocar, y mucho más.

**Versión:** 6.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** no requeridos

---

## 🆕 Novedades v6.0.0

- 🪄 **Varita 3D requerida para editar**: el editor del NPC **solo abre** si sostienes la
  **Varita de NPC** (`custom:npc_wand`), un ítem con **modelo 3D (model.json) y textura 3D**.
  Sin varita, tocar el NPC abre la tienda / diálogo. Consíguela con `!npc` o
  `/give @s custom:npc_wand`.
- ✨ **Sistema de partículas editables**: en el editor → **Partículas** eliges el **efecto**
  (Aura 3D custom, llama, corazones, portal, end rod, nota…) y el **patrón 3D** (anillo,
  hélice, fuente, órbita doble, corona) y on/off. Cada NPC guarda su propia config.
- 🧱 **Texturas sin solape (bleeding)**: el atlas usa más padding entre caras para que las
  texturas de los modelos no "colisionen".

---

## 🆕 Novedades v5.0.0

- 🏆 **30 modelos 3D profesionales** (multi-cubo, se ven 3D de verdad): Mecha Robot,
  Caballero, Mago, Golem, Rey Slime, Dron, Pingüino, Zorro, Mech Pesado, Treant, Dragón,
  Esqueleto Rey, Ninja, Mago Oscuro, Robot Dorado, Oso, Gato, Demonio, Ángel, Pirata,
  Astronauta, Samurái, Reina Abeja, Lobo, Cristal Viviente, Tortuga, Hongo, Fantasma,
  Gárgola, Rey Dorado.
- 🎨 **Texturas mejoradas**: degradado por cara, bordes y detalles (ojos, gemas, paneles
  brillantes, vetas de madera). Cada modelo tiene **su propia `texture.png`**.
- 🛒 **Intercambios editables (Tienda)**: define qué pide y qué da el NPC (con 1 o 2 items
  de coste). Al tocar el NPC con la tienda activada se abre una **pantalla de comercio**
  funcional que descuenta y entrega los items reales.
- ⌨️ **Comandos**: se ejecutan **al guardar** y opción de **ejecutar al tocar (click)**.
- ✨ **Partículas 3D custom**: un anillo 3D giratorio de partículas brillantes rodea a
  cada NPC (efecto animado en 3D).
- 🖼️ **pack_icon profesional** nuevo (cabeza 3D isométrica + engranaje + destellos).

## 🎛️ Personalización
Nombre · Skin (8) · **30 modelos 3D (textura propia)** · Tamaño (6) · Animaciones (5) ·
Mirar al jugador · Movimiento on/off · Hostil + Daño (0–100) · Inmortal · Diálogos
pergamino · **Tienda editable** · Tags · Comandos (guardar/click) · Funciones · Presets ·
Acciones.

---

## 🛒 Intercambios (Tienda)
1. Editor → **Comportamiento** → activa **Comerciante**.
2. Editor → **Intercambios (Tienda)** → **+ Añadir intercambio**: elige el item que pide
   (y opcionalmente un 2º), la cantidad, y el item/cantidad que entrega. Puedes usar items
   del menú o escribir un **ID personalizado** (ej. `minecraft:netherite_ingot`).
3. Usa **Vista previa de la tienda** para probarla.
4. Al **tocar** el NPC se abre la tienda; al elegir un intercambio se descuentan los items
   del jugador y se entrega la recompensa.

> Nota técnica honesta: Minecraft Bedrock no permite **generar tablas de trade vanilla**
> dinámicamente, por eso la tienda es una **pantalla por script totalmente funcional**
> (descuenta/entrega items reales) con estilo de comercio, en vez de la pantalla vanilla
> exacta del aldeano.

## 🧊 Modelos 3D con textura propia
```
resource_pack/models/entity/model-N/
├── model.json     (identifier: geometry.model_N)
└── texture.png    (textura propia del modelo)
```
Para usar tu modelo de Blockbench: exporta la geometría + textura, reemplaza esos dos
archivos y deja el `identifier` como `geometry.model_N`.

## 💬 Diálogos (pergamino)
Editor → **Diálogos** → texto separado por `|` + "Hablar al tocar". Para el look completo
de pergamino, activa el pack opcional **`ui_theme_pack`** por encima del resource pack.

## ✨ Partículas 3D
Se emiten automáticamente alrededor de cada NPC cercano (anillo 3D giratorio). La partícula
está en `resource_pack/particles/npc_aura.particle.json`.

---

## 📥 Instalación
- **`custom_npc_addon.mcaddon`**: importa los 3 packs (behavior + resource + tema UI
  opcional). Activa **behavior + resource**; el tema de UI es opcional.
- O importa los `.mcpack` por separado.

## 🎮 Uso
`!npc` en el chat (o `/summon custom:npc`) → coloca → **toca** el NPC:
tienda / diálogo / editor · **sneak + toca** = editor.

---

## ⚠️ Sobre el formulario horizontal
Pediste el menú en horizontal. La **orientación** de los formularios la controla el
**JSON-UI** interno de Minecraft, que cambia entre versiones y, si se sobreescribe mal,
**rompe los menús**. Como no puedo probarlo dentro del juego aquí, **no incluyo** un
override que pueda romper tu UI. En su lugar mejoré el menú con **iconos**, organización y
una **pantalla de tienda** dinámica. Si me dices tu **versión exacta** de Minecraft, te
preparo el JSON-UI horizontal a medida.

## 🎨 Regenerar assets
```bash
python3 _tools/gen_textures.py   # skins humanoides + (icons antiguos)
python3 _tools/gen_models.py     # 30 modelos pro + texturas + pack_icon + entity/render
python3 _tools/gen_ui.py         # tema pergamino (ui_theme_pack)
```

---
Addon creado con **Kiro AI Assistant** · *Custom NPC Pro Editor v5.0.0*
