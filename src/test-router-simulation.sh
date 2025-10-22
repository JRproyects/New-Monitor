#!/bin/bash
# Script de simulación para probar la integración
# Simula un router enviando datos al sistema

SERVER_URL="https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/router-update"
AUTH_HEADER="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqa2xubGRxd21mcGFnamh2emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDU2NzcsImV4cCI6MjA3NTA4MTY3N30.NLnE3meI45wFW66AQHMoeZ5MOD8gy0edo0zWtmm6PKA"

# Colores para output
GREEN='\033[0;32m'
RED='\033[0;31m'
YELLOW='\033[0;33m'
NC='\033[0m'

echo "=== Simulador de Router para Testing ==="
echo "Servidor: $SERVER_URL"
echo ""

# Función para generar datos simulados de un router
generate_router_data() {
    local hostname=${1:-"TEST-ROUTER-$(date +%s)"}
    local ip_lan=${2:-"192.168.1.$(( RANDOM % 100 + 100 ))"}
    local ip_wan=${3:-"10.0.$(( RANDOM % 255 )).$(( RANDOM % 255 ))"}
    
    # Generar métricas aleatorias pero realistas
    local cpu_usage=$(( RANDOM % 60 + 20 ))
    local memory_usage=$(( RANDOM % 50 + 30 ))
    local load_avg=$(echo "scale=2; $(( RANDOM % 200 ))/100" | bc)
    local clients_2g=$(( RANDOM % 10 + 1 ))
    local clients_5g=$(( RANDOM % 15 + 2 ))
    local clients_total=$(( clients_2g + clients_5g ))
    local uptime_hours=$(( RANDOM % 168 + 1 ))
    local uptime_minutes=$(( RANDOM % 60 ))
    
    # JSON con formato del script info.sh
    cat << EOF
{
    "ip": "$ip_lan",
    "ip_wan": "$ip_wan",
    "hostname": "$hostname",
    "model": "TP-Link Archer C6V V1",
    "clients_connected_2": "$clients_2g",
    "clients_connected_5": "$clients_5g",
    "clients_connected": "$clients_total",
    "uptime": "${uptime_hours}:${uptime_minutes}",
    "token": "${hostname}-TOKEN-$(date +%s)",
    "ssid": "WiFi-${hostname}",
    "ssid_5": "WiFi-${hostname}-5GHz",
    "ch_2": "$(( RANDOM % 11 + 1 ))",
    "ch_5": "$(( RANDOM % 4 * 40 + 36 ))",
    "version": "OpenWrt 23.05.4",
    "cpu_usage": "$cpu_usage",
    "memory_usage": "$memory_usage",
    "load_avg": "$load_avg"
}
EOF
}

# Función para enviar datos de un router
send_router_data() {
    local router_data="$1"
    local hostname=$(echo "$router_data" | grep -o '"hostname":"[^"]*"' | cut -d'"' -f4)
    
    echo "Enviando datos de router: $hostname"
    echo "Datos JSON:"
    echo "$router_data" | jq . 2>/dev/null || echo "$router_data"
    echo ""
    
    response=$(curl -s -w "%{http_code}" -H "Content-Type: application/json" -H "$AUTH_HEADER" -d "$router_data" "$SERVER_URL")
    
    http_code="${response: -3}"
    response_body="${response%???}"
    
    if [ "$http_code" = "200" ]; then
        echo -e "${GREEN}✓ Datos enviados correctamente (HTTP $http_code)${NC}"
        echo "Respuesta del servidor:"
        echo "$response_body" | jq . 2>/dev/null || echo "$response_body"
    else
        echo -e "${RED}✗ Error enviando datos (HTTP $http_code)${NC}"
        echo "Respuesta del servidor:"
        echo "$response_body"
    fi
    echo ""
}

# Función para simular múltiples routers
simulate_multiple_routers() {
    local count=${1:-3}
    echo "Simulando $count routers..."
    echo ""
    
    for i in $(seq 1 $count); do
        echo "--- Router $i de $count ---"
        local hostname="SIMULADO-R$i"
        local ip_lan="192.168.$i.1"
        local ip_wan="203.0.113.$i"
        
        local router_data=$(generate_router_data "$hostname" "$ip_lan" "$ip_wan")
        send_router_data "$router_data"
        
        # Pequeña pausa entre envíos
        sleep 1
    done
}

# Función para simular un router específico
simulate_specific_router() {
    local hostname="$1"
    local ip_lan="$2"
    local ip_wan="$3"
    
    echo "Simulando router específico: $hostname"
    echo ""
    
    local router_data=$(generate_router_data "$hostname" "$ip_lan" "$ip_wan")
    send_router_data "$router_data"
}

# Función para simular actualizaciones continuas
simulate_continuous() {
    local hostname=${1:-"TEST-CONTINUOUS"}
    local interval=${2:-10}
    
    echo "Iniciando simulación continua para router: $hostname"
    echo "Intervalo: $interval segundos (Ctrl+C para detener)"
    echo ""
    
    local counter=1
    while true; do
        echo "--- Actualización #$counter ($(date)) ---"
        local router_data=$(generate_router_data "$hostname" "192.168.100.1" "203.0.113.100")
        send_router_data "$router_data"
        
        echo "Esperando $interval segundos..."
        sleep $interval
        counter=$((counter + 1))
        echo ""
    done
}

# Función para verificar servidor
test_server() {
    echo "Probando conectividad del servidor..."
    
    health_url="https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/health"
    response=$(curl -s "$health_url")
    
    if echo "$response" | grep -q '"success":true'; then
        echo -e "${GREEN}✓ Servidor operativo${NC}"
        echo "$response" | jq . 2>/dev/null || echo "$response"
    else
        echo -e "${RED}✗ Servidor no responde correctamente${NC}"
        echo "$response"
    fi
    echo ""
}

# Función de ayuda
show_help() {
    echo "Uso: $0 [comando] [argumentos]"
    echo ""
    echo "Comandos disponibles:"
    echo "  test-server                    - Probar conectividad del servidor"
    echo "  single [hostname] [ip_lan] [ip_wan] - Simular un router específico"
    echo "  multiple [cantidad]            - Simular múltiples routers (default: 3)"
    echo "  continuous [hostname] [intervalo] - Simulación continua (default: TEST-CONTINUOUS, 10s)"
    echo "  help                          - Mostrar esta ayuda"
    echo ""
    echo "Ejemplos:"
    echo "  $0 test-server"
    echo "  $0 single ROUTER-PRUEBA 192.168.1.100 203.0.113.50"
    echo "  $0 multiple 5"
    echo "  $0 continuous MI-ROUTER 30"
    echo ""
}

# Verificar dependencias
if ! command -v jq &> /dev/null; then
    echo -e "${YELLOW}Advertencia: jq no está instalado. El formato JSON puede no verse correctamente.${NC}"
    echo "Para instalar jq: sudo apt-get install jq (Ubuntu/Debian) o brew install jq (macOS)"
    echo ""
fi

if ! command -v bc &> /dev/null; then
    echo -e "${YELLOW}Advertencia: bc no está instalado. Usando valores enteros para load_avg.${NC}"
    echo ""
fi

# Procesar argumentos
case ${1:-"help"} in
    "test-server")
        test_server
        ;;
    "single")
        simulate_specific_router "$2" "$3" "$4"
        ;;
    "multiple")
        simulate_multiple_routers "$2"
        ;;
    "continuous")
        simulate_continuous "$2" "$3"
        ;;
    "help"|*)
        show_help
        ;;
esac