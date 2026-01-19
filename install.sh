#!/bin/bash
#
# Brightness Control Applet Installer v1.2.0
# Author: carlymx
# Description: Instala el applet con soporte multi-idioma
#
# Este script instala el applet y opcionalmente las traducciones
#

# ============================================
# Constantes
# ============================================
APPLET_NAME="brightness-control@carlymx"
REPO_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"
APPLET_SRC_DIR="$REPO_DIR/$APPLET_NAME"
TRANSLATIONS_DIR="$REPO_DIR/po"
APPLET_DIR="$HOME/.local/share/cinnamon/applets/$APPLET_NAME"
LOCALE_DIR="$HOME/.local/share/locale"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
BACKUP_DIR="$APPLET_DIR.backup.$TIMESTAMP"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# ============================================
# Funciones de utilidad
# ============================================

print_info() {
    echo -e "${BLUE}[INFO]${NC} $1"
}

print_success() {
    echo -e "${GREEN}[OK]${NC} $1"
}

print_warning() {
    echo -e "${YELLOW}[WARN]${NC} $1"
}

print_error() {
    echo -e "${RED}[ERROR]${NC} $1"
}

# ============================================
# Verificaciones iniciales
# ============================================

check_dependencies() {
    if ! command -v msgfmt &> /dev/null; then
        print_warning "msgfmt no encontrado. Las traducciones no se compilaran."
        return 1
    fi
    return 0
}

check_existing_installation() {
    if [ -d "$APPLET_DIR" ]; then
        return 0  # Existe instalación
    fi
    return 1  # No existe
}

# ============================================
# Funciones de instalación
# ============================================

install_applet() {
    local src_dir="$APPLET_SRC_DIR"
    
    # Crear directorio si no existe
    mkdir -p "$APPLET_DIR"
    
    # Copiar archivos del applet
    for file in metadata.json applet.js settings-schema.json stylesheet.css; do
        if [ -f "$src_dir/$file" ]; then
            cp "$src_dir/$file" "$APPLET_DIR/"
        fi
    done
    
    print_success "Archivos del applet instalados"
}

install_translations() {
    local lang=$1
    local po_file="$TRANSLATIONS_DIR/${lang}.po"
    local mo_dir="$TRANSLATIONS_DIR/${lang}/LC_MESSAGES"
    local mo_file="${mo_dir}/brightness-control@carlymx.mo"
    local locale_target="$LOCALE_DIR/${lang}/LC_MESSAGES"
    
    if [ ! -f "$po_file" ]; then
        print_warning "Archivo de traduccion no encontrado: $po_file"
        return 1
    fi
    
    # Compilar
    mkdir -p "$mo_dir"
    if msgfmt -o "$mo_file" "$po_file" 2>/dev/null; then
        print_success "Traduccion $lang compilada"
        
        # Instalar a locale
        mkdir -p "$locale_target"
        cp "$mo_file" "$locale_target/"
        print_success "Traduccion $lang instalada en $locale_target"
    else
        print_error "Error compilando traduccion $lang"
        return 1
    fi
}

do_backup() {
    print_info "Creando backup en: $BACKUP_DIR"
    cp -r "$APPLET_DIR" "$BACKUP_DIR"
    if [ $? -eq 0 ]; then
        print_success "Backup creado exitosamente"
        return 0
    else
        print_error "Error al crear backup"
        return 1
    fi
}

do_overwrite() {
    print_info "Sobreescribiendo instalacion existente"
    # Copiar archivos uno por uno, preservando algunos si es necesario
    for file in metadata.json applet.js settings-schema.json stylesheet.css; do
        if [ -f "$APPLET_DIR/$file" ]; then
            rm -f "$APPLET_DIR/$file"
        fi
        cp "$APPLET_SRC_DIR/$file" "$APPLET_DIR/" 2>/dev/null
    done
    print_success "Archivos sobreescritos"
}

do_remove_old() {
    print_info "Eliminando instalacion anterior"
    rm -rf "$APPLET_DIR"
    if [ $? -eq 0 ]; then
        print_success "Instalacion anterior eliminada"
        return 0
    else
        print_error "Error al eliminar instalacion anterior"
        return 1
    fi
}

# ============================================
# Menús
# ============================================

show_existing_menu() {
    echo ""
    echo "========================================"
    echo "  INSTALACION EXISTENTE DETECTADA"
    echo "========================================"
    echo "  Directorio: $APPLET_DIR"
    echo "========================================"
    echo ""
    echo "Opciones:"
    echo "  1) Hacer backup"
    echo "  2) Sobreescribir"
    echo "  3) Eliminar anterior e instalar"
    echo "  4) Salir sin instalar"
    echo ""
    echo -n "Selecciona una opcion [1-4]: "
    read -r option
    
    case $option in
        1)
            do_backup
            install_applet
            ;;
        2)
            do_overwrite
            ;;
        3)
            do_remove_old
            install_applet
            ;;
        4)
            print_info "Saliendo sin realizar cambios"
            exit 0
            ;;
        *)
            print_error "Opcion invalida"
            exit 1
            ;;
    esac
}

show_language_menu() {
    echo ""
    echo "========================================"
    echo "  SELECCION DE IDIOMA"
    echo "========================================"
    echo ""
    echo "Opciones:"
    echo "  1) Español"
    echo "  2) Ingles"
    echo "  3) Ambos"
    echo "  0) Cancelar"
    echo ""
    echo -n "Selecciona una opcion [0-3]: "
    read -r option
    
    case $option in
        1)
            install_translations "es"
            ;;
        2)
            install_translations "en"
            ;;
        3)
            install_translations "es"
            install_translations "en"
            ;;
        0)
            print_warning "Traducciones canceladas"
            ;;
        *)
            print_error "Opcion invalida"
            ;;
    esac
}

show_exit_menu() {
    echo ""
    echo "========================================"
    echo "  INSTALACION COMPLETADA"
    echo "========================================"
    echo ""
    echo -e "${YELLOW}IMPORTANTE:${NC} Para que los cambios surtan efecto,"
    echo "debes reiniciar Cinnamon o la sesion."
    echo ""
    echo "Opciones de salida:"
    echo "  1) Solo salir (reinicia Cinnamon manualmente)"
    echo "  2) Reiniciar Cinnamon y salir"
    echo "  0) Cancelar (mantener sesion actual)"
    echo ""
    echo -n "Selecciona una opcion [0-2]: "
    read -r option
    
    case $option in
        1)
            print_info "Puedes reiniciar Cinnamon con: cinnamon --replace &"
            exit 0
            ;;
        2)
            print_info "Reiniciando Cinnamon..."
            cinnamon --replace & > /dev/null 2>&1
            sleep 3
            print_success "Cinnamon reiniciado"
            exit 0
            ;;
        0)
            print_info "Sesion mantenida. Reinicia Cinnamon manualmente."
            exit 0
            ;;
        *)
            print_error "Opcion invalida"
            exit 1
            ;;
    esac
}

# ============================================
# Main
# ============================================

main() {
    # Verificar que no se ejecute como root
    if [ "$(id -u)" -eq 0 ]; then
        print_error "Este script no debe ejecutarse como root"
        print_info "Ejecutalo como usuario normal"
        exit 1
    fi
    
    echo ""
    echo "========================================"
    echo "  Brightness Control Applet v1.2.0"
    echo "  Instalador"
    echo "========================================"
    echo ""
    
    # Verificar dependencias
    check_dependencies
    
    # Verificar archivos fuente
    if [ ! -f "$APPLET_SRC_DIR/metadata.json" ]; then
        print_error "No se encontro metadata.json en: $APPLET_SRC_DIR"
        print_info "Asegurate de ejecutar el script desde el directorio del proyecto"
        print_info "El script debe estar en la raiz y el applet en: $APPLET_NAME/"
        exit 1
    fi
    
    print_info "Directorio del repositorio: $REPO_DIR"
    print_info "Archivos del applet: $APPLET_SRC_DIR"
    print_info "Directorio de instalacion: $APPLET_DIR"
    echo ""
    
    # Verificar instalacion existente
    if check_existing_installation; then
        show_existing_menu
    else
        install_applet
    fi
    
    # Preguntar por traducciones
    echo ""
    print_info "Instalacion del applet completada"
    echo ""
    echo -n "¿Deseas instalar las traducciones? [s/N]: "
    read -r answer
    
    if [[ "$answer" =~ ^[Ss]$ ]]; then
        show_language_menu
    else
        print_warning "Traducciones no instaladas"
    fi
    
    # Menu de salida
    show_exit_menu
}

# Ejecutar main
main "$@"
