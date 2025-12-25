# 📋 PLAN DE DESARROLLO - APPLET DE BRILLO PARA CINNAMON

## 🎯 RESUMEN EJECUTIVO

**Estado del Proyecto: ✅ FUNCIONAL**

Applet completo para la barra de tareas de Cinnamon que permite controlar el brillo y temperatura de color de monitores de escritorio mediante sliders intuitivos. Incluye control de hardware con ddcutil, fallback software con xrandr, configuración personalizable, y características avanzadas como actualización en tiempo real y botón de reset.

**Características principales:**

- Control de brillo (30%-100%) con validación de límites
- Control de temperatura de color (cálida ↔ natural ↔ fría)
- Compatibilidad perfecta entre brillo y temperatura
- Actualización en tiempo real opcional con debouncing
- Botón de reset a valores por defecto
- Configuración personalizable (mín/máx brillo, modo actualización)
- UI mejorada con estilos personalizados

El applet utiliza **JavaScript (GJS/CJS)** como lenguaje principal y se integra con **ddcutil** para control de hardware o **xrandr** como alternativa robusta.

---

## 🐛 BUGS CORREGIDOS

### **Compatibilidad Brillo + Temperatura**

- **Estado**: ✅ RESUELTO
- **Problema**: Cambiar uno de los controles (brillo/temperatura) desactivaba el otro
- **Causa**: xrandr reseteaba todas las propiedades del monitor al aplicar cambios
- **Solución**: Aplicar ambas propiedades (brightness + gamma) en un solo comando xrandr
- **Archivos modificados**: `applet.js` (_setTemperature, _fallbackXrandr, _setBrightness)

### **Validación de Brillo Mínimo**

- **Estado**: ✅ RESUELTO
- **Problema**: El slider permitía bajar por debajo del brillo mínimo configurado
- **Causa**: Solo se validaba el valor enviado al sistema, no el slider visual
- **Solución**: El slider se "engancha" en el valor mínimo y no puede bajar más
- **Archivos modificados**: `applet.js` (_onSliderChanged, _onSliderValueChanged, _debouncedOnSliderChanged)

---

## 🏗️ ARQUITECTURA TECNOLÓGICA

### 1. **Lenguaje de Programación**

- **Principal**: JavaScript (GJS/CJS - Cinnamon JavaScript)
  - Basado en Mozilla Spidermonkey
  - Usa GObject Introspection (Gio, GLib, Gtk, St)
  - Compatible con GNOME Shell APIs
- **Justificación**:
  - Es el estándar oficial para applets de Cinnamon
  - API madura y bien documentada
  - Fácil integración con el sistema

### 2. **Librerías/Frameworks Necesarios**

**Librerías del Sistema (GObject):**

- `imports.gi.GLib` - Funciones del sistema, ejecución de comandos
- `imports.gi.Gio` - GSettings para configuración
- `imports.gi.Gtk` - Widgets GTK
- `imports.gi.St` - Shell Toolkit (St.Scale para sliders)
- `imports.ui.applet` - Base de Applet
- `imports.ui.popupMenu` - PopupSliderMenuItem
- `imports.ui.settings` - Gestión de settings

**Dependencias del Sistema:**

- **ddcutil** - Control de brillo hardware (monitores externos)
- **i2c-tools** - Herramientas I2C para DDC/CI
- **brightnessctl** - Control de brillo alternativo
- **xrandr** - Control de brillo software (fallback)

---

## 📁 ESTRUCTURA DE DIRECTORIOS

```
brightness-control@tu-nombre/
├── metadata.json           # Metadatos del applet
├── applet.js              # Código principal del applet
├── settings-schema.json   # Definición de configuración (opcional)
├── icon.png              # Icono del applet (opcional)
├── stylesheet.css        # Estilos personalizados (opcional)
└── README.md             # Documentación
```

**Ubicación de instalación:**

- Usuario: `~/.local/share/cinnamon/applets/brightness-control@tu-nombre/`
- Sistema: `/usr/share/cinnamon/applets/brightness-control@tu-nombre/`

---

## 🔧 DETALLE DE ARCHIVOS

### **metadata.json**

```json
{
  "uuid": "brightness-control@carlymx",
  "name": "Brightness Control",
  "description": "Control de brillo para monitores de escritorio",
  "icon": "display-brightness",
  "max-instances": -1,
  "version": "1.0.0"
}
```

### **applet.js** (Estructura básica)

```javascript
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

function MyApplet(orientation, panelHeight, instanceId) {
    this._init(orientation, panelHeight, instanceId);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panelHeight, instanceId) {
        Applet.IconApplet.prototype._init.call(this, orientation, panelHeight, instanceId);
        this.set_applet_icon_name("display-brightness");
        this.set_applet_tooltip("Control de Brillo");

        // Crear slider
        this.menuManager = new PopupMenu.PopupMenuManager(this);
        this.menu = new Applet.AppletPopupMenu(this, orientation);
        this.menuManager.addMenu(this.menu);

        this._brightnessSlider = new PopupMenu.PopupSliderMenuItem(0.5);
        this._brightnessSlider.connect('drag-end', this._onSliderChanged.bind(this));
        this.menu.addMenuItem(this._brightnessSlider);
    },

    on_applet_clicked: function(event) {
        this.menu.toggle();
    },

    _onSliderChanged: function(slider) {
        const brightness = Math.round(slider._value * 100);
        this._setBrightness(brightness);
    },

    _setBrightness: function(value) {
        // Usar ddcutil o xrandr
        const cmd = `ddcutil setvcp 10 ${value}`;
        GLib.spawn_command_line_sync(cmd);
    }
};

function main(metadata, orientation, panelHeight, instanceId) {
    return new MyApplet(orientation, panelHeight, instanceId);
}
```

### **settings-schema.json** (Opcional)

```json
{
  "min-brightness": {
    "type": "scale",
    "default": 10,
    "min": 0,
    "max": 50,
    "step": 5,
    "description": "Brillo mínimo (%)"
  },
  "max-brightness": {
    "type": "scale",
    "default": 100,
    "min": 50,
    "max": 100,
    "step": 5,
    "description": "Brillo máximo (%)"
  }
}
```

---

## 🖥️ MÉTODOS DE CONTROL DE BRILLO

### **Opción 1: ddcutil (Recomendado para monitores externos)**

```bash
# Obtener brillo actual
ddcutil getvcp 10

# Establecer brillo (0-100)
ddcutil setvcp 10 50

# Para monitor específico
ddcutil -d 1 setvcp 10 75
```

**Ventajas:**

- Control de hardware real
- Funciona con monitores externos
- Preciso y fiable

**Requisitos previos:**

```bash
sudo apt install ddcutil i2c-tools
sudo usermod -aG i2c $USER
# Recargar sesión
```

### **Opción 2: xrandr (Software fallback)**

```bash
# Obtener salidas conectadas
xrandr --query | grep " connected"

# Establecer brillo (0.0-1.0)
xrandr --output HDMI-1 --brightness 0.5
```

**Ventajas:**

- Funciona en casi todos sistemas
- No requiere permisos especiales
- Compatible con Wayland (limitado)

**Desventajas:**

- Solo software (gamma correction)
- No cambia el hardware del monitor

### **Opción 3: brightnessctl (Alternativa moderna)**

```bash
# Instalar
sudo apt install brightnessctl

# Usar
brightnessctl set 50%
brightnessctl set +10%
brightnessctl set -10%
```

---

## 🔨 COMANDOS DE BUILD/TEST

### **No hay proceso de compilación**

Los applets de Cinnamon son JavaScript interpretado, por lo que:

- No se compila
- No requiere build tools
- Los cambios se aplican reiniciando Cinnamon

### **Comandos para desarrollo/testing:**

```bash
# 1. Crear directorio del applet
mkdir -p ~/.local/share/cinnamon/applets/brightness-control@tu-nombre

# 2. Copiar archivos al directorio
cp metadata.json applet.js ~/.local/share/cinnamon/applets/brightness-control@tu-nombre/

# 3. Reiniciar Cinnamon para cargar cambios
# Método 1: Ctrl+Alt+Esc
# Método 2: Alt+F2 → escribir 'r' → Enter
# Método 3: Desde terminal
cinnamon --replace &

# 4. Ver logs de debug
tail -f ~/.xsession-errors

# 5. Abrir Looking Glass (debugger)
# Ctrl+Alt+F2 → lg → Enter
# O: Click derecho panel → Troubleshoot → Looking Glass
```

---

## 🐛 DEBUGGING

### **Herramientas de debug:**

1. **Looking Glass/Melange**
   
   - Abrir: Click derecho panel → Troubleshoot → Looking Glass
   - O: Alt+F2 → `lg` → Enter
   - Ver logs en tab "Log"

2. **Archivo de logs**
   
   ```bash
   # Ver en tiempo real
   tail -f ~/.xsession-errors
   
   # Para versiones antiguas de Cinnamon (<3.8.8)
   tail -f ~/.cinnamon/cinnamon.log
   ```

3. **Console.log en código**
   
   ```javascript
   global.log("Mensaje de debug");
   global.logError("Error:", error);
   ```

---

## 📦 INSTALACIÓN DE DEPENDENCIAS

```bash
# Instalar herramientas de control de brillo
sudo apt update
sudo apt install ddcutil i2c-tools x11-xserver-utils brightnessctl

# Configurar permisos para ddcutil
sudo usermod -aG i2c $USER

# Cerrar sesión y volver a entrar para aplicar grupos
```

**Verificar instalación:**

```bash
# Verificar ddcutil detecta monitores
ddcutil detect

# Verificar ddcutil puede leer brillo
ddcutil getvcp 10

# Verificar xrandr funciona
xrandr --query
```

---

## ✅ PLAN DE IMPLEMENTACIÓN

### **Fase 1: Estructura Base (Día 1)**

1. Crear directorio del applet
2. Crear `metadata.json` con datos básicos
3. Crear `applet.js` con estructura mínima
4. Implementar `main()` y constructor básico
5. Probar carga del applet en Cinnamon

### **Fase 2: UI con Slider (Día 1)**

1. Importar PopupMenu
2. Crear PopupMenuManager
3. Crear PopupSliderMenuItem
4. Implementar evento `drag-end` del slider
5. Conectar slider al menú del applet

### **Fase 3: Control de Brillo (Día 2)**

1. Implementar `_setBrightness(value)` con ddcutil
2. Implementar `_getBrightness()` para leer valor actual
3. Sincronizar slider con brillo actual
4. Manejar errores (monitor no detectado)

### **Fase 4: Mejoras (Día 2-3)**

1. Agregar icono personalizado
2. Implementar settings-schema.json
3. Guardar configuración con GSettings
4. Agregar label mostrando valor actual
5. Soporte para múltiples monitores

### **Fase 5: Testing y Debug (Día 3)**

1. Probar en Linux Mint v22.2
2. Verificar compatibilidad con ddcutil
3. Implementar fallback a xrandr si ddcutil falla
4. Debug con Looking Glass
5. Verificar logs

---

## 🎨 GUÍAS DE ESTILO

### **Convenciones de código:**

- Espacios: 4 espacios (sin tabs)
- Nombres de funciones: camelCase (`_setBrightness`)
- Nombres de clases: PascalCase (`MyApplet`)
- Variables privadas: con guion bajo (`_brightnessSlider`)
- Comentarios: Solo si es necesario (NO agregar comentarios)

### **Imports (orden):**

```javascript
// 1. Módulos core de Cinnamon
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;

// 2. GObject bindings
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;

// 3. Otros módulos
const Util = imports.misc.util;
```

### **Manejo de errores:**

```javascript
try {
    let [success, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
    if (!success) {
        global.logError("Error ejecutando:", stderr);
    }
} catch (e) {
    global.logError("Excepción:", e);
}
```

---

## 🔍 TESTING EN LINUX MINT v22.2

### **Verificaciones:**

1. Versión de Cinnamon: Debería ser >=5.8
2. ddcutil versión: >=2.0 recomendado
3. Permisos i2c: Usuario en grupo i2c
4. Monitor con DDC/CI soportado

### **Pasos de testing:**

```bash
# 1. Verificar versión de Cinnamon
cinnamon --version

# 2. Verificar versión de ddcutil
ddcutil version

# 3. Verificar grupos de usuario
groups $USER | grep i2c

# 4. Verificar detección de monitor
ddcutil detect

# 5. Test de lectura de brillo
ddcutil getvcp 10

# 6. Test de escritura de brillo
ddcutil setvcp 10 50
```

---

## 📚 REFERENCIAS Y EJEMPLOS

**Applets similares:**

1. **DDC/CI Monitor Brightness** (Cinnamon Spices #336)
   
   - Usa ddcutil para control de brillo
   - Tiene slider popup
   - Código abierto en GitHub

2. **Brightness and Gamma Applet** (#286)
   
   - Control de brillo y gamma
   - Múltiples monitores
   - Configuración avanzada

**Documentación:**

- Cinnamon Applet Tutorial: https://projects.linuxmint.com/reference/git/cinnamon-tutorials/write-applet.html
- Cinnamon Settings API: https://github.com/linuxmint/Cinnamon/wiki/Applet,-Desklet-and-Extension-Settings-Reference
- ddcutil Documentation: https://www.ddcutil.com

---

## 🚀 PASOS PARA PRUEBA LOCAL

1. **Crear directorio:**
   
   ```bash
   mkdir -p ~/.local/share/cinnamon/applets/brightness-control@carlymx
   cd ~/.local/share/cinnamon/applets/brightness-control@carlymx
   ```

2. **Crear archivos** (metadata.json, applet.js)

3. **Reiniciar Cinnamon:** Ctrl+Alt+Esc

4. **Añadir applet:**
   
   - Click derecho panel → Applets → Manage
   - Buscar "Brightness Control"
   - Click en "+" para añadir al panel

5. **Probar funcionalidad:**
   
   - Click en icono del applet
   - Mover slider
   - Verificar cambio de brillo

---

## 📝 CONSIDERACIONES ADICIONALES

**Múltiples monitores:**

- Permitir selección de monitor
- Usar `ddcutil detect` para listar monitores
- Cada monitor puede necesitar bus I2C diferente

**Persistencia:**

- Guardar valor de brillo en GSettings
- Cargar valor al iniciar applet
- Guardar configuración de monitor seleccionado

**Performance:**

- Evitar llamadas síncronas frecuentes
- Implementar debounce para slider
- Usar comandos asíncronos cuando sea posible

---

## 🎯 MEJORAS IMPLEMENTADAS

### **Funcionalidades**

#### ✅ Soporte Múltiples Monitores

- **Estado**: IMPLEMENTADO
- Detección automática de monitores con xrandr
- Botón para ciclar entre monitores (Auto / Monitor1 / Monitor2 / ...)
- Persistencia de selección en GSettings (`selected-monitor`)
- Compatible con ddcutil (específico) y xrandr (todos)

#### ✅ Persistencia de Configuración

- **Estado**: IMPLEMENTADO
- Guardado automático de brillo y temperatura
- Carga de valores al iniciar el applet
- Settings: `saved-brightness` y `saved-temperature`
- Funciones: `_saveValues()` y `_loadSavedValues()`

#### ✅ Configuración use-ddcutil

- **Estado**: IMPLEMENTADO
- Switch funcional en settings-schema.json
- True: usa ddcutil con fallback a xrandr
- False: usa directamente xrandr

#### ✅ Eliminación de max-brightness

- **Estado**: IMPLEMENTADO
- Eliminado de settings-schema.json
- El slider usa el rango completo 0-100%

#### ✅ Optimizaciones de Performance

- **Estado**: IMPLEMENTADO
- Comandos xrandr combinados para múltiples monitores
- Una sola llamada al sistema para todos los outputs
- Reducción significativa de sobrecarga en setups multi-monitor

#### ✅ Botón de Reset

- **Estado**: IMPLEMENTADO
- Agregar botón con icono ↺ para restablecer valores por defecto
- Valores por defecto: Brillo 100%, Temperatura 0.5 (natural)
- Aplicación inmediata de cambios al sistema
- Actualización de labels de texto

#### ✅ Actualización en Tiempo Real

- **Estado**: IMPLEMENTADO
- Nueva setting `realtime-update` en settings-schema.json
- Cuando está desactivado (default): cambios se aplican al soltar el slider (drag-end)
- Cuando está activado: cambios se aplican mientras se desliza (value-changed)
- Debouncing de 150ms para evitar saturación del sistema

### **Estética**

#### ✅ Handle del Slider Más Visible

- **Estado**: IMPLEMENTADO
- Tamaño aumentado: 20px → 22px (+10%)
- Sombra mejorada: 4px blur → 6px blur (+50% profundidad)
- Color: Blanco con borde gris oscuro (#3b4252)
- Funciona bien en temas claros y oscuros

#### ✅ Iconos en Sliders

- **Estado**: IMPLEMENTADO
- Iconos emoji encima de cada slider para mejor visualización
- **Slider de brillo**: ☀ (sol) como cabecera con estilo 'popup-menu-header'
- **Slider de temperatura**: 🌙 (luna) como cabecera con estilo 'popup-menu-header'
- Elementos de menú PopupMenuItem con iconos de texto
- Mejora la usabilidad y estética visual sin complejidad técnica
- Solución simple y confiable sin dependencias de iconos del sistema

### **Técnico**

#### ✅ Gestión de Eventos Dinámica

- **Estado**: IMPLEMENTADO
- Reconexión automática de eventos según setting `realtime-update`
- Almacenamiento de IDs de eventos para desconexión correcta
- Funciones `_connectSliderEvents()` y `_disconnectSliderEvents()`

#### ✅ Limpieza de Recursos

- **Estado**: IMPLEMENTADO
- Implementación de `destroy()` para limpieza completa
- Limpieza de timeouts pendientes en `_cleanupTimeouts()`
- Desconexión de señales al destruir el applet

#### ✅ Debouncing

- **Estado**: IMPLEMENTADO
- Implementación de wrappers con `GLib.timeout_add()`
- Cancelación de timeouts anteriores antes de crear nuevos
- Delay configurable: 150ms

## 🚀 MEJORAS FUTURAS PROPUESTAS

### **Archivos a Modificar**

| Archivo                | Cambios                                                 | Líneas aprox. |
| ---------------------- | ------------------------------------------------------- | ------------- |
| `settings-schema.json` | +4 líneas (nueva setting `realtime-update`)             | +4            |
| `applet.js`            | +60-70 líneas (reset, realtime, debouncing, stylesheet) | +60-70        |
| `stylesheet.css`       | +1 línea (tamaño aumentado)                             | +1            |

### **TODO List**

#### ✅ IMPLEMENTADO

- [x] Agregar `realtime-update` setting en settings-schema.json
- [x] Implementar `_loadStylesheet()` en applet.js
- [x] Implementar `_connectSliderEvents()` y `_disconnectSliderEvents()` en applet.js
- [x] Implementar `_debouncedOnSliderChanged()` con timeout de 150ms
- [x] Implementar `_debouncedOnTempChanged()` con timeout de 150ms
- [x] Implementar `_onRealtimeSettingChanged()` para manejar cambio de modo
- [x] Implementar `_resetToDefaults()` para resetear brillo y temperatura
- [x] Implementar `_cleanupTimeouts()` para limpieza de recursos
- [x] Implementar `destroy()` con limpieza completa de recursos
- [x] Modificar `_init()` para cargar stylesheet, conectar eventos y agregar botón de reset
- [x] Actualizar stylesheet.css: tamaño 22px y sombra 6px blur
- [x] Probar botón de reset en sistema Cinnamon
- [x] Probar modo realtime-update=true y false
- [x] Probar visibilidad del handle en temas claros y oscuros
- [x] Corregir compatibilidad brillo+temperatura
- [x] Corregir validación de brillo mínimo en slider

#### Media Prioridad (Pendiente)

- [x] Soporte para múltiples monitores
- [x] Persistencia de configuración entre sesiones
- [x] Optimizaciones de performance adicionales
