[English version](README.md)

![imagen](./imgs/001.png)

# Brightness Control Applet para Cinnamon

Applet de control de brillo para monitores de escritorio en Cinnamon Desktop.

## Características

- Control de brillo (0-100%) con validación de límites
- Control de temperatura de color (cálida ↔ natural ↔ fría)
- Labels mostrando valores actuales
- **Iconos emoji** encima de cada slider
  - Brillo: ☀ (sol)
  - Temperatura: 🌙 (luna)
- Compatibilidad con ddcutil (hardware) y xrandr (software)
- **Soporte para múltiples monitores** con selector automático/manual
- **Persistencia de configuración** entre sesiones
- Brillo mínimo configurable (0-50%)
- Modo de control configurable (hardware/software)
- Actualización en tiempo real opcional con debouncing
- Botón de reset a valores por defecto
- Combinación perfecta de brillo y temperatura
- **Optimizado para performance** con comandos combinados

## Instalación

```bash
# Crear directorio del applet
mkdir -p ~/.local/share/cinnamon/applets/brightness-control@carlymx

# Copiar archivos
cp metadata.json applet.js settings-schema.json stylesheet.css ~/.local/share/cinnamon/applets/brightness-control@carlymx/

# Reiniciar Cinnamon
cinnamon --replace &
```

## Configuración

Click derecho en el applet → Configuración

- **Brillo mínimo (%)**: Valor mínimo permitido del slider de brillo (0-50%)
- **Usar ddcutil**: Activar control de hardware (requiere ddcutil instalado). Si está desactivado, usa xrandr (software)
- **Actualizar mientras deslizas**: Aplicar cambios en tiempo real con debouncing de 150ms

### Selector de Monitor

Desde el menú del applet:

- **Monitor: Auto**: Ajusta todos los monitores conectados
- **Monitor específico**: Ajusta solo el monitor seleccionado
- **Botón "Cambiar Monitor"**: Cicla entre monitores disponibles

### Persistencia Automática

El applet guarda automáticamente:

- Último nivel de brillo configurado
- Última temperatura de color configurada
- Monitor seleccionado

Al reiniciar Cinnamon, estos valores se restauran automáticamente.

## Dependencias Opcionales

Para control de hardware con ddcutil:

```bash
sudo apt install ddcutil i2c-tools
sudo usermod -aG i2c $USER
```

## Archivos

- `metadata.json` - Metadatos del applet
- `applet.js` - Código principal
- `settings-schema.json` - Configuración
- `stylesheet.css` - Estilos personalizados

## 📚 Documentación Adicional

Este proyecto incluye documentación detallada para diferentes audiencias:

### [AGENTS.md](AGENTS.md) - Guía para Agentes de IA

Guía completa para agentes de desarrollo que trabajan en este proyecto. Incluye:

- Comandos de build/lint/test detallados
- Convenciones de código y estilo
- Patrones específicos del proyecto
- Guías de desarrollo y mejores prácticas
- Referencia para configuración de Cinnamon applets

### [CHANGELOG.md](CHANGELOG.md) - Registro de Cambios

Historial completo de versiones y mejoras:

- Correcciones de bugs implementadas
- Nuevas funcionalidades agregadas
- Mejoras técnicas y estéticas
- Estado actual de desarrollo

### [PLAN_DESARROLLO_APPLET_BRILLO.md](PLAN_DESARROLLO_APPLET_BRILLO.md) - Plan de Desarrollo

Documentación técnica detallada del proyecto:

- Arquitectura tecnológica completa
- Plan de implementación paso a paso
- Guías de debugging y testing
- Referencias y ejemplos
- Estado de tareas y mejoras futuras

## Licencia

Ver archivo de licencia (si aplica).
