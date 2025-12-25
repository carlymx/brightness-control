# Instrucciones para Enviar el Pull Request

## ✅ Preparativos ya completados por el script

- [x] Validación ESLint (0 errors, 6 warnings)
- [x] metadata.json actualizado a v1.1.0
- [x] info.json creado con datos de publicación
- [x] screenshot.png copiado
- [x] Estructura de directorios Spices creada

---

## 📋 Pasos que debes hacer ahora

### PASO 1: Hacer el Fork (PRIMERO)

1. Abre en el navegador: https://github.com/linuxmint/cinnamon-spices-applets
2. Click en el botón **"Fork"** (arriba a la derecha)
3. Espera a que se complete el proceso
4. Tu fork estará en: https://github.com/carlymx/cinnamon-spices-applets

---

### PASO 2: Ejecutar el script de preparación

Una vez hecho el fork, ejecuta:

```bash
cd /home/carly/Escritorio/brightness-control
./preparar_pr_spices.sh
```

**El script hará automáticamente:**
- Verificar que el fork existe
- Clonar el fork en `/tmp/cinnamon-spices-applets`
- Crear la rama `brightness-control@carlymx`
- Copiar la estructura del applet
- Ejecutar validación con `validate-spice`
- Crear el commit con mensaje completo

---

### PASO 3: Push desde GitHub Desktop

1. Abre **GitHub Desktop**
2. Click en **"Add Local Repository"**
3. Navega a `/tmp/cinnamon-spices-applets` y selecciona
4. Selecciona la rama `brightness-control@carlymx` en el menú de ramas
5. Click en **"Publish branch"** o **"Push"**
6. Espera a que se complete el push

---

### PASO 4: Crear el Pull Request

#### Opción A: Desde GitHub Desktop (recomendado)
1. En GitHub Desktop, después del push aparecerá un banner: *"Create Pull Request"*
2. Click en **"Create Pull Request"**
3. Se abrirá el navegador con el formulario del PR

#### Opción B: Desde el navegador
1. Abre: https://github.com/carlymx/cinnamon-spices-applets/compare/master...brightness-control@carlymx
2. Click en **"Create Pull Request"**

---

### PASO 5: Completar el formulario del PR

**Título:**
```
Add Brightness Control applet v1.1.0
```

**Descripción:**
```markdown
## Overview
This applet provides comprehensive brightness and color temperature control for desktop monitors.

## Key Features
- Brightness control (0-100%) with minimum limit configuration
- Color temperature control (warm ↔ natural ↔ cool)
- Multi-monitor support with auto/manual selector
- Configuration persistence across Cinnamon sessions
- DDCutil (hardware) and xrandr (software) compatibility
- Real-time updates with debouncing
- Emoji indicators for UI clarity
- Reset to default values

## Technical Details
- UUID: brightness-control@carlymx
- Version: 1.1.0
- Author: carlymx
- Website: https://github.com/carlymx/brightness-control
- License: GPL-2.0 (matches Cinnamon Spices license)

## Testing
- Tested on Cinnamon 6.x
- Works with multiple monitor configurations
- Validated with ./validate-spice script
- ESLint validation passed (0 errors, 6 warnings - none critical)

## Files Structure
```
brightness-control@carlymx/
├── info.json
├── screenshot.png
├── README.md
└── files/
    └── brightness-control@carlymx/
        ├── metadata.json
        ├── applet.js
        ├── settings-schema.json
        └── stylesheet.css
```

## Screenshots
The screenshot is included in the PR and will be displayed on Cinnamon Spices website.
```

6. Click en **"Create Pull Request"**

---

## 🔔 Después de enviar el PR

### Qué esperar:
- El equipo de Cinnamon revisará el PR (2-7 días)
- Revisa las notificaciones de GitHub regularmente
- Pueden pedir cambios o aclaraciones

### Si te piden cambios:
1. Lee los comentarios en el PR
2. Modifica los archivos necesarios en tu proyecto local
3. Ejecuta: `./preparar_pr_spices.sh`
4. Haz push desde GitHub Desktop
5. Responde en el PR indicando los cambios

### Si se aprueba:
1. El applet aparecerá en: https://cinnamon-spices.linuxmint.com/applets
2. Los usuarios podrán instalar desde: Configuración del Sistema → Miniaplicaciones
3. Será visible en el "cajón de miniaplicaciones" de Cinnamon

---

## 📝 Para futuras actualizaciones

Para lanzar una nueva versión (ej: v1.2.0):

1. Haz cambios en el proyecto local
2. Actualiza `metadata.json` → `"version": "1.2.0"`
3. Actualiza `info.json` → `"latest_version": "1.2.0"`
4. Ejecuta: `./preparar_pr_spices.sh`
5. Push desde GitHub Desktop
6. Crea nuevo PR con resumen de cambios

---

## 🆘 Ayuda

### Si el script da error "Fork no encontrado":
- Verifica que hayas hecho el fork en GitHub
- Espera unos segundos después de hacer el fork
- Ejecuta el script nuevamente

### Si la validación falla:
- Lee los errores reportados por `validate-spice`
- Corrige los archivos indicados
- Ejecuta el script nuevamente

### Si GitHub Desktop no detecta el repo:
- Agrega manualmente: File → Add Local Repository
- Navega a `/tmp/cinnamon-spices-applets`
- Click en "Add"

---

## 📚 Referencias

- [Tu fork del repo](https://github.com/carlymx/cinnamon-spices-applets)
- [Repositorio oficial](https://github.com/linuxmint/cinnamon-spices-applets)
- [Website Cinnamon Spices](https://cinnamon-spices.linuxmint.com/applets)
- [Guía completa](PUBLICACION_SPICES.md)
