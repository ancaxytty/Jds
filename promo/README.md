# 🎬 Vídeo promocional — Voxel Forge / Custom NPC

Dos formatos del promo animado:

| Archivo | Qué es |
|---|---|
| **`index.html`** | Promo animado en **HTML5/Canvas** (1280×720, 16 s, en bucle, con música generada). Se reproduce solo y puedes **grabarlo y descargarlo como vídeo real `.webm`**. 100% offline. |
| **`voxel_forge_promo.gif`** | Vídeo en **GIF animado** (360×200, 96 frames) — se ve al instante en GitHub o cualquier visor. |

---

## ▶️ Promo HTML5 (recomendado, máxima calidad)

1. Abre **`index.html`** en tu navegador (Chrome/Edge/Firefox).
2. Se reproduce automáticamente en bucle.
3. Botones:
   - **⏸ Pausa / ▶ Reproducir**
   - **↻ Reiniciar**
   - **🔊 Sonido** (banda sonora generada con WebAudio)
   - **● Grabar** → graba un bucle completo y **descarga `voxel_forge_promo.webm`**
   - **⛶ Pantalla completa**

> El botón **Grabar** usa `MediaRecorder` sobre el canvas (vídeo + audio) y te
> entrega un archivo `.webm`. Para convertirlo a `.mp4` puedes usar cualquier
> conversor online o `ffmpeg -i voxel_forge_promo.webm voxel_forge_promo.mp4`.

### Contenido del promo
1. Intro: cubo de voxeles que se ensambla y gira + título **VOXEL FORGE**.
2. "Convierte tus modelos 3D en geometría de Minecraft".
3. +10 formatos (GLB, OBJ, FBX, STL, PLY, DAE, 3MF, VOX, WRL, AMF, USDZ).
4. **Custom NPC Pro**: 30 modelos 3D, skins, diálogos, editor en el juego.
5. Cierre: "Pruébalo ahora · GitHub / ancaxytty / Jds".

---

## 🖼️ GIF animado

`voxel_forge_promo.gif` se generó con **Python puro** (encoder GIF89a + LZW propio y
una fuente bitmap 5×7), sin dependencias. Para regenerarlo o editar textos/escenas:

```bash
python3 _tools/gen_promo_gif.py
```

---

## ⚠️ Nota honesta

No puedo generar un vídeo con IA (render fotográfico) ni codificar MP4 en este entorno
(no hay ffmpeg). Lo que tienes es **animación real hecha con código**: el HTML produce un
`.webm` de verdad al grabarlo, y el `.gif` es un vídeo animado listo para ver.

Creado con **Kiro AI Assistant**.
