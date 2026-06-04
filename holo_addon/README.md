# Hologramas Flotantes Pro — Minecraft Bedrock Addon

> Crea y edita **hologramas de texto flotantes** totalmente personalizables con un
> **menu interactivo** (Form GUI), una **cuadricula custom con texturas e iconos
> propios**, **particulas 3D** alrededor de cada holograma y **texto animado**.

**Version:** 1.0.0 · **Compatibilidad:** Minecraft Bedrock **1.21.0+** · **Experimentos:** no requeridos

---

## ✨ Que incluye

- 🪧 **Hologramas de texto flotante** (entidad invisible que solo muestra su texto).
  Texto **multilinea** (separa con `|`) y **colores** con `&` (ej. `&eHola &cmundo`).
- 🛠️ **Items holograficos con icono PNG custom**:
  - **Proyector de Holograma** (`holo:projector`) → abre el **menu principal** con la
    **cuadricula custom 3×3** (crear, lista, editar, color, mover, tamaño, particulas,
    borrar, ayuda).
  - **Varita de Holograma** (`holo:wand`) → apunta a un holograma y usala para **editarlo
    al instante**.
- 🖱️ **Textos clickeables (Form GUI)**: cada boton de la cuadricula es un boton real con
  **icono + texto** que ejecuta una accion.
- 🎨 **Cuadricula custom con texturas propias** via `ui/server_form.json` (basado en el
  patron `server_form` que pediste). Se activa cuando el formulario se titula
  **`Custom Form`** y cada boton lleva su icono de `textures/holo_ui/`.
- ✨ **Particulas 3D** editables por holograma: efecto (chispa holo custom, haz holo
  custom, end rod, portal, encantamiento…) + **patron 3D** (anillo, helice, halo,
  orbita doble, lluvia ascendente).
- 🌀 **Texto animado**: flotar (sube/baja), latido de color, y efecto **typewriter**.
- 🔁 **Persistencia total**: cada holograma guarda su texto, color, tamaño, particulas y
  animacion con **dynamic properties** (sobrevive a recargas del mundo).

---

## 📥 Instalacion

1. Descarga **`holograms_v1.mcaddon`** y abrelo (Minecraft importa los 2 packs).
2. Activa **ambos** packs (behavior + resource) en el mundo.
3. En el chat escribe **`!holo`** para recibir el **Proyector** y la **Varita**.
4. Usa el **Proyector** para abrir el menu y **Crear** tu primer holograma.

> El behavior y el resource pack estan vinculados: activalos **los dos**.

---

## 🎮 Uso rapido

| Accion | Como |
|---|---|
| Conseguir los items | Escribe `!holo` en el chat |
| Abrir el menu (cuadricula custom) | **Usa** el Proyector de Holograma |
| Crear un holograma | Menu → **Crear** |
| Editar uno existente | **Apunta** y usa la Varita, o **toca** el holograma, o Menu → **Lista** |
| Mover / color / tamaño / particulas | Botones del menu o del editor |
| Borrar | Editor → **Borrar**, o Menu → **Borrar mirando** |

El texto admite **varias lineas** (separa con `|`) y **colores** con `&`
(ej. `&aServidor &7| &bBienvenido`).

---

## 🧩 Cuadricula custom (JSON-UI)

`resource_pack/ui/server_form.json` (namespace `server_form`) sobreescribe `long_form`:

- **`default_long_form`**: el formulario normal de siempre (visible cuando el titulo
  **no** es `Custom Form`), por lo que el resto de menus del juego siguen funcionando.
- **`custom_long_form`**: la **cuadricula 3×3 con iconos** (visible solo cuando el titulo
  es exactamente `Custom Form`). Cada boton enlaza `#form_button_texture` (el icono que
  pasa el script) y `#form_button_text`.

En el script (`scripts/ui.js`) el hub hace:

```js
new ActionFormData()
  .title("Custom Form")                         // activa la cuadricula custom
  .button("Crear", "textures/holo_ui/ic_create")// icono + texto
  ...
```

> Nota tecnica: en Bedrock `server_form.json` se **fusiona** con el de vanilla por clave
> de nivel superior. Solo se redefine `long_form`, asi que `custom_form` (ModalForm) y
> `modal_form` (MessageForm) **siguen intactos** y ningun otro menu se rompe.

---

## 🎨 Regenerar los assets (PNG)

Todas las texturas se generan con Python puro (sin dependencias):

```bash
python3 _tools/gen_holo.py
```

Genera: iconos de items (`holo_projector`, `holo_wand`), textura transparente de la
entidad, texturas de particulas (`holo_spark`, `holo_beam`), los 9 iconos de la
cuadricula (`textures/holo_ui/ic_*`), el tile de boton (`btn_tile`) y los `pack_icon`.

---

## 🗂️ Estructura

```
holo_addon/
├── behavior_pack/
│   ├── entities/hologram.json          (entidad invisible, flotante, invencible)
│   ├── items/holo_projector.json       (holo:projector)
│   ├── items/holo_wand.json            (holo:wand)
│   └── scripts/                        (config, util, holo, ui, main)
└── resource_pack/
    ├── entity/hologram.entity.json
    ├── models/entity/hologram_blank.geo.json
    ├── particles/holo_spark|holo_beam.particle.json
    ├── render_controllers/hologram.render_controllers.json
    ├── ui/server_form.json             (cuadricula custom 3×3)
    ├── textures/items, textures/holo_ui, textures/particle, textures/entity
    └── texts/ (en_US, es_ES, es_MX)
```

---
Addon creado con **Kiro AI Assistant** · *Hologramas Flotantes Pro v1.0.0*
