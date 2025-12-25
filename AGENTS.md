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
- Indentación: 4 espacios, máx 120 caracteres, braces misma línea, semicolons siempre, SIN comentarios innecesarios

### Naming
- Classes: PascalCase, Functions: camelCase, Variables: camelCase, Private: `_prefix`, Constants: UPPER_SNAKE_CASE

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

### Validation
- Usar `parseInt()`/`parseFloat()` para conversión, validar rangos 0-100, verificar `typeof`, manejar null/undefined

### Structure
```javascript
function MyApplet(orientation, panelHeight, instanceId) {
    this._init(orientation, panelHeight, instanceId);
}

MyApplet.prototype = {
    __proto__: Applet.IconApplet.prototype,
    _init: function(orientation, panelHeight, instanceId) {},
    on_applet_clicked: function(event) { this.menu.toggle(); },
    _setBrightness: function(value) {},
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

## Resources
- [Cinnamon Applet Tutorial](https://projects.linuxmint.com/reference/git/cinnamon-tutorials/write-applet.html)
- [Cinnamon Settings API](https://github.com/linuxmint/Cinnamon/wiki/Applet,-Desklet-and-Extension-Settings-Reference)
- [ddcutil Documentation](https://www.ddcutil.com)
