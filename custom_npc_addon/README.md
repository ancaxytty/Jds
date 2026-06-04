# Custom NPC Pro Editor — Minecraft Bedrock Addon

> NPCs totalmente personalizables con **menú interactivo en el juego**, **modelos 3D
> profesionales** con **textura independiente por modelo** y **diálogos estilo pergamino**.

**Versión:** 4.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** no requeridos

---

## ✨ Novedades v4.0.0

- 🧊 **Textura independiente por modelo:** cada carpeta `model-N` contiene **su propio**
  `model.json` **y** `texture.png`. Cambia uno sin afectar a los demás.
- 🏆 **10 modelos 3D profesionales** (multi-cubo, se ven 3D de verdad):
  **Mecha Robot, Caballero, Mago, Golem, Rey Slime, Dron, Pingüino, Zorro, Mech Pesado, Treant**.
  Los slots 11–30 son cubos-criatura temáticos (también con su textura propia).
- 💬 **Diálogos estilo pergamino** (inspirado en el cuadro "Village Elder"): nombre del
  hablante como título, texto en pergamino entre comillas, contador de página y botones claros.
- 📜 **Texture pack opcional** (`ui_theme_pack`) que da a los formularios un look de
  pergamino + marco de piedra + botones de madera.

## 🎛️ Personalización completa
Nombre · Skin (8) · **Modelos 3D (30, textura propia)** · Tamaño (6) · Animaciones (5) ·
Mirar al jugador · Movimiento on/off · Hostil + Daño (0–100) · Inmortal · **Diálogos** ·
Tags · Comandos · Funciones · Comerciante · Presets · Acciones.

---

## 🧊 Modelos 3D con textura propia — estructura

```
resource_pack/models/entity/
├── model-1/
│   ├── model.json      (geometry.model_1)   ← Mecha Robot
│   └── texture.png     (su textura propia)
├── model-2/  (Caballero)  ├ model.json + texture.png
├── ...
└── model-30/ (Cubo Criatura 20) ├ model.json + texture.png
```

Cada modelo usa **su propia textura** (índice dedicado en el render controller).
Las 8 skins humanoides solo aplican al modelo **Humanoide**.

### Cambiar un modelo y su textura (Blockbench)
1. En Blockbench exporta tu geometría (*Bedrock Geometry*) y su textura.
2. Reemplaza `model-N/model.json` y `model-N/texture.png`.
3. **Importante:** en el `model.json`, deja el `identifier` como **`geometry.model_N`**
   (el número de la carpeta). ¡Eso es todo!

---

## 💬 Diálogos (estilo pergamino)
1. Editor → **Diálogos** → escribe el texto; separa páginas con `|`.
2. Activa **"Hablar al tocar"**.
3. Toque normal = habla (cuadro con nombre + pergamino); **sneak + toque** = editor.

Para el look completo de pergamino con marco de piedra, activa el pack opcional
**`ui_theme_pack`** por encima del resource pack (ver su README).

---

## 📥 Instalación
- **`custom_npc_addon.mcaddon`**: ábrelo y Minecraft importa los 3 packs
  (behavior + resource + tema de UI opcional). Activa **behavior + resource**;
  el **tema de UI es opcional** (actívalo por encima del resource para el look pergamino).
- O importa los `.mcpack` por separado.

## 🎮 Uso
`!npc` en el chat (o `/summon custom:npc`) → coloca el NPC → **tócalo** para editar/hablar.

---

## 🔧 Técnico
- **Geometría y textura por propiedad**: `custom:model` (0..30) elige geometría;
  `custom:skin` (0..37) elige textura (0–7 humanoide, 8..37 = textura del modelo).
  El render controller usa `Array.geos[...]` y `Array.skins[...]` con `query.property`.
- **Comportamientos** por component groups + eventos (tamaño, mirar, movimiento, hostil,
  inmortal, comerciante).
- **Daño** configurable aplicado por script en `entityHitEntity`.
- **Persistencia** con dynamic properties; presets en el mundo.

## 🎨 Regenerar assets
```bash
python3 _tools/gen_textures.py   # skins humanoides + icons
python3 _tools/gen_models.py     # 10 modelos pro + 20 cubos + texturas + entity/render controller
python3 _tools/gen_ui.py         # texturas del tema pergamino (ui_theme_pack)
```

---
Addon creado con **Kiro AI Assistant** · *Custom NPC Pro Editor v4.0.0*
