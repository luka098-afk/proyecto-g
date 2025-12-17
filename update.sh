#!/bin/bash

# ══════════════════════════════════════════════════════
# 🔄 SCRIPT DE ACTUALIZACIÓN DEL BOT
# ══════════════════════════════════════════════════════
# Este script actualiza el código desde GitHub sin
# tocar tus archivos JSON, auth/ ni configuraciones locales
# ══════════════════════════════════════════════════════

set -e  # Detener si hay error

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
CYAN='\033[0;36m'
NC='\033[0m' # Sin color

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Mostrar banner
# ══════════════════════════════════════════════════════
show_banner() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║   🔄 ACTUALIZADOR DE BOT WHATSAPP     ║"
    echo "╠════════════════════════════════════════╣"
    echo "║  Actualiza código sin tocar tus datos  ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Verificar si hay cambios
# ══════════════════════════════════════════════════════
check_updates() {
    echo -e "${BLUE}📡 Verificando actualizaciones...${NC}"
    
    # Fetch sin modificar archivos locales
    git fetch origin main 2>/dev/null || git fetch origin master 2>/dev/null
    
    # Obtener commits locales y remotos
    LOCAL=$(git rev-parse @)
    REMOTE=$(git rev-parse @{u} 2>/dev/null || echo "")
    
    if [ -z "$REMOTE" ]; then
        echo -e "${RED}❌ No se pudo conectar con el repositorio remoto${NC}"
        exit 1
    fi
    
    if [ "$LOCAL" = "$REMOTE" ]; then
        echo -e "${GREEN}✅ El bot ya está actualizado${NC}"
        echo -e "${CYAN}ℹ️  No hay cambios nuevos en GitHub${NC}"
        exit 0
    else
        echo -e "${YELLOW}📦 Hay actualizaciones disponibles${NC}"
        
        # Mostrar cantidad de commits nuevos
        BEHIND=$(git rev-list --count HEAD..@{u})
        echo -e "${CYAN}ℹ️  $BEHIND commits nuevos disponibles${NC}"
        return 1
    fi
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Backup de archivos importantes
# ══════════════════════════════════════════════════════
backup_files() {
    echo -e "${BLUE}💾 Creando backup de archivos locales...${NC}"
    
    BACKUP_DIR="backup_$(date +%Y%m%d_%H%M%S)"
    mkdir -p "$BACKUP_DIR"
    
    # Backup de JSONs
    if ls *.json 1> /dev/null 2>&1; then
        cp -r *.json "$BACKUP_DIR/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ JSONs respaldados${NC}"
    fi
    
    # Backup de auth/
    if [ -d "auth" ]; then
        cp -r auth/ "$BACKUP_DIR/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ Carpeta auth/ respaldada${NC}"
    fi
    
    # Backup de cookies.txt
    if [ -f "cookies.txt" ]; then
        cp cookies.txt "$BACKUP_DIR/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ cookies.txt respaldado${NC}"
    fi
    
    # Backup de config.js (si tiene datos locales)
    if [ -f "config.js" ]; then
        cp config.js "$BACKUP_DIR/" 2>/dev/null || true
        echo -e "${GREEN}  ✅ config.js respaldado${NC}"
    fi
    
    echo -e "${CYAN}ℹ️  Backup guardado en: $BACKUP_DIR${NC}"
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Actualizar código
# ══════════════════════════════════════════════════════
update_code() {
    echo -e "${BLUE}⬇️  Descargando actualizaciones...${NC}"
    
    # Guardar cambios locales temporalmente (stash)
    if ! git diff-index --quiet HEAD --; then
        echo -e "${YELLOW}⚠️  Guardando cambios locales temporalmente...${NC}"
        git stash push -m "Auto-stash before update $(date +%Y%m%d_%H%M%S)"
    fi
    
    # Pull con estrategia que preserva archivos locales
    git pull --strategy-option=ours origin main 2>/dev/null || \
    git pull --strategy-option=ours origin master 2>/dev/null
    
    echo -e "${GREEN}✅ Código actualizado${NC}"
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Restaurar archivos locales
# ══════════════════════════════════════════════════════
restore_local_files() {
    echo -e "${BLUE}📂 Restaurando archivos locales...${NC}"
    
    # Los archivos en .gitignore no se tocan por git pull
    # Pero por seguridad, verificamos
    
    if [ -d "$BACKUP_DIR" ]; then
        # Restaurar auth/ si se perdió
        if [ -d "$BACKUP_DIR/auth" ] && [ ! -d "auth" ]; then
            cp -r "$BACKUP_DIR/auth" ./
            echo -e "${GREEN}  ✅ auth/ restaurada${NC}"
        fi
        
        # Restaurar JSONs si se perdieron
        for json in "$BACKUP_DIR"/*.json; do
            if [ -f "$json" ]; then
                filename=$(basename "$json")
                if [ ! -f "$filename" ] && [ "$filename" != "package.json" ]; then
                    cp "$json" ./
                    echo -e "${GREEN}  ✅ $filename restaurado${NC}"
                fi
            fi
        done
        
        # Restaurar cookies.txt si se perdió
        if [ -f "$BACKUP_DIR/cookies.txt" ] && [ ! -f "cookies.txt" ]; then
            cp "$BACKUP_DIR/cookies.txt" ./
            echo -e "${GREEN}  ✅ cookies.txt restaurado${NC}"
        fi
    fi
    
    echo -e "${GREEN}✅ Archivos locales preservados${NC}"
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Actualizar dependencias
# ══════════════════════════════════════════════════════
update_dependencies() {
    echo -e "${BLUE}📦 Verificando dependencias...${NC}"
    
    # Verificar si package.json cambió
    if git diff HEAD@{1} HEAD -- package.json | grep -q "dependencies"; then
        echo -e "${YELLOW}⚠️  package.json cambió, actualizando dependencias...${NC}"
        npm install
        echo -e "${GREEN}✅ Dependencias actualizadas${NC}"
    else
        echo -e "${CYAN}ℹ️  No hay cambios en las dependencias${NC}"
    fi
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Limpiar backups antiguos
# ══════════════════════════════════════════════════════
cleanup_old_backups() {
    echo -e "${BLUE}🧹 Limpiando backups antiguos...${NC}"
    
    # Mantener solo los últimos 5 backups
    ls -dt backup_* 2>/dev/null | tail -n +6 | xargs rm -rf 2>/dev/null || true
    
    echo -e "${GREEN}✅ Backups antiguos eliminados${NC}"
}

# ══════════════════════════════════════════════════════
# 📋 FUNCIÓN: Mostrar cambios
# ══════════════════════════════════════════════════════
show_changes() {
    echo -e "${CYAN}"
    echo "╔════════════════════════════════════════╗"
    echo "║        📝 CAMBIOS REALIZADOS           ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
    
    # Mostrar últimos 5 commits
    git log --oneline --decorate -5
    
    echo ""
}

# ══════════════════════════════════════════════════════
# 🚀 MAIN: Ejecutar actualización
# ══════════════════════════════════════════════════════

main() {
    show_banner
    
    # Verificar que estamos en un repositorio git
    if [ ! -d ".git" ]; then
        echo -e "${RED}❌ Error: No estás en un repositorio git${NC}"
        echo -e "${YELLOW}💡 Ejecuta esto primero:${NC}"
        echo -e "   git init"
        echo -e "   git remote add origin https://github.com/TU_USUARIO/proyecto-g-bot.git"
        exit 1
    fi
    
    # Verificar si hay actualizaciones
    if check_updates; then
        exit 0
    fi
    
    # Preguntar al usuario
    echo ""
    echo -e "${YELLOW}¿Deseas actualizar el bot? (s/n)${NC}"
    read -r response
    
    if [[ ! "$response" =~ ^[Ss]$ ]]; then
        echo -e "${CYAN}ℹ️  Actualización cancelada${NC}"
        exit 0
    fi
    
    echo ""
    
    # Proceso de actualización
    backup_files
    update_code
    restore_local_files
    update_dependencies
    cleanup_old_backups
    show_changes
    
    echo ""
    echo -e "${GREEN}"
    echo "╔════════════════════════════════════════╗"
    echo "║     ✅ ACTUALIZACIÓN COMPLETADA        ║"
    echo "╠════════════════════════════════════════╣"
    echo "║  Tus datos locales están intactos      ║"
    echo "║  Reinicia el bot: npm start            ║"
    echo "╚════════════════════════════════════════╝"
    echo -e "${NC}"
}

# Ejecutar script
main
