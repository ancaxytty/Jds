# 📜 Custom NPC — Tema Pergamino (UI texture pack)

Texture pack **opcional** que da a los formularios y diálogos del addon un aspecto de
**pergamino medieval con marco de piedra** (inspirado en el cuadro de diálogo tipo
"Village Elder": pergamino + marco de piedra + botones de madera).

## ✅ Enfoque seguro
Este pack **no** modifica JSON-UI (que es muy sensible a la versión de Minecraft y puede
romper los formularios). En su lugar, **reemplaza texturas** de la interfaz que los
formularios ya usan:

```
textures/ui/dialog_background_opaque.png        (panel -> pergamino)
textures/ui/dialog_background_opaque_dark.png   (panel -> pergamino)
textures/ui/button_borderless_light.png         (botón -> madera)
textures/ui/button_borderless_lighthover.png    (botón resaltado)
textures/ui/button_borderless_lightpressed.png  (botón presionado)
```

Como solo cambia imágenes, **no puede romper** la funcionalidad de los menús.

## 📥 Instalación
1. Importa este pack como **resource pack** (es un `.mcpack`/carpeta normal).
2. En los ajustes del mundo, **actívalo POR ENCIMA** del resource pack
   `Custom NPC | Resources` (debe quedar más arriba en la lista para que sus texturas
   tengan prioridad).
3. Abre cualquier formulario o diálogo del NPC: se verá con pergamino y madera.

## ⚠️ Notas honestas
- Es un **tema cosmético global**: al reemplazar texturas de UI compartidas, **otros
  menús** (pausa, cofres, etc.) también pueden verse con el estilo pergamino. Si no te
  gusta, desactiva este pack y todo vuelve a la normalidad.
- No pude probarlo dentro de Minecraft en este entorno; si tu versión usa nombres de
  textura distintos para el panel del formulario, el fondo podría no cambiar (sin riesgo
  de rotura). En ese caso, dime tu versión y ajusto los nombres de archivo.
- Los **diálogos ya se ven profesionales por script** (nombre del hablante como título,
  texto en pergamino entre comillas, contador de página y botones claros) **aunque no
  uses este pack**.

## 🎨 Regenerar texturas
```bash
python3 _tools/gen_ui.py
```

Creado con **Kiro AI Assistant**.
