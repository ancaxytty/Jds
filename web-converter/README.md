# 🧊 Voxel Forge — Conversor de modelos 3D a Minecraft Bedrock

Una página web (HTML5 + CSS3 + JavaScript) que carga modelos 3D de **muchos formatos**,
los previsualiza en 3D y los convierte a **geometría de Minecraft Bedrock** (`.geo.json`,
el mismo formato que usa Blockbench) **+ textura**, todo descargable en un `.zip`.

---

## ✨ Características

- 📥 **Sube tu modelo** arrastrando o haciendo click (admite varios archivos a la vez).
- 🧩 **11+ formatos:** GLB, GLTF, OBJ, FBX, STL, PLY, DAE (Collada), 3MF, VOX (MagicaVoxel), WRL (VRML), AMF, USDZ.
- 🎨 **Texturas incluidas:** los `.glb` traen sus texturas incrustadas; para `.gltf`/`.obj`
  selecciona también sus archivos (`.bin`, `.mtl` e imágenes) y se cargan automáticamente.
- 👀 **Vista previa 3D** en tiempo real (rotar, zoom, auto-giro).
- ⚙️ **Conversión a cubos** (voxelización) con resolución y densidad ajustables.
- 🟫 Genera **`.geo.json`** (abrible en Blockbench) + **textura PNG** (atlas de colores).
- 🗜️ **Descarga en `.zip`** con la estructura lista para tu resource pack.
- 💫 Interfaz **animada** (fondo degradado, glass UI, barra de progreso, transiciones).

---

## ▶️ Cómo usarla

1. Descomprime el `.zip` y abre **`index.html`** en tu navegador
   (Chrome, Edge o Firefox actualizados).
2. Arrastra tu modelo 3D (por ejemplo un `.glb`).
3. Ajusta la **resolución** (más = más detalle y más cubos).
4. Pulsa **⚙️ Convertir a Minecraft**.
5. Pulsa **⬇️ Descargar .zip**.

> ⚠️ **Requiere internet** la primera vez: las librerías **Three.js** y **JSZip** se cargan
> desde un CDN (jsDelivr). No necesitas instalar nada ni montar un servidor: funciona
> abriendo el `index.html` directamente.

### Usar el resultado en Minecraft
El `.zip` contiene:
```
models/entity/<nombre>.geo.json     (identifier: geometry.<nombre>)
textures/entity/<nombre>.png        (textura/atlas)
COMO_USAR.txt
```
En tu *client entity*:
```json
"geometry":  { "default": "geometry.<nombre>" },
"textures":  { "default": "textures/entity/<nombre>" }
```
También puedes abrir el `.geo.json` directamente en **Blockbench** (File → Open).

---

## 🧠 Cómo funciona

Minecraft Bedrock **no usa mallas de triángulos**: su geometría se construye con
**cubos** (huesos + cuboides con UV). Por eso, para convertir un modelo arbitrario
(GLB/FBX/OBJ…) a geometría Bedrock, Voxel Forge hace **voxelización**:

1. Carga la malla con los *loaders* de Three.js.
2. Muestrea la **superficie** del modelo sobre una rejilla 3D (resolución configurable).
3. En cada punto muestrea el **color** desde la textura, los *vertex colors* o el material.
4. Agrupa colores en una **paleta** y genera un **atlas PNG**.
5. Emite un **cubo por voxel** (con opción de **unir** cubos del mismo color en X para
   reducir la cantidad) y mapea cada cara al color por **UV por cara**.

---

## ⚖️ Límites (honestos)

- Es una **aproximación voxel** (estilo "Minecraft"), **no** una copia 1:1 de la malla
  original con curvas suaves: eso es imposible con la geometría de cubos de Bedrock.
- A mayor resolución → más detalle pero **más cubos** (puede pesar en el juego). Para
  entidades, mantente por debajo de ~6000 cubos para buen rendimiento.
- Las texturas se reducen a un **atlas de colores por voxel** (cada voxel = 1 color
  sólido), no se conserva el detalle fino de la textura original.
- Formatos multiarchivo (GLTF separado, OBJ+MTL) requieren seleccionar **todos** los
  archivos relacionados juntos. El **GLB** es el más cómodo (lleva todo dentro).
- Modelos rigged/animados se convierten en su **pose actual** (sin esqueleto).

---

## 🛠️ Tecnología

- **Three.js 0.160** (render + loaders) y **JSZip 3.10** vía CDN (import map de ES Modules).
- HTML5, CSS3 (animaciones con `@keyframes`), JavaScript moderno (módulos, async/await).
- Todo el procesamiento ocurre **en tu navegador** (no se sube nada a ningún servidor).

---

Creado con **Kiro AI Assistant**. Uso libre para proyectos personales y educativos.
