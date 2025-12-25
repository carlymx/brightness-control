#!/bin/bash

# Script para preparar el Pull Request de Brightness Control en Cinnamon Spices
# Uso: ./preparar_pr_spices.sh

set -e

COLOR_VERDE='\033[0;32m'
COLOR_AMARILLO='\033[1;33m'
COLOR_ROJO='\033[0;31m'
COLOR_RESET='\033[0m'

echo -e "${COLOR_AMARILLO}=================================="
echo "Preparando PR para Cinnamon Spices"
echo "==================================${COLOR_RESET}"
echo ""

# Verificar fork existe
echo -e "${COLOR_AMARILLO}[1/6] Verificando fork de cinnamon-spices-applets...${COLOR_RESET}"

if ! git ls-remote --exit-code https://github.com/carlymx/cinnamon-spices-applets.git &>/dev/null; then
    echo -e "${COLOR_ROJO}ERROR: Fork no encontrado!${COLOR_RESET}"
    echo ""
    echo "Primero debes hacer fork del repositorio:"
    echo "1. Abre: https://github.com/linuxmint/cinnamon-spices-applets"
    echo "2. Click en 'Fork' (arriba a la derecha)"
    echo "3. Espera a que se cree el fork"
    echo "4. Ejecuta este script nuevamente"
    exit 1
fi

echo -e "${COLOR_VERDE}✓ Fork encontrado${COLOR_RESET}"
echo ""

# Clonar fork
echo -e "${COLOR_AMARILLO}[2/6] Clonando fork...${COLOR_RESET}"

if [ -d "/tmp/cinnamon-spices-applets" ]; then
    echo "Directorio existe, eliminando..."
    rm -rf /tmp/cinnamon-spices-applets
fi

cd /tmp
git clone https://github.com/carlymx/cinnamon-spices-applets.git
cd cinnamon-spices-applets

echo -e "${COLOR_VERDE}✓ Fork clonado en /tmp/cinnamon-spices-applets${COLOR_RESET}"
echo ""

# Crear rama
echo -e "${COLOR_AMARILLO}[3/6] Creando rama brightness-control@carlymx...${COLOR_RESET}"

git checkout -b brightness-control@carlymx 2>/dev/null || {
    echo "Rama ya existe, cambiando a ella..."
    git checkout brightness-control@carlymx
}

echo -e "${COLOR_VERDE}✓ Rama creada/activada${COLOR_RESET}"
echo ""

# Copiar estructura del applet
echo -e "${COLOR_AMARILLO}[4/6] Copiando estructura del applet...${COLOR_RESET}"

# Directorio del proyecto
PROJECT_DIR="/home/carly/Escritorio/brightness-control"

if [ ! -d "$PROJECT_DIR/brightness-control@carlymx" ]; then
    echo -e "${COLOR_ROJO}ERROR: No se encuentra el directorio del proyecto${COLOR_RESET}"
    exit 1
fi

# Copiar todo el directorio brightness-control@carlymx al fork
cp -r "$PROJECT_DIR/brightness-control@carlymx" .

echo -e "${COLOR_VERDE}✓ Estructura copiada${COLOR_RESET}"
echo ""

# Validar estructura
echo -e "${COLOR_AMARILLO}[5/6] Validando estructura con validate-spice...${COLOR_RESET}"

if ! [ -f "./validate-spice" ]; then
    echo -e "${COLOR_ROJO}ERROR: Script validate-spice no encontrado${COLOR_RESET}"
    echo "Asegúrate de estar en el fork de cinnamon-spices-applets"
    exit 1
fi

./validate-spice brightness-control@carlymx

if [ $? -eq 0 ]; then
    echo -e "${COLOR_VERDE}✓ Validación exitosa${COLOR_RESET}"
else
    echo -e "${COLOR_ROJO}ERROR: Validación falló${COLOR_RESET}"
    echo "Corrige los errores y vuelve a ejecutar el script"
    exit 1
fi
echo ""

# Hacer commit
echo -e "${COLOR_AMARILLO}[6/6] Haciendo commit...${COLOR_RESET}"

git add brightness-control@carlymx/

COMMIT_MSG="Add Brightness Control applet by carlymx - v1.1.0

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
- Website: https://github.com/carlymx/brightness-control"

git commit -m "$COMMIT_MSG"

echo -e "${COLOR_VERDE}✓ Commit creado${COLOR_RESET}"
echo ""

# Resumen
echo -e "${COLOR_AMARILLO}=================================="
echo "¡Preparación completada!"
echo "==================================${COLOR_RESET}"
echo ""
echo -e "${COLOR_VERDE}Lo que debes hacer ahora:${COLOR_RESET}"
echo ""
echo "1. Abre GitHub Desktop"
echo "2. Agrega el repo: /tmp/cinnamon-spices-applets"
echo "3. Haz PUSH de la rama 'brightness-control@carlymx' a tu fork"
echo "4. Crea el Pull Request desde GitHub Desktop o el navegador"
echo ""
echo -e "${COLOR_AMARILLO}URL del PR (cuando hagas push):${COLOR_RESET}"
echo "https://github.com/carlymx/cinnamon-spices-applets/compare/master...brightness-control@carlymx"
echo ""
echo -e "${COLOR_VERDE}¡Listo para enviar el PR!${COLOR_RESET}"
