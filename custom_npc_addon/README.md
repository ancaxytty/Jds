# Custom NPC Pro Editor — Minecraft Bedrock Addon

> NPCs totalmente personalizables mediante un **menú interactivo en el juego**.
> Toca un NPC para **editarlo o hablar con él**; agáchate (sneak) + toca para abrir siempre el editor.

**Versión:** 3.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** no requeridos

---

## ✨ Características

| Función | Descripción |
|---|---|
| 🪧 **Nombre** | Cambia el nombre (colores con `&`, ej. `&bAzul`). |
| 🎨 **Skin** | 8 skins para el modelo Humanoide. |
| 🧊 **Modelos 3D** | Botón **Modelos** con 30 modelos 3D intercambiables (`model-1`…`model-30`). |
| 📏 **Tamaño** | 6 tamaños: Diminuto (0.5x) → Colosal (3.0x). |
| 💃 **Animaciones** | Idle, Saludar, Asentir, Girar, Bailar (modelo humanoide). |
| 👁️ **Mirar al jugador** | On/Off. |
| 🚶 **Movimiento** | **Se mueve / no se mueve** (camina o queda estático). |
| ⚔️ **Hostil + Daño** | Enemigo con daño configurable (0–100). |
| 🛡️ **Inmortal** | Modo invulnerable. |
| 💬 **Diálogos custom** | Crea diálogos por páginas (separadas con `|`) que se muestran al tocar. |
| 🏷️ **Etiquetas (tags)** | Añadir / eliminar. |
| ⌨️ **Comandos** | Ejecuta y guarda comandos desde el NPC. |
| 📜 **Funciones** | Ejecuta archivos `.mcfunction`. |
| 🛒 **Comerciante** | Tienda al tocar. |
| 💾 **Presets** | Guarda y reutiliza configuraciones completas. |
| 🧰 **Acciones** | Traer/teleportar, curar, clonar, dar huevo, eliminar. |

Todo se **guarda automáticamente** y persiste al cerrar el mundo.

---

## 🧊 Modelos 3D (model.json) — cómo funciona

El addon incluye **30 modelos cubo de relleno** listos para reemplazar por los tuyos:

```
resource_pack/models/entity/
├── model-1/model.json     (geometry.cube_model_1)
├── model-2/model.json     (geometry.cube_model_2)
├── ...
└── model-30/model.json    (geometry.cube_model_30)
```

- En el editor: botón **Modelos 3D** → elige **Humanoide** o **Modelo 3D 1..30**.
- Cada cubo usa la textura por defecto `textures/entity/models/cube.png`.

### Subir tus propios modelos de Blockbench
1. En Blockbench: *File → Export → Bedrock Geometry* (`.json`).
2. Pega tu archivo en `models/entity/model-N/model.json` (reemplaza el cubo).
3. **IMPORTANTE:** dentro del archivo, cambia el `identifier` a **`geometry.cube_model_N`**
   (el mismo número de la carpeta) para que el addon lo reconozca.
4. (Opcional) Reemplaza `textures/entity/models/cube.png` por la textura de tu modelo,
   o edita el render controller para usar texturas por modelo.
5. En el juego, abre el editor → **Modelos 3D** → selecciona ese número.

> Los modelos 3D usan la textura "cube"; las 8 skins humanoides aplican al modelo Humanoide.

---

## 💬 Diálogos custom

1. Editor → **Diálogos**.
2. Escribe el texto; separa páginas con `|`. Ej: `Hola!|Bienvenido|Vuelve pronto`.
3. Activa **"Hablar al tocar"**.
4. Ahora un **toque normal** muestra el diálogo; **sneak + toque** abre el editor.

---

## 📥 Instalación

### `.mcaddon` (recomendada)
1. Descarga **`custom_npc_addon.mcaddon`** y ábrelo (Minecraft lo importa solo).
2. Al crear/editar el mundo, activa **ambos** packs (behavior + resource).

### `.mcpack` individuales
Importa `behavior_pack.mcpack` y `resource_pack.mcpack` por separado.

> El behavior y el resource pack están **vinculados**: actívalos **los dos**.

---

## 🎮 Uso rápido
1. Escribe `!npc` en el chat para recibir el huevo (o `/give @s custom:npc_spawn_egg`, o `/summon custom:npc`).
2. Coloca el NPC.
3. **Toca** el NPC → editar o hablar · **sneak + toca** → editor.

---

## 🔧 Cómo funciona (técnico)

- **Modelo / Skin / Animación:** propiedades de entidad (`custom:model`, `custom:skin`,
  `custom:anim`, `client_sync`) leídas por el *render controller* (arrays `Array.geos` y
  `Array.skins`) y el *animation controller* vía `query.property(...)`.
- **Tamaño / Mirar / Movimiento / Hostil / Inmortal / Tienda:** `component_groups`
  activados por eventos (`npc:size_*`, `npc:move_on/off`, `npc:look_*`, etc.).
- **No moverse:** grupo `npc:frozen` (`minecraft:movement = 0`) y se quita `npc:wander`.
- **Daño configurable:** el grupo hostil ataca con daño 0; el daño real se aplica por
  script en `entityHitEntity` con `applyDamage(...)`.
- **Diálogos:** se guardan en una *dynamic property* y se muestran con `MessageFormData`.
- **Persistencia:** *dynamic properties* + *component groups*; presets en *dynamic
  properties* del mundo.

---

## 🎨 Regenerar assets

```bash
python3 _tools/gen_textures.py   # 8 skins humanoides + icons
python3 _tools/gen_models.py     # cube.png + 30 model.json + entity/render controller
```

---

## 🐞 Solución de problemas

| Problema | Solución |
|---|---|
| El menú no abre | Requiere **1.21.0+** y el **behavior pack** activo (trae los scripts). |
| El modelo 3D no cambia | Verifica que el `identifier` del `model.json` sea `geometry.cube_model_N`. |
| La skin no se ve en un modelo 3D | Las skins son para Humanoide; los modelos usan la textura "cube". |
| No habla | Activa "Hablar al tocar" en Diálogos y escribe texto. |
| No se queda quieto | Desactiva "Se mueve / camina" en Comportamiento. |

---

Addon creado con **Kiro AI Assistant** · Uso libre para proyectos personales y educativos.
— *Custom NPC Pro Editor v3.0.0*
