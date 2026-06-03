# Custom NPC Pro Editor — Minecraft Bedrock Addon

> NPCs totalmente personalizables mediante un **menú interactivo en el juego**.
> Toca / haz click derecho a un NPC y configura **nombre, skin, tamaño, animaciones,
> daño, comportamiento, comandos, funciones, etiquetas y presets** — sin tocar un solo archivo.

**Versión:** 2.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** NO requeridos

---

## ✨ Características

| Función | Descripción |
|---|---|
| 🪧 **Nombre** | Cambia el nombre del NPC (soporta colores con `&`, ej. `&bAzul`). |
| 🎨 **Skin** | 8 skins incluidas: Clásico, Guardia, Mago, Aldeano, Caballero, Realeza, Ninja, Médico. |
| 📏 **Tamaño** | 6 tamaños: Diminuto (0.5x) → Colosal (3.0x). Cambia hitbox y visual. |
| 💃 **Animaciones** | Idle, Saludar, Asentir, Girar y Bailar (en bucle). |
| 👁️ **Mirar al jugador** | Activa/desactiva que el NPC siga al jugador con la mirada. |
| ⚔️ **Hostil + Daño** | Conviértelo en enemigo y define el daño por golpe (0–100). |
| 🛡️ **Inmortal** | Modo invulnerable (ideal para NPCs decorativos). |
| 🏷️ **Etiquetas (tags)** | Añade y elimina tags para usarlos con tus comandos. |
| ⌨️ **Comandos** | Ejecuta y guarda comandos desde el NPC (separados por `;`). |
| 📜 **Funciones** | Ejecuta archivos `.mcfunction` desde el NPC. |
| 🛒 **Comerciante** | Activa una tienda (toca normal = comerciar, agáchate + toca = editor). |
| 💾 **Presets** | Guarda configuraciones completas y cárgalas en otros NPCs. |
| 🧰 **Acciones** | Traer/teleportar, curar, clonar, dar huevo generador o eliminar el NPC. |

Toda la configuración **se guarda automáticamente** y persiste al cerrar el mundo.

---

## 📥 Instalación

### Opción 1 — `.mcaddon` (recomendada)
1. Descarga **`custom_npc_addon.mcaddon`**.
2. Ábrelo: Minecraft lo importará automáticamente (behavior + resource pack).
3. Al crear/editar un mundo, activa **ambos** packs:
   - Behavior Pack: *Custom NPC | Pro Editor*
   - Resource Pack: *Custom NPC | Resources*
4. Activa **"Usar API Beta de Scripting de GameTest"** solo si tu versión lo pide.
   *(En 1.21+ no suele ser necesario porque usa APIs estables.)*

### Opción 2 — `.mcpack` individuales
Importa por separado `behavior_pack.mcpack` y `resource_pack.mcpack`.

> ⚠️ El behavior pack y el resource pack están **vinculados**: deben activarse **los dos**
> para que los scripts y las texturas funcionen.

---

## 🎮 Cómo usar

1. **Conseguir el NPC**
   - Escribe `!npc` en el chat para recibir el **huevo generador**, o
   - Usa el comando `/give @s custom:npc_spawn_egg`, o
   - Invócalo con `/summon custom:npc`.
2. **Coloca** el huevo para crear el NPC.
3. **Toca / click derecho** al NPC → se abre el **Editor de NPC**.
4. Navega por los botones y personaliza todo. Los cambios se aplican al instante.

---

## 🗂️ Estructura del proyecto

```
custom_npc_addon/
├── behavior_pack/
│   ├── manifest.json                 # módulo data + módulo script
│   ├── pack_icon.png
│   ├── entities/custom_npc.json      # propiedades, component_groups, eventos
│   ├── trading/custom_npc_trades.json
│   └── scripts/                      # Script API (@minecraft/server + server-ui)
│       ├── main.js                   # eventos: interacción, daño, chat
│       ├── ui.js                     # formularios del editor
│       ├── npc.js                    # leer/escribir configuración del NPC
│       ├── presets.js                # guardar/cargar presets
│       ├── config.js                 # constantes (skins, tamaños, anim...)
│       └── util.js                   # utilidades (forms con reintento, etc.)
└── resource_pack/
    ├── manifest.json
    ├── pack_icon.png
    ├── entity/custom_npc.entity.json
    ├── render_controllers/           # selección de skin por propiedad
    ├── animations/                   # idle, wave, nod, spin, dance
    ├── animation_controllers/        # máquina de estados de animación
    ├── models/entity/custom_npc.geo.json
    ├── textures/entity/              # custom_npc_0..7.png (8 skins)
    └── texts/                        # en_US, es_ES, es_MX
```

---

## 🔧 Cómo funciona (técnico)

- **Skin / Animación:** propiedades de entidad declaradas (`custom:skin`, `custom:anim`,
  `client_sync`) leídas por el *render controller* y el *animation controller* vía
  `query.property(...)`. El script las cambia con `setProperty`.
- **Tamaño:** `component_groups` con `minecraft:scale` activados por eventos `npc:size_*`.
- **Mirar / Hostil / Inmortal / Comerciante:** `component_groups` añadidos/quitados por eventos.
- **Daño configurable:** el grupo hostil ataca con daño 0; el daño real se aplica por script
  en `entityHitEntity` con `applyDamage(...)`, permitiendo cualquier valor.
- **Persistencia:** se usan *dynamic properties* (por NPC) y los *component groups* añadidos,
  que Minecraft guarda con el mundo. Los **presets** se guardan en *dynamic properties* del mundo.
- **Formularios fiables:** se reintenta `form.show()` cuando el jugador está ocupado
  (`FormCancelationReason.UserBusy`), evitando que el menú no abra tras interactuar.

---

## 🎨 Regenerar las texturas

Las skins y los iconos se generan con un script en Python puro (sin dependencias):

```bash
python3 _tools/gen_textures.py
```

Edita la lista `SKINS` en `_tools/gen_textures.py` para crear o cambiar skins
(colores de piel, ropa, pantalón y pelo).

---

## 🐞 Solución de problemas

| Problema | Solución |
|---|---|
| El menú no abre | Asegúrate de tener **1.21.0+** y de activar el **behavior pack** (es el que trae los scripts). |
| El NPC no aparece | Activa también el **resource pack**; reinicia el mundo. |
| La skin se ve rara | Verifica que el resource pack esté activo (desactívalo y reactívalo). |
| No comercia | Activa "Comerciante" en *Comportamiento*; toca normal para comerciar. |
| Scripts no cargan | Si tu versión lo pide, activa "API Beta de Scripting" en los ajustes del mundo. |

---

## 📝 Licencia y créditos

Uso libre para proyectos personales y educativos.
Addon creado con **Kiro AI Assistant**.

— *Custom NPC Pro Editor v2.0.0*
