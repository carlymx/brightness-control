# AGENTS.md - Guía para Applet de Brillo Cinnamon

**IMPORTANTE**: Habla y piensa siempre en Castellano. Este es un applet JavaScript (GJS) que controla brillo/temperatura de monitores usando ddcutil/xrandr.

## Build/Lint/Test Commands

### Build
```bash
cp metadata.json applet.js settings-schema.json stylesheet.css ~/.local/share/cinnamon/applets/brightness-control@carlymx/
cp -r po/es ~/.local/share/locale/
cp -r po/en ~/.local/share/locale/
cinnamon --replace &
```

### Lint
```bash
npx eslint --ext .js brightness-control@carlymx/applet.js
```

### Single Test
Prueba específica: Click applet → mover slider → verificar monitor cambia y label actualiza. Para logs: `tail -f ~/.xsession-errors`. Looking Glass: Alt+F2 → lg.

## Code Style Guidelines

### Formatting
- Indentación: 4 espacios, máx 120 caracteres por línea
- Braces: misma línea para funciones y bloques de control
- Semicolons: siempre al final de statements
- SIN comentarios innecesarios - código debe ser autoexplicativo
- Líneas en blanco: una línea entre funciones, ninguna entre bloques relacionados

### Naming Conventions
- **Classes**: PascalCase (ej: `MyApplet`)
- **Functions**: camelCase (ej: `setBrightness`, `_connectSliderEvents`)
- **Variables**: camelCase (ej: `brightnessValue`, `selectedMonitor`)
- **Private members**: prefijo `_` (ej: `_brightnessTimeout`, `_monitors`)
- **Constants**: UPPER_SNAKE_CASE (ej: `MIN_BRIGHTNESS`, `TIMEOUT_DELAY`)
- **Event handlers**: prefijo `on_` para públicos, `_on` para privados (ej: `on_applet_clicked`, `_onSliderChanged`)

### Imports Order
```javascript
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const St = imports.gi.St;
const Settings = imports.ui.settings;
const Gettext = imports.gettext;

function _(str) {
    return Gettext.dgettext("brightness-control@carlymx", str);
}
```

### Types and Validation
- **Type checking**: Usar `typeof` para validación de tipos básicos
- **Number conversion**: `parseInt()` para enteros, `parseFloat()` para decimales
- **Range validation**: Verificar rangos 0-100 para porcentajes, 0-1 para valores normalizados
- **Null/undefined handling**: Verificar existencia antes de usar propiedades
- **Array validation**: Verificar `length > 0` antes de acceder a índices

### Error Handling
```javascript
try {
    let [success, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
    if (!success) {
        global.logError("Error:", stderr);
        return false;
    }
    return true;
} catch (e) {
    global.logError("Excepción:", e);
    return false;
}
```

### Structure and Architecture
```javascript
function MyApplet(orientation, panelHeight, instanceId) {
    this._init(orientation, panelHeight, instanceId);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,

    _init: function(orientation, panelHeight, instanceId) {
        // Inicialización completa aquí
    },

    on_applet_clicked: function(event) {
        this.menu.toggle();
    },

    _setBrightness: function(value) {
        // Lógica de negocio aquí
    },

    destroy: function() {
        this._cleanupTimeouts();
        this._disconnectSliderEvents();
        Applet.IconApplet.prototype.destroy.call(this);
    }
};

function main(metadata, orientation, panelHeight, instanceId) {
    return new MyApplet(orientation, panelHeight, instanceId);
}
```

### Localization
- Usar función `_()` para todas las strings de UI: `_("Texto")`
- `GLib.vsprintf()` para strings con variables: `GLib.vsprintf(_("Brillo: %d%%"), [value])`
- Archivos de traducción: `po/{en,es}.po`
- Bindtextdomain: configurar en `_init()` con `Gettext.bindtextdomain()`

## Project-Specific Rules

### Applet Config
- UUID: `brightness-control@carlymx`, `max-instances: -1`, icon: `display-brightness`
- Archivos: metadata.json, applet.js, settings-schema.json, stylesheet.css (opcional)

### Hardware/Software
- Primario: ddcutil VCP 10 (requiere usuario en grupo i2c)
- Fallback: xrandr brightness/gamma
- Monitores: Auto (todos) o específico por nombre

### Settings Management
```javascript
this.settings = new Settings.AppletSettings(this, metadata.uuid, instanceId);
this.settings.bindProperty(Settings.BindingDirection.IN, "min-brightness", "minBrightness", null);
this.settings.bindProperty(Settings.BindingDirection.IN, "realtime-update", "realtimeUpdate", this._onRealtimeSettingChanged.bind(this));
this.settings.bindProperty(Settings.BindingDirection.IN, "use-ddcutil", "useDdcutil", null);
this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "selected-monitor", "selectedMonitor", null);
this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "saved-brightness", "savedBrightness", null);
this.settings.bindProperty(Settings.BindingDirection.BIDIRECTIONAL, "saved-temperature", "savedTemperature", null);
```

### Settings
- `min-brightness` (scale 0-50): Brillo mínimo
- `use-ddcutil` (switch): Control hardware vs software
- `realtime-update` (switch): Debouncing 150ms
- `selected-monitor` (generic): "auto" o nombre específico
- `saved-brightness`/`saved-temperature`: Persistencia entre sesiones

### Slider Event Handling
- Conectar eventos en `_connectSliderEvents()`, desconectar en `_disconnectSliderEvents()`
- Condicional por `realtimeUpdate`: `drag-end` (no realtime) vs `value-changed` (realtime con debouncing)
- Guardar IDs de conexión: `this._brightnessDragEndId`, etc.

### Memory Management
- Limpiar timeouts en `_cleanupTimeouts()` y `destroy()`
- Desconectar señales en `_disconnectSliderEvents()` y `destroy()`
- Reconectar eventos dinámicamente cuando cambian settings

### Debouncing
```javascript
if (this._brightnessTimeout) {
    GLib.source_remove(this._brightnessTimeout);
}
this._brightnessTimeout = GLib.timeout_add(GLib.PRIORITY_DEFAULT, 150, function() {
    this._setBrightness(brightness);
    this._brightnessTimeout = null;
    return GLib.SOURCE_REMOVE;
}.bind(this));
```

### Event Handling
- Usar `connect()` para GObject, guardar IDs, desconectar en destroy()
- Manejar drag-end vs value-changed según realtime-update

### Debugging
```javascript
global.log("Debug");
global.logError("Error:", error);
// Looking Glass: Alt+F2 → lg
```

## ESLint Configuration
- **Archivo**: `eslint.config.js`
- **Reglas específicas**:
  - `no-console`: off (permite console.log)
  - `no-unused-vars`: warn (avisa sobre variables no usadas)
- **Globals definidos**: Applet, PopupMenu, GLib, Gio, St, Settings, Gettext, _, global

## Security Best Practices
- **Command injection**: Siempre usar GLib.spawn_command_line_sync() con strings estáticas
- **Input validation**: Validar rangos de valores antes de usarlos en comandos
- **Error logging**: No loggear información sensible o credenciales
- **File paths**: Usar rutas absolutas, evitar concatenación insegura

## Performance Considerations
- **Debouncing**: Usar timeouts de 150ms para evitar llamadas excesivas
- **Memory management**: Limpiar timeouts y desconectar eventos en destroy()
- **Efficient updates**: Actualizar UI solo cuando sea necesario
- **Resource cleanup**: Liberar recursos en el método destroy()

## Resources
- [Cinnamon Applet Tutorial](https://projects.linuxmint.com/reference/git/cinnamon-tutorials/write-applet.html)
- [Cinnamon Settings API](https://github.com/linuxmint/Cinnamon/wiki/Applet,-Desklet-and-Extension-Settings-Reference)
- [ddcutil Documentation](https://www.ddcutil.com)
