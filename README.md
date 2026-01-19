[Versión en español](README_ES.md)

![imagen](./imgs/screenshot.png)

# Brightness Control Applet for Cinnamon v1.2.0

Cinnamon Desktop applet for controlling monitor brightness and color temperature with independent control.

## Features

### Core Features

- **Independent Brightness & Temperature controls** - Changes don't affect each other
- **Brightness control** (0-100%) with minimum brightness validation
- **Color temperature control** (warm ↔ natural ↔ cool) via RGB adjustment

### Dual Control System

| Feature     | ddcutil (Hardware) | xrandr (Software)  |
| ----------- | ------------------ | ------------------ |
| Brightness  | VCP 10 (0-100)     | `--brightness 0-1` |
| Temperature | VCP 16/18/1A (RGB) | `--gamma r:g:b`    |

### User Interface

- **Emoji icons** above each slider
  - Brightness: ☀ (sun)
  - Temperature: 🌙 (moon)
- Labels showing current values
- **Multi-monitor support** with auto/manual selector
- **Reset button** to restore defaults
- **About section** in settings (version, author, GitHub link)
- **GitHub button** to open project page

### Configuration

- **Configuration persistence** across sessions
- **Configurable minimum brightness** (0-50%)
- **Configurable control mode** (hardware/software)
- **Optional real-time updates** with 150ms debouncing

### Performance

- **Optimized commands** - brightness and gamma applied together in single xrandr call
- Multi-monitor control with single command

## Installation

### Option 1: Using the Install Script (Recommended)

```bash
# Make the script executable
chmod +x install.sh

# Run the installer
./install.sh

# Follow the on-screen instructions
```

The installer will:
- Detect if you have a previous installation
- Offer options: backup, overwrite, remove old, or exit
- Install the applet files
- Optionally install translations (Spanish/English/both)
- Ask if you want to restart Cinnamon automatically

### Option 2: Manual Installation

```bash
# Create applet directory
mkdir -p ~/.local/share/cinnamon/applets/brightness-control@carlymx

# Copy files
cp brightness-control@carlymx/* ~/.local/share/cinnamon/applets/brightness-control@carlymx/

# Restart Cinnamon
cinnamon --replace &
```

### Optional: Install Translations Manually

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

## Configuration

Right-click on the applet → Configuration

### Settings

- **Minimum Brightness (%)**: Minimum allowed slider value (0-50%)
- **Use ddcutil**: Enable hardware control (requires ddcutil installed)
- **Update while sliding**: Apply changes in real-time with 150ms debouncing
- **About**: Version and author information
- **Open GitHub**: Button to open project page

### Monitor Selector

From the applet menu:

- **Monitor: Auto**: Adjusts all connected monitors
- **Specific monitor**: Adjusts only the selected monitor
- **"Change Monitor" button**: Cycles through available monitors

### Automatic Persistence

The applet automatically saves:

- Last configured brightness level
- Last configured color temperature
- Selected monitor

When restarting Cinnamon, these values are restored automatically.

## Optional Dependencies

For hardware control with ddcutil:

```bash
sudo apt install ddcutil i2c-tools
sudo usermod -aG i2c $USER
```

### ddcutil VCP Codes

The applet uses these VCP codes for hardware control:

| VCP Code | Function     | Range                   |
| -------- | ------------ | ----------------------- |
| 10       | Brightness   | 0-100                   |
| 14       | Color Preset | 0x05=6500K, 0x0b=User 1 |
| 16       | Red Gain     | 0-100                   |
| 18       | Green Gain   | 0-100                   |
| 1A       | Blue Gain    | 0-100                   |

## Translations

The applet supports multiple languages via gettext. Translation files are in the `po/` directory.

### Translation Files

```
po/
├── brightness-control@carlymx.pot  # Template (update with: xgettext)
├── es.po                           # Spanish translations
└── es/LC_MESSAGES/
    └── brightness-control@carlymx.mo  # Compiled Spanish (install to locale)
```

### Install Translations

The easiest way to install translations is using the install script:

```bash
./install.sh
# When prompted, choose to install translations (Spanish, English, or both)
```

Alternatively, manually compile and install:

```bash
# Compile .po to .mo
msgfmt -o po/es/LC_MESSAGES/brightness-control@carlymx.mo po/es.po
msgfmt -o po/en/LC_MESSAGES/brightness-control@carlymx.mo po/en.po

# Install to system locale
mkdir -p ~/.local/share/locale/es/LC_MESSAGES
mkdir -p ~/.local/share/locale/en/LC_MESSAGES
cp po/es/LC_MESSAGES/brightness-control@carlymx.mo ~/.local/share/locale/es/LC_MESSAGES/
cp po/en/LC_MESSAGES/brightness-control@carlymx.mo ~/.local/share/locale/en/LC_MESSAGES/

# Restart Cinnamon
cinnamon --replace &
```

### Install Script Options

The `install.sh` script provides the following features:

| Option | Description |
|--------|-------------|
| Detect previous installation | Offers backup/overwrite/remove/exit options |
| Language selection | Spanish, English, or both |
| Auto-restart | Optionally restart Cinnamon after installation |

Usage:

```bash
chmod +x install.sh
./install.sh
```

### Update Translations

After adding new translatable strings in `applet.js`:

```bash
# Extract strings to .pot template
xgettext -o po/brightness-control@carlymx.pot \
  --language=JavaScript \
  --keyword=_ \
  brightness-control@carlymx/applet.js

# Merge with existing translations (es.po)
msgmerge -U po/es.po po/brightness-control@carlymx.pot

# Merge with English translations (en.po)
msgmerge -U po/en.po po/brightness-control@carlymx.pot
```

### Add New Language

1. Create `po/<lang>.po` from template
2. Translate all `msgstr` entries
3. Compile with: `msgfmt -o po/<lang>/LC_MESSAGES/brightness-control@carlymx.mo po/<lang>.po`
4. Install to: `~/.local/share/locale/<lang>/LC_MESSAGES/`

## Manual Reset

```bash
# Software (GPU)
xrandr --output <monitor> --gamma 1:1:1
xrandr --output <monitor> --brightness 1.0

# Hardware (Monitor)
ddcutil setvcp 14 0x05    # Reset to 6500K
ddcutil setvcp 10 100     # Reset brightness to 100%
```

## Files

- `metadata.json` - Applet metadata
- `applet.js` - Main implementation (~480 lines)
- `settings-schema.json` - Configuration schema
- `stylesheet.css` - Custom styling
- `AGENTS.md` - Development guidelines

## Documentation

### [CHANGELOG.md](CHANGELOG.md) - Version History

Detailed version history with all changes, bug fixes, and new features.

### [AGENTS.md](AGENTS.md) - Development Guide

Complete guide for developers and AI agents:

- Build/install commands
- Code style guidelines
- Architecture documentation
- Key functions reference
- Troubleshooting tips

## License

See LICENSE file for details.