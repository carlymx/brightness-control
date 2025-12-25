[Versión en español](README_ES.md)

![imagen](./imgs/001.png)

# Brightness Control Applet for Cinnamon

Cinnamon Desktop applet for controlling monitor brightness and color temperature.

## Features

- Brightness control (0-100%) with limit validation
- Color temperature control (warm ↔ natural ↔ cool)
- Labels showing current values
- **Emoji icons** above each slider
  - Brightness: ☀ (sun)
  - Temperature: 🌙 (moon)
- Compatibility with ddcutil (hardware) and xrandr (software)
- **Multi-monitor support** with automatic/manual selector
- **Configuration persistence** across sessions
- Configurable minimum brightness (0-50%)
- Configurable control mode (hardware/software)
- Optional real-time updates with debouncing
- Reset button to default values
- Perfect combination of brightness and temperature
- **Performance optimized** with combined commands

## Installation

```bash
# Create applet directory
mkdir -p ~/.local/share/cinnamon/applets/brightness-control@carlymx

# Copy files
cp metadata.json applet.js settings-schema.json stylesheet.css ~/.local/share/cinnamon/applets/brightness-control@carlymx/

# Restart Cinnamon
cinnamon --replace &
```

## Configuration

Right-click on the applet → Configuration

- **Minimum Brightness (%)**: Minimum allowed slider value (0-50%)
- **Use ddcutil**: Enable hardware control (requires ddcutil installed). If disabled, uses xrandr (software)
- **Update while sliding**: Apply changes in real-time with 150ms debouncing

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

## Files

- `metadata.json` - Applet metadata
- `applet.js` - Main code
- `settings-schema.json` - Configuration
- `stylesheet.css` - Custom styles

## 📚 Additional Documentation

This project includes detailed documentation for different audiences:

### [AGENTS.md](AGENTS.md) - Guide for AI Agents

Complete guide for development agents working on this project. Includes:

- Detailed build/lint/test commands
- Code conventions and style
- Project-specific patterns
- Development guides and best practices
- Reference for Cinnamon applet configuration

### [CHANGELOG.md](CHANGELOG.md) - Changelog

Complete version history and improvements:

- Implemented bug fixes
- Added new features
- Technical and aesthetic improvements
- Current development status

### [PLAN_DESARROLLO_APPLET_BRILLO.md](PLAN_DESARROLLO_APPLET_BRILLO.md) - Development Plan

Detailed technical project documentation:

- Complete technological architecture
- Step-by-step implementation plan
- Debugging and testing guides
- References and examples
- Task status and future improvements

## License

See license file (if applicable).