# Plan de Publicación en Cinnamon Spices

## Objetivo
Publicar el applet **Brightness Control** en el repositorio oficial de Cinnamon Spices para que esté disponible para descarga desde el "cajón de miniaplicaciones" de Cinnamon/Linux Mint.

---

## Información Confirmada

| Campo | Valor |
|--------|-------|
| Username GitHub | `carlymx` |
| Email | `carlymx@gmail.com` |
| UUID del applet | `brightness-control@carlymx` |
| Versión target | `1.1.0` |
| Repo del proyecto | https://github.com/carlymx/brightness-control |
| Icono | Sistema `display-brightness` (personalizado NO necesario) |
| Estado del applet | Funcionando correctamente |

---

## Pre-requisitos Verificados

- [x] Cuenta GitHub abierta
- [x] GitHub Desktop instalado y abierto
- [x] Username GitHub: `carlymx`
- [x] Applet funciona correctamente
- [x] Proyecto subido a repositorio GitHub
- [x] Screenshot disponible: `imgs/001.png`

---

## PASO 1: Validar código con ESLint

```bash
npx eslint brightness-control@carlymx/applet.js
```

**Acción:**
- Si no hay errores → continuar al Paso 2
- Si hay errores → corregir antes de continuar

---

## PASO 2: Actualizar versión del applet local

### Archivo: `brightness-control@carlymx/metadata.json`
**Cambio:**
```json
"version": "1.0.0" → "version": "1.1.0"
```

### Archivo: `brightness-control@carlymx/settings-schema.json`
**Verificaciones:**
- `min-brightness` default: `30`
- `saved-brightness` y `saved-temperature` valores correctos

---

## PASO 3: Crear `info.json`

**Nuevo archivo en raíz del proyecto:**

```json
{
  "author": "carlymx",
  "website": "https://github.com/carlymx/brightness-control",
  "latest_version": "1.1.0",
  "name": "Brightness Control",
  "description": "Brightness and color temperature control for desktop monitors",
  "url": "https://github.com/linuxmint/cinnamon-spices-applets/tree/master/brightness-control@carlymx"
}
```

---

## PASO 4: Preparar screenshot

**Acción:**
```bash
cp imgs/001.png screenshot.png
```

**Requisito:** La imagen debe mostrar el applet funcionando con los sliders visibles.

---

## PASO 5: Crear estructura de directorios Spices

**Estructura requerida:**

```
brightness-control@carlymx/
├── info.json                           ← PASO 3
├── screenshot.png                       ← PASO 4
├── README.md                           ← Usar README.md existente (opcional)
└── files/                              ← Directorio CRÍTICO
    └── brightness-control@carlymx/       ← ÚNICO contenido de files/
        ├── metadata.json                  ← brightness-control@carlymx/metadata.json (v1.1.0)
        ├── applet.js                    ← brightness-control@carlymx/applet.js
        ├── settings-schema.json           ← brightness-control@carlymx/settings-schema.json
        └── stylesheet.css               ← brightness-control@carlymx/stylesheet.css
```

**IMPORTANTE:** El directorio `files/` debe contener ÚNICAMENTE el subdirectorio `brightness-control@carlymx/`. No debe haber archivos sueltos dentro de `files/`.

**Comandos para crear estructura:**
```bash
mkdir -p files/brightness-control@carlymx
cp brightness-control@carlymx/metadata.json files/brightness-control@carlymx/
cp brightness-control@carlymx/applet.js files/brightness-control@carlymx/
cp brightness-control@carlymx/settings-schema.json files/brightness-control@carlymx/
cp brightness-control@carlymx/stylesheet.css files/brightness-control@carlymx/
```

---

## PASO 6: Fork del repositorio oficial

**Acciones en navegador:**
1. Abrir: https://github.com/linuxmint/cinnamon-spices-applets
2. Click en botón **"Fork"** (arriba a la derecha)
3. Crear fork en tu cuenta: `https://github.com/carlymx/cinnamon-spices-applets`

---

## PASO 7: Clonar fork localmente

```bash
cd /tmp/
git clone https://github.com/carlymx/cinnamon-spices-applets.git
cd cinnamon-spices-applets
git checkout -b brightness-control@carlymx
```

---

## PASO 8: Copiar estructura al fork

**Desde el directorio del proyecto:**
```bash
cd /home/carly/Escritorio/brightness-control
cp -r brightness-control@carlymx /tmp/cinnamon-spices-applets/
```

---

## PASO 9: Validar estructura (requisito del repo)

```bash
cd /tmp/cinnamon-spices-applets
./validate-spice brightness-control@carlymx
```

**Acción:**
- Si pasa validación → continuar al Paso 10
- Si falla → corregir errores reportados

---

## PASO 10: Commit de cambios

```bash
cd /tmp/cinnamon-spices-applets
git add brightness-control@carlymx/
git commit -m "Add Brightness Control applet by carlymx - v1.1.0"
```

**Mensaje de commit sugerido (más detallado):**
```
Add Brightness Control applet by carlymx

Features:
- Brightness control (0-100%) with configurable minimum limit (default 30%)
- Color temperature control (warm ↔ natural ↔ cool)
- Multi-monitor support with auto/manual selector
- Configuration persistence across sessions
- DDCutil (hardware) and xrandr (software) compatibility
- Real-time updates with debouncing (150ms)
- Emoji icons for clarity
- Reset to defaults button

Technical:
- UUID: brightness-control@carlymx
- Version: 1.1.0
- Author: carlymx
- Website: https://github.com/carlymx/brightness-control
```

---

## PASO 11: Push a GitHub (usando GitHub Desktop)

**Acciones en GitHub Desktop:**
1. Agregar el repo `/tmp/cinnamon-spices-applets` si no aparece automáticamente
2. Hacer **Push** de la rama `brightness-control@carlymx` a tu fork

---

## PASO 12: Crear Pull Request

**Opción A: Desde GitHub Desktop**
1. Click en botón **"Create Pull Request"**

**Opción B: Desde navegador**
1. Abrir: https://github.com/carlymx/cinnamon-spices-applets/compare/master...brightness-control@carlymx
2. Click en **"Create Pull Request"**

**Datos del PR:**
- **Título:** `Add Brightness Control applet v1.1.0`
- **Descripción:**
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
- No ESLint errors

## Screenshots
(Will be displayed automatically from screenshot.png)
```

---

## PASO 13: Esperar revisión del equipo Cinnamon

**Detalles:**
- El equipo de Cinnamon revisará el PR
- Pueden pedir cambios o aclaraciones
- Revisar notificaciones en GitHub
- Tiempo estimado: 2-7 días

**Durante la revisión:**
- Responder rápidamente a cualquier comentario
- Realizar cambios solicitados en nueva commit
- Mantener comunicación abierta

---

## PASO 14: Post-aprobación

### Lo que sucederá:
1. El applet aparecerá en: https://cinnamon-spices.linuxmint.com/applets
2. Usuarios podrán instalar desde: Configuración del Sistema → Miniaplicaciones
3. El applet será descargable desde la web oficial

### Actualizaciones futuras:
Para hacer nuevas versiones:
1. Hacer cambios en tu repo local `brightness-control@carlymx/`
2. Actualizar versión en `metadata.json` (ej: v1.2.0)
3. Actualizar `latest_version` en `info.json` (ej: v1.2.0)
4. Copiar archivos actualizados al fork de `cinnamon-spices-applets`
5. Crear nuevo PR con resumen de cambios
6. Esperar aprobación

---

## Checklist Final

Ejecutar en orden y marcar cada ítem completado:

### Preparación Local
- [ ] Ejecutar `npx eslint brightness-control@carlymx/applet.js` (corregir si hay errores)
- [ ] Actualizar `metadata.json` a v1.1.0
- [ ] Confirmar `settings-schema.json` tiene `min-brightness: 30`
- [ ] Crear `info.json` con formato correcto
- [ ] Copiar `imgs/001.png` → `screenshot.png`

### Estructura Spices
- [ ] Crear directorio `files/brightness-control@carlymx/`
- [ ] Copiar `metadata.json` (v1.1.0) a `files/brightness-control@carlymx/`
- [ ] Copiar `applet.js` a `files/brightness-control@carlymx/`
- [ ] Copiar `settings-schema.json` a `files/brightness-control@carlymx/`
- [ ] Copiar `stylesheet.css` a `files/brightness-control@carlymx/`
- [ ] Verificar que `files/` contiene ÚNICAMENTE el subdirectorio

### GitHub - Fork
- [ ] Fork de `linuxmint/cinnamon-spices-applets` completado

### GitHub - Trabajo Local
- [ ] Clonar fork en `/tmp/cinnamon-spices-applets`
- [ ] Crear rama `brightness-control@carlymx`
- [ ] Copiar estructura `brightness-control@carlymx/` al fork
- [ ] Ejecutar `./validate-spice brightness-control@carlymx` (éxito)
- [ ] Commit con mensaje descriptivo
- [ ] Push desde GitHub Desktop a tu fork

### GitHub - Pull Request
- [ ] Crear PR desde GitHub Desktop o navegador
- [ ] Título: `Add Brightness Control applet v1.1.0`
- [ ] Descripción completa agregada
- [ ] PR enviado al repo oficial

### Post-PR
- [ ] Revisar notificaciones de GitHub regularmente
- [ ] Responder a comentarios del equipo Cinnamon
- [ ] Realizar cambios solicitados si los hay
- [ ] Esperar aprobación final

---

## Referencias

- [Repositorio oficial de Applets](https://github.com/linuxmint/cinnamon-spices-applets)
- [Website Cinnamon Spices](https://cinnamon-spices.linuxmint.com/applets)
- [Documentación de contribución](https://github.com/linuxmint/cinnamon-spices-applets/blob/master/.github/CONTRIBUTING.md)
- [Repositorio del proyecto](https://github.com/carlymx/brightness-control)

---

## Notas Importantes

1. **Validación es obligatoria:** El script `validate-spice` debe pasar sin errores
2. **Estructura `files/` es crítica:** Debe contener ÚNICAMENTE el subdirectorio UUID
3. **Licencia:** El applet se distribuye bajo GPL-2.0 (misma licencia que Cinnamon Spices)
4. **Mantenimiento:** Como autor, eres responsable de mantener el applet y responder issues
5. **Abandono:** Si planeas abandonar el applet, notifica al equipo de Cinnamon
6. **Versionado:** Incrementa versión semánticamente (major.minor.patch) en cada actualización
