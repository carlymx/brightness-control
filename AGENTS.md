# AGENTS.md - Brightness Control Applet

This document provides guidelines for AI agents working on this Cinnamon desktop applet project.

## Project Overview

A Cinnamon applet for controlling monitor brightness and color temperature using ddcutil (hardware) or xrandr (software). Written in GJS (GNOME JavaScript).

**Current Version**: 1.2.0

## Build/Install Commands

### Using Install Script (Recommended)

```bash
# Make script executable
chmod +x install.sh

# Run installer
./install.sh

# Follow on-screen instructions:
# - Detect previous installation (backup/overwrite/remove/exit)
# - Select language (Spanish/English/both)
# - Restart Cinnamon automatically or manually
```

### Manual Installation

```bash
# Create applet directory
mkdir -p ~/.local/share/cinnamon/applets/brightness-control@carlymx

# Copy files
cp brightness-control@carlymx/* ~/.local/share/cinnamon/applets/brightness-control@carlymx/

# Restart Cinnamon to apply changes
cinnamon --replace &

# Optional: ddcutil for hardware brightness control
sudo apt install ddcutil i2c-tools
sudo usermod -aG i2c $USER

# Verify ddcutil installation
ddcutil getvcp 10  # Get current brightness
```

### Install Translations Manually

```bash
# Compile translations
msgfmt -o po/es/LC_MESSAGES/brightness-control@carlymx.mo po/es.po
msgfmt -o po/en/LC_MESSAGES/brightness-control@carlymx.mo po/en.po

# Install to locale
mkdir -p ~/.local/share/locale/{es,en}/LC_MESSAGES
cp po/es/LC_MESSAGES/brightness-control@carlymx.mo ~/.local/share/locale/es/LC_MESSAGES/
cp po/en/LC_MESSAGES/brightness-control@carlymx.mo ~/.local/share/locale/en/LC_MESSAGES/

# Restart Cinnamon
cinnamon --replace &
```

## Testing

There are no automated tests for this project. Manual testing is required:

1. Install the applet per above
2. Right-click panel → Add applet → Brightness Control
3. Test all features:
   - Brightness slider (0-100%)
   - Temperature slider (warm ↔ cool)
   - Monitor cycling button
   - Reset button
   - Settings changes (min brightness, ddcutil toggle, realtime updates)
   - Multi-monitor scenarios
   - GitHub button in settings

## Architecture

### Dual Control System

| Mode | Brightness | Temperature |
|------|------------|-------------|
| **ddcutil** | `setvcp 10 <value>` | `setvcp 16/18/1A <RGB>` (User 1 mode) |
| **xrandr** | `--brightness <0-1>` | `--gamma <r>:<g>:<b>` |

### ddcutil VCP Codes

```javascript
const VCP = {
    BRIGHTNESS: "10",      // Brightness control
    RED: "16",             // Red video gain (0-100)
    GREEN: "18",           // Green video gain (0-100)
    BLUE: "1A",            // Blue video gain (0-100)
    COLOR_PRESET: "14"     // Color preset (0x0b = User 1)
};

const DDCUTIL = {
    USER_MODE: "0x0b",     // User 1 color preset mode
    DEFAULT_TEMP: "0x05"   // 6500K preset
};
```

## Code Style Guidelines

### Imports

```javascript
const Applet = imports.ui.applet;
const PopupMenu = imports.ui.popupMenu;
const GLib = imports.gi.GLib;
const Gio = imports.gi.Gio;
const Settings = imports.ui.settings;
const St = imports.gi.St;
const Gettext = imports.gettext;
```

- Use `const` for all imports
- Order imports alphabetically by module path
- Group GJS imports at top, GI imports together

### Naming Conventions

- **Classes**: PascalCase (e.g., `MyApplet`)
- **Methods/functions**: camelCase (e.g., `_init`, `_setBrightness`)
- **Private members**: prefix with underscore (e.g., `_brightnessSlider`, `_monitors`)
- **Constants**: UPPER_SNAKE_CASE for configuration constants
- **Settings keys**: kebab-case (e.g., `min-brightness`, `use-ddcutil`)
- **Settings bindings**: match JSON schema key names exactly

### Code Formatting

- Indent with 4 spaces (no tabs)
- Use spaces around operators and after commas
- Max line length: 120 characters
- Use semicolons at end of statements
- Opening brace on same line: `function foo() {`

### Types and Variables

- Always declare variables with `let` or `const`
- Use `let` for mutable, `const` for immutable
- No type annotations (GJS is dynamically typed)
- Initialize variables at declaration when possible
- Use descriptive names: `brightnessTimeout` over `timeout1`

### Error Handling

Wrap external command execution in try-catch:

```javascript
try {
    let [success, stdout, stderr] = GLib.spawn_command_line_sync(cmd);
    if (!success) {
        global.logError("Error ejecutando comando:", stderr);
        // Fallback behavior
    }
} catch (e) {
    global.logError("Excepción:", e);
    // Fallback behavior
}
```

- Use `global.logError()` for errors, `global.log()` for debug info
- Provide fallback behavior when external commands fail
- Log errors in Spanish (project convention)

### Functions

- Use `function` declarations, not arrow functions (GJS compatibility)
- Private methods prefixed with underscore
- Keep functions under 50 lines
- Single responsibility per function

### Settings Bindings

```javascript
this.settings.bindProperty(
    Settings.BindingDirection.IN,     // Direction
    "setting-key-name",               // Setting key
    this.variableName,                // Variable to bind
    null                              // Callback (optional)
);
```

- Settings keys must match `settings-schema.json` exactly
- Use `BIDIRECTIONAL` for user-editable settings
- Use `IN` for read-only configuration

### Command Execution

Use `GLib.spawn_command_line_sync()` for synchronous commands:

```javascript
let [success, stdout, stderr] = GLib.spawn_command_line_sync("xrandr --current");
if (success) {
    let output = String(stdout);
    // Parse output
}
```

- Always check return value
- Convert stdout/stderr from bytes to string with `String()`
- Parse output with regex or string methods

### Internationalization

```javascript
function _(str) {
    return Gettext.dgettext("brightness-control@carlymx", str);
}

// Usage
this.set_applet_tooltip(_("Control de Brillo"));
```

- Wrap all user-facing strings with `_()` function
- Translation files in `po/` directory
- Message IDs in source must match `.pot` file

## File Structure

```
brightness-control@carlymx/
├── applet.js              # Main implementation
├── metadata.json          # Applet metadata
├── settings-schema.json   # Configuration schema
├── stylesheet.css         # Custom styling
└── applet.js.backup       # Backup of original code

po/
├── brightness-control@carlymx.pot  # Translation template
├── es.po                           # Spanish translations
├── es/LC_MESSAGES/
│   └── brightness-control@carlymx.mo  # Compiled Spanish
└── en.po                           # English translations
    └── en/LC_MESSAGES/
        └── brightness-control@carlymx.mo  # Compiled English

docs/
└── AGENTS.md                       # Development guidelines
```

## Translations

### Update Translation Template

After adding new translatable strings:

```bash
xgettext -o po/brightness-control@carlymx.pot \
  --language=JavaScript \
  --keyword=_ \
  brightness-control@carlymx/applet.js
```

### Compile Translations

```bash
# Spanish
msgfmt -o po/es/LC_MESSAGES/brightness-control@carlymx.mo po/es.po

# English
msgfmt -o po/en/LC_MESSAGES/brightness-control@carlymx.mo po/en.po
```

### Install Translations

```bash
mkdir -p ~/.local/share/locale/es/LC_MESSAGES
mkdir -p ~/.local/share/locale/en/LC_MESSAGES
cp po/es/LC_MESSAGES/brightness-control@carlymx.mo ~/.local/share/locale/es/LC_MESSAGES/
cp po/en/LC_MESSAGES/brightness-control@carlymx.mo ~/.local/share/locale/en/LC_MESSAGES/
cinnamon --replace &
```

## Development Workflow

1. Edit files in `brightness-control@carlymx/`
2. Copy to `~/.local/share/cinnamon/applets/brightness-control@carlymx/`
3. Test in running Cinnamon session
4. Restart Cinnamon with `cinnamon --replace &` if needed
5. Update translations in `po/` files
6. Update CHANGELOG.md with new version

## Key Functions Reference

| Function | Purpose |
|----------|---------|
| `_setBrightness(value)` | Main entry point for brightness changes |
| `_setBrightnessDdcutil(value)` | Apply brightness via ddcutil VCP 10 |
| `_setBrightnessXrandr(value)` | Apply brightness + gamma via xrandr |
| `_setTemperature(value)` | Main entry point for temperature changes |
| `_setTemperatureDdcutil(value)` | Apply RGB via ddcutil VCP 16/18/1A |
| `_setTemperatureXrandr(value)` | Apply gamma via xrandr |
| `_calcularRGBDesdeTemperatura(value)` | Convert slider value (0-1) to RGB (0-1) |
| `_getDdcutilCommand(vcp, value, target)` | Build ddcutil command string |
| `_resetXrandr(targets)` | Reset xrandr brightness and gamma |
| `_activarModoUsuarioDdcutil(targets)` | Activate User 1 color preset mode |
| `_onOpenGitHubClicked()` | Callback for GitHub button |

## Troubleshooting

### Colors look green/wrong with ddcutil
- Check that RGB values are multiplied by 100 (ddcutil expects 0-100)
- Verify User 1 mode is activated with `setvcp 14 0x0b`

### Image looks "burned" with xrandr
- Ensure brightness and gamma are applied together in single command
- Do not apply brightness and gamma separately

### Monitor not detected
- Run `xrandr --current` to verify monitors
- Check i2c permissions: `groups | grep i2c`
