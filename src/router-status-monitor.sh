#!/bin/bash
# Script de monitoreo del estado de routers
# Muestra información en tiempo real sobre los routers conectados al sistema

SERVER_URL="https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqa2xubGRxd21mcGFnamh2emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDU2NzcsImV4cCI6MjA3NTA4MTY3N30.NLnE3meI45wFW66AQHMoeZ5MOD8gy0edo0zWtmm6PKA"

# Colores para output
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[0;33m'
BLUE='\033[0;34m'
NC='\033[0m' # No Color

echo "=== Monitor de Estado de Routers ==="
echo "Conectando al servidor: $SERVER_URL"
echo ""

# Función para mostrar el estado de un router
show_router_status() {
    local hostname=$1
    echo "Consultando estado de: $hostname"
    
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/router-status/$hostname")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Router encontrado${NC}"
        
        # Extraer información usando grep y sed
        ip_lan=$(echo "$response" | grep -o '"ipLan":"[^"]*"' | cut -d'"' -f4)
        ip_wan=$(echo "$response" | grep -o '"ipWan":"[^"]*"' | cut -d'"' -f4)
        status=$(echo "$response" | grep -o '"status":"[^"]*"' | cut -d'"' -f4)
        uptime=$(echo "$response" | grep -o '"uptime":"[^"]*"' | cut -d'"' -f4)
        connected_devices=$(echo "$response" | grep -o '"connectedDevices":[0-9]*' | cut -d':' -f2)
        hardware=$(echo "$response" | grep -o '"hardware":"[^"]*"' | cut -d'"' -f4)
        
        case $status in
            "online")
                status_color=$GREEN
                ;;
            "warning")
                status_color=$YELLOW
                ;;
            "offline")
                status_color=$RED
                ;;
            *)
                status_color=$NC
                ;;
        esac
        
        echo "  - IP LAN: $ip_lan"
        echo "  - IP WAN: $ip_wan"
        echo -e "  - Estado: ${status_color}$status${NC}"
        echo "  - Uptime: $uptime"
        echo "  - Dispositivos conectados: $connected_devices"
        echo "  - Hardware: $hardware"
    else
        echo -e "${RED}✗ Router no encontrado o error${NC}"
        echo "$response" | grep -o '"error":"[^"]*"' | cut -d'"' -f4
    fi
    echo ""
}

# Función para mostrar todos los routers
show_all_routers() {
    echo "=== Lista de Todos los Routers ==="
    
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/access-points")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Datos obtenidos correctamente${NC}"
        echo ""
        
        # Mostrar estadísticas generales
        total=$(echo "$response" | grep -o '"hostname"' | wc -l)
        echo "Total de routers registrados: $total"
        echo ""
        
        # Mostrar cada router (simplificado para el script bash)
        echo "Hostnames encontrados:"
        echo "$response" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4 | while read hostname; do
            echo "  - $hostname"
        done
    else
        echo -e "${RED}✗ Error obteniendo lista de routers${NC}"
        echo "$response"
    fi
    echo ""
}

# Función para mostrar métricas del sistema
show_metrics() {
    echo "=== Métricas del Sistema ==="
    
    response=$(curl -s -H "$AUTH_HEADER" "$SERVER_URL/metrics")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Métricas obtenidas${NC}"
        
        total_devices=$(echo "$response" | grep -o '"totalDevices":[0-9]*' | cut -d':' -f2)
        online_devices=$(echo "$response" | grep -o '"onlineDevices":[0-9]*' | cut -d':' -f2)
        offline_devices=$(echo "$response" | grep -o '"offlineDevices":[0-9]*' | cut -d':' -f2)
        warning_devices=$(echo "$response" | grep -o '"warningDevices":[0-9]*' | cut -d':' -f2)
        last_update=$(echo "$response" | grep -o '"lastUpdate":"[^"]*"' | cut -d'"' -f4)
        
        echo "  - Total de dispositivos: $total_devices"
        echo -e "  - En línea: ${GREEN}$online_devices${NC}"
        echo -e "  - Fuera de línea: ${RED}$offline_devices${NC}"
        echo -e "  - Con advertencias: ${YELLOW}$warning_devices${NC}"
        echo "  - Última actualización: $last_update"
    else
        echo -e "${RED}✗ Error obteniendo métricas${NC}"
        echo "$response"
    fi
    echo ""
}

# Función para test de conectividad
test_connectivity() {
    echo "=== Test de Conectividad ==="
    
    echo "Probando endpoint de salud..."
    response=$(curl -s "$SERVER_URL/health")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Servidor operativo${NC}"
        echo "$response" | grep -o '"message":"[^"]*"' | cut -d'"' -f4
    else
        echo -e "${RED}✗ Servidor no responde correctamente${NC}"
        echo "$response"
    fi
    echo ""
}

# Función principal
main() {
    if [ $# -eq 0 ]; then
        echo "Uso: $0 [comando] [argumentos]"
        echo ""
        echo "Comandos disponibles:"
        echo "  all          - Mostrar todos los routers"
        echo "  metrics      - Mostrar métricas del sistema"
        echo "  status <hostname> - Mostrar estado de un router específico"
        echo "  test         - Test de conectividad"
        echo "  monitor      - Monitor en tiempo real (actualiza cada 10 segundos)"
        echo ""
        echo "Ejemplos:"
        echo "  $0 all"
        echo "  $0 status CUMBRES-P1"
        echo "  $0 monitor"
        exit 1
    fi
    
    case $1 in
        "all")
            show_all_routers
            ;;
        "metrics")
            show_metrics
            ;;
        "status")
            if [ -z "$2" ]; then
                echo "Error: Especifica el hostname del router"
                echo "Uso: $0 status <hostname>"
                exit 1
            fi
            show_router_status "$2"
            ;;
        "test")
            test_connectivity
            ;;
        "monitor")
            echo "Iniciando monitor en tiempo real (Ctrl+C para salir)..."
            echo ""
            while true; do
                clear
                echo "$(date '+%Y-%m-%d %H:%M:%S') - Monitor de Routers"
                echo "========================================"
                test_connectivity
                show_metrics
                show_all_routers
                echo "Actualizando en 10 segundos..."
                sleep 10
            done
            ;;
        *)
            echo "Comando no reconocido: $1"
            echo "Usa '$0' sin argumentos para ver la ayuda"
            exit 1
            ;;
    esac
}

# Ejecutar función principal con todos los argumentos
main "$@"