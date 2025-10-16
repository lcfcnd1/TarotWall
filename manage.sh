#!/bin/bash

# Script de gestión para TarotWall con PM2
# Uso: ./manage.sh [start|stop|restart|logs|status|delete]

APP_NAME="tarotwall"
SCRIPT_PATH="./server.js"
LOG_PATH="./logs"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

# Función para mostrar ayuda
show_help() {
    echo -e "${BLUE}TarotWall - Gestión con PM2${NC}"
    echo ""
    echo "Uso: $0 [comando]"
    echo ""
    echo "Comandos disponibles:"
    echo "  start     - Iniciar la aplicación"
    echo "  stop      - Detener la aplicación"
    echo "  restart   - Reiniciar la aplicación"
    echo "  logs      - Mostrar logs en tiempo real"
    echo "  status    - Mostrar estado de la aplicación"
    echo "  delete    - Eliminar la aplicación de PM2"
    echo "  install   - Instalar PM2 si no está instalado"
    echo "  setup     - Configurar PM2 para auto-inicio"
    echo ""
    echo "Ejemplos:"
    echo "  $0 start"
    echo "  $0 logs"
    echo "  $0 restart"
}

# Función para verificar si PM2 está instalado
check_pm2() {
    if ! command -v pm2 &> /dev/null; then
        echo -e "${RED}PM2 no está instalado.${NC}"
        echo -e "${YELLOW}Instalando PM2...${NC}"
        npm install -g pm2
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}PM2 instalado correctamente.${NC}"
        else
            echo -e "${RED}Error al instalar PM2.${NC}"
            exit 1
        fi
    fi
}

# Función para crear directorio de logs
create_logs_dir() {
    if [ ! -d "$LOG_PATH" ]; then
        mkdir -p "$LOG_PATH"
        echo -e "${GREEN}Directorio de logs creado: $LOG_PATH${NC}"
    fi
}

# Función para iniciar la aplicación
start_app() {
    echo -e "${BLUE}Iniciando TarotWall...${NC}"
    
    # Verificar si ya está ejecutándose
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        echo -e "${YELLOW}La aplicación ya está ejecutándose.${NC}"
        pm2 show "$APP_NAME"
        return 0
    fi
    
    # Verificar que server.js existe
    if [ ! -f "$SCRIPT_PATH" ]; then
        echo -e "${RED}Error: No se encontró $SCRIPT_PATH${NC}"
        exit 1
    fi
    
    # Crear directorio de logs
    create_logs_dir
    
    # Iniciar con PM2
    pm2 start "$SCRIPT_PATH" \
        --name "$APP_NAME" \
        --log "$LOG_PATH/$APP_NAME.log" \
        --error "$LOG_PATH/$APP_NAME-error.log" \
        --out "$LOG_PATH/$APP_NAME-out.log" \
        --time \
        --watch \
        --ignore-watch="node_modules logs *.db" \
        --restart-delay=1000 \
        --max-memory-restart=300M
    
    if [ $? -eq 0 ]; then
        echo -e "${GREEN}TarotWall iniciado correctamente.${NC}"
        pm2 show "$APP_NAME"
    else
        echo -e "${RED}Error al iniciar TarotWall.${NC}"
        exit 1
    fi
}

# Función para detener la aplicación
stop_app() {
    echo -e "${YELLOW}Deteniendo TarotWall...${NC}"
    
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 stop "$APP_NAME"
        echo -e "${GREEN}TarotWall detenido.${NC}"
    else
        echo -e "${YELLOW}La aplicación no está ejecutándose.${NC}"
    fi
}

# Función para reiniciar la aplicación
restart_app() {
    echo -e "${BLUE}Reiniciando TarotWall...${NC}"
    
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 restart "$APP_NAME"
        echo -e "${GREEN}TarotWall reiniciado.${NC}"
    else
        echo -e "${YELLOW}La aplicación no está ejecutándose. Iniciando...${NC}"
        start_app
    fi
}

# Función para mostrar logs
show_logs() {
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        echo -e "${BLUE}Mostrando logs de TarotWall (Ctrl+C para salir)...${NC}"
        pm2 logs "$APP_NAME" --lines 50
    else
        echo -e "${YELLOW}La aplicación no está ejecutándose.${NC}"
    fi
}

# Función para mostrar estado
show_status() {
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 show "$APP_NAME"
    else
        echo -e "${YELLOW}La aplicación no está ejecutándose.${NC}"
        pm2 list
    fi
}

# Función para eliminar la aplicación
delete_app() {
    echo -e "${RED}Eliminando TarotWall de PM2...${NC}"
    
    if pm2 describe "$APP_NAME" > /dev/null 2>&1; then
        pm2 delete "$APP_NAME"
        echo -e "${GREEN}TarotWall eliminado de PM2.${NC}"
    else
        echo -e "${YELLOW}La aplicación no está en PM2.${NC}"
    fi
}

# Función para configurar auto-inicio
setup_autostart() {
    echo -e "${BLUE}Configurando auto-inicio de PM2...${NC}"
    
    # Generar script de inicio
    pm2 startup
    
    # Guardar la configuración actual
    pm2 save
    
    echo -e "${GREEN}Auto-inicio configurado. PM2 se iniciará automáticamente al reiniciar el servidor.${NC}"
    echo -e "${YELLOW}Nota: Ejecuta 'pm2 startup' y sigue las instrucciones si es necesario.${NC}"
}

# Función para instalar PM2
install_pm2() {
    echo -e "${BLUE}Instalando PM2...${NC}"
    
    if command -v pm2 &> /dev/null; then
        echo -e "${YELLOW}PM2 ya está instalado.${NC}"
        pm2 --version
    else
        npm install -g pm2
        if [ $? -eq 0 ]; then
            echo -e "${GREEN}PM2 instalado correctamente.${NC}"
            pm2 --version
        else
            echo -e "${RED}Error al instalar PM2.${NC}"
            exit 1
        fi
    fi
}

# Función principal
main() {
    # Verificar si se proporcionó un comando
    if [ $# -eq 0 ]; then
        show_help
        exit 1
    fi
    
    # Verificar PM2 para comandos que lo requieren
    case "$1" in
        "install")
            install_pm2
            ;;
        "help"|"-h"|"--help")
            show_help
            ;;
        *)
            check_pm2
            ;;
    esac
    
    # Ejecutar comando
    case "$1" in
        "start")
            start_app
            ;;
        "stop")
            stop_app
            ;;
        "restart")
            restart_app
            ;;
        "logs")
            show_logs
            ;;
        "status")
            show_status
            ;;
        "delete")
            delete_app
            ;;
        "setup")
            setup_autostart
            ;;
        "install")
            # Ya ejecutado arriba
            ;;
        "help"|"-h"|"--help")
            # Ya ejecutado arriba
            ;;
        *)
            echo -e "${RED}Comando no válido: $1${NC}"
            echo ""
            show_help
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"
