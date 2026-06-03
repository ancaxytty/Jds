# Custom NPC Addon para Minecraft Bedrock Edition

## Descripción
Este addon añade NPCs personalizados a Minecraft Bedrock Edition (PE) con capacidades de comercio y comportamientos interactivos.

## Características

### 🎮 NPC Personalizado
- **Nombre:** Custom NPC
- **Identificador:** `custom:npc`
- **Modelo:** Humanoide personalizado con geometría y textura única
- **Huevo de invocación:** Verde con detalles marrones

### 🤝 Sistema de Comercio
El NPC ofrece 3 tipos de intercambios:

1. **Esmeraldas por Diamantes**
   - Entrega: 1-3 esmeraldas
   - Recibes: 1 diamante
   - Usos máximos: 10

2. **Diamantes por Esmeraldas**
   - Entrega: 1 diamante
   - Recibes: 5-10 esmeraldas
   - Usos máximos: 10

3. **Lingotes de Oro por Manzana Dorada Encantada**
   - Entrega: 3-5 lingotes de oro
   - Recibes: 1 manzana dorada encantada
   - Usos máximos: 5

### 🎭 Comportamientos
- Camina aleatoriamente por el mundo
- Mira a los jugadores cercanos
- Flota en el agua
- Puede ser renombrado con etiquetas de nombre
- Responde a interacciones de comercio

### 🌍 Idiomas Soportados
- Inglés (en_US)
- Español España (es_ES)
- Español México (es_MX)

## Instalación

### Opción 1: Instalación Directa (Recomendada)
1. Descarga el archivo `custom_npc_addon.mcaddon`
2. Abre el archivo en tu dispositivo
3. Minecraft se abrirá automáticamente e importará el addon
4. El addon estará disponible en la configuración de mundos

### Opción 2: Instalación Manual
1. Descomprime el archivo `.mcaddon`
2. Encontrarás dos archivos ZIP:
   - `behavior_pack.zip` - Pack de comportamiento
   - `resource_pack.zip` - Pack de recursos
3. Copia estos archivos a:
   - **Android/iOS:** 
     - Behavior: `games/com.mojang/behavior_packs/`
     - Resource: `games/com.mojang/resource_packs/`
   - **Windows 10:**
     - Behavior: `%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\behavior_packs\`
     - Resource: `%localappdata%\Packages\Microsoft.MinecraftUWP_8wekyb3d8bbwe\LocalState\games\com.mojang\resource_packs\`

## Uso

1. **Crear o editar un mundo:**
   - Ve a la configuración del mundo
   - En la sección "Packs de Comportamiento", activa "Custom NPC Addon"
   - En la sección "Packs de Recursos", activa "Custom NPC Resources"

2. **Invocar el NPC:**
   - Usa el comando: `/summon custom:npc`
   - O usa el huevo de invocación en modo creativo

3. **Comerciar:**
   - Acércate al NPC
   - Toca/haz clic en él para abrir el menú de comercio
   - Selecciona el intercambio que deseas realizar

## Requisitos
- Minecraft Bedrock Edition 1.19.0 o superior
- Se recomienda activar "Experimentos" si tienes problemas (aunque no debería ser necesario)

## Estructura Técnica

```
custom_npc_addon/
├── behavior_pack/
│   ├── manifest.json
│   ├── pack_icon.png
│   ├── entities/
│   │   └── custom_npc.json
│   └── trading/
│       └── custom_npc_trades.json
└── resource_pack/
    ├── manifest.json
    ├── pack_icon.png
    ├── entity/
    │   └── custom_npc.entity.json
    ├── models/
    │   └── entity/
    │       └── custom_npc.geo.json
    ├── textures/
    │   └── entity/
    │       └── custom_npc.png
    └── texts/
        ├── en_US.lang
        ├── es_ES.lang
        ├── es_MX.lang
        └── languages.json
```

## Personalización

Puedes modificar el addon editando los archivos:

- **Comportamientos:** `behavior_pack/entities/custom_npc.json`
- **Comercio:** `behavior_pack/trading/custom_npc_trades.json`
- **Apariencia:** `resource_pack/entity/custom_npc.entity.json`
- **Modelo 3D:** `resource_pack/models/entity/custom_npc.geo.json`
- **Textura:** `resource_pack/textures/entity/custom_npc.png`

## Solución de Problemas

### El NPC no aparece
- Verifica que ambos packs (comportamiento y recursos) estén activos
- Asegúrate de tener Minecraft 1.19.0 o superior
- Intenta reiniciar el juego

### No puedo comerciar
- Asegúrate de tener los objetos correctos en tu inventario
- Verifica que el comercio no haya alcanzado el límite de usos

### El modelo se ve extraño
- Verifica que el pack de recursos esté activado
- Prueba desactivar y reactivar el pack de recursos

## Licencia
Este addon es de uso libre para proyectos personales y educativos.

## Créditos
Addon creado con Kiro AI Assistant

---
**Versión:** 1.0.0  
**Fecha:** Junio 2026  
**Compatibilidad:** Minecraft Bedrock 1.19.0+
