# Custom NPC Pro Editor — Minecraft Bedrock Addon

NPCs totalmente personalizables mediante un **menú interactivo en el juego**.
Toca / haz click derecho a un NPC y configura **nombre, skin, tamaño, animaciones,
daño, comportamiento, comandos, funciones, etiquetas y presets** — sin tocar ningún archivo.

**Versión:** 2.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** no requeridos

---

## ⬇️ Descargas

| Archivo | Para qué sirve |
|---|---|
| [`custom_npc_addon.mcaddon`](custom_npc_addon.mcaddon) | **Instalación con 1 clic** (behavior + resource pack). |
| [`custom_npc_addon/behavior_pack.mcpack`](custom_npc_addon/behavior_pack.mcpack) | Solo el behavior pack (scripts + entidad). |
| [`custom_npc_addon/resource_pack.mcpack`](custom_npc_addon/resource_pack.mcpack) | Solo el resource pack (texturas + modelo). |
| [`custom_npc_addon_complete.zip`](custom_npc_addon_complete.zip) | Código fuente completo + paquetes. |

> Para descargar un archivo: ábrelo en GitHub y pulsa **Download** (o el botón **Raw**).

---

## ✨ Qué puedes personalizar

- 🪧 **Nombre** (con colores usando `&`)
- 🎨 **Skin** — 8 incluidas: Clásico, Guardia, Mago, Aldeano, Caballero, Realeza, Ninja, Médico
- 📏 **Tamaño** — de Diminuto (0.5x) a Colosal (3.0x)
- 💃 **Animaciones** — Idle, Saludar, Asentir, Girar, Bailar
- 👁️ **Mirar al jugador** (on/off)
- ⚔️ **Hostil + Daño** configurable (0–100)
- 🛡️ **Inmortal** (invulnerable)
- 🏷️ **Etiquetas (tags)** — añadir / eliminar
- ⌨️ **Comandos** — ejecutar y guardar
- 📜 **Funciones** `.mcfunction`
- 🛒 **Comerciante** — abre tienda al tocar
- 💾 **Presets** — guarda y reutiliza configuraciones
- 🧰 **Acciones** — traer/teleportar, curar, clonar, dar huevo, eliminar

Todo se **guarda automáticamente** y persiste al cerrar el mundo.

---

## 📥 Instalación rápida

1. Descarga **`custom_npc_addon.mcaddon`** y ábrelo (Minecraft lo importa solo).
2. Al crear/editar el mundo, activa **ambos** packs (behavior + resource).
3. En el chat escribe `!npc` para recibir el **huevo generador** (o `/give @s custom:npc_spawn_egg`, o `/summon custom:npc`).
4. Coloca el NPC y **tócalo** para abrir el editor.

> El behavior y el resource pack están vinculados: actívalos **los dos**.

---

## 📚 Documentación completa

Consulta **[`custom_npc_addon/README.md`](custom_npc_addon/README.md)** para:
detalles técnicos, estructura del proyecto, cómo regenerar las texturas y
solución de problemas.

---

## 🛠️ Tecnología

- **Script API** de Minecraft Bedrock: `@minecraft/server` `1.11.0` + `@minecraft/server-ui` `1.2.0`
- Skins y animaciones controladas por **propiedades de entidad** (`client_sync`)
- Tamaño y comportamientos vía **component groups** + eventos
- Daño configurable aplicado por script en `entityHitEntity`
- Persistencia con **dynamic properties**; presets guardados en el mundo

---

Addon creado con **Kiro AI Assistant** · Uso libre para proyectos personales y educativos.
