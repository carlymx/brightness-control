# CHANGELOG - Brightness Control Applet

## [Sin versionar] - Mejoras y Correcciones

### Correcciones

#### Compatibilidad Brillo + Temperatura

- **Bug**: Cambiar uno de los controles (brillo/temperatura) desactivaba el otro
- **Solución**: xrandr ahora aplica ambas propiedades (brightness + gamma) en un solo comando
- **Implementación**: `_setTemperature()` y `_fallbackXrandr()` incluyen brillo actual, `_setBrightness()` reaplica temperatura después del fallback

#### Validación de Brillo Mínimo

- **Bug**: El slider permitía bajar por debajo del brillo mínimo configurado
- **Solución**: El slider se "engancha" en el valor mínimo y no puede bajar más
- **Implementación**: `_onSliderChanged()`, `_onSliderValueChanged()` y `_debouncedOnSliderChanged()` corrigen `slider._value` al mínimo

### Funcionalidades

#### Soporte Múltiples Monitores

- Detección automática de monitores conectados con xrandr
- Botón para ciclar entre monitores disponibles (Auto / Monitor1 / Monitor2 / ...)
- Selección de monitor guardada en GSettings (`selected-monitor`)
- Funciona tanto con ddcutil (selección específica) como xrandr (todos los monitores)

#### Persistencia de Configuración

- Guardado automático de brillo y temperatura en GSettings
- Al iniciar el applet, se cargan los últimos valores guardados
- Settings: `saved-brightness` (0-100) y `saved-temperature` (0-1)
- Funciones: `_saveValues()` y `_loadSavedValues()`

#### Configuración use-ddcutil

- Setting funcional para activar/desactivar control de hardware
- True (default): Intenta usar ddcutil primero, fallback a xrandr si falla
- False: Usa directamente xrandr para control software

#### Eliminación de max-brightness

- Configuración innecesaria eliminada de settings-schema.json
- El slider siempre usa el rango completo 0-100%

#### Botón de Reset

- Agregar botón con icono ↺ para restablecer valores por defecto
- Valores por defecto: Brillo 50%, Temperatura 0.5 (natural)
- Aplicación inmediata de cambios al sistema
- Actualización de labels de texto

#### Iconos en Sliders

- Iconos emoji encima de cada slider para mejor visualización
- **Slider de brillo**: ☀ (sol) como cabecera
- **Slider de temperatura**: 🌙 (luna) como cabecera
- Elementos de menú con estilo 'popup-menu-header'
- Mejora la usabilidad y estética visual sin complejidad técnica

#### Actualización en Tiempo Real

- Nueva setting `realtime-update` en settings-schema.json
- Cuando está desactivado (default): cambios se aplican al soltar el slider (drag-end)
- Cuando está activado: cambios se aplican mientras se desliza (value-changed)
- Debouncing de 150ms para evitar saturación del sistema

### Estética

#### Handle del Slider Más Visible

- Tamaño aumentado: 20px → 22px (+10%)
- Sombra mejorada: 4px blur → 6px blur (+50% profundidad)
- Color: Blanco con borde gris oscuro (#3b4252)
- Funciona bien en temas claros y oscuros

### Técnico

#### Gestión de Eventos Dinámica

- Reconexión automática de eventos según setting `realtime-update`
- Almacenamiento de IDs de eventos para desconexión correcta
- Funciones `_connectSliderEvents()` y `_disconnectSliderEvents()`

#### Limpieza de Recursos

- Implementación de `destroy()` para limpieza completa
- Limpieza de timeouts pendientes en `_cleanupTimeouts()`
- Desconexión de señales al destruir el applet

#### Debouncing

- Implementación de wrappers con `GLib.timeout_add()`
- Cancelación de timeouts anteriores antes de crear nuevos
- Delay configurable: 150ms

#### Optimizaciones de Performance

- Múltiples monitores se controlan con una sola llamada a xrandr
- `_setXrandrBrightness()` y `_setTemperature()` construyen un solo comando con todos los outputs
- Reducción significativa de llamadas al sistema en setups multi-monitor

## v1.0.0 - Versión Inicial

### Funcionalidades

- Slider de control de brillo (30%-100%)
- Slider de control de temperatura (cálida ↔ natural ↔ fría)
- Labels mostrando valores actuales
- Compatibilidad con ddcutil (hardware) y xrandr (software fallback)

### Estética

- Icono `display-brightness` en el panel
- Menú popup con sliders y labels

### Técnico

- Applet para Cinnamon Desktop
- JavaScript (GJS/CJS)
- Gestión de settings con Cinnamon Settings API
