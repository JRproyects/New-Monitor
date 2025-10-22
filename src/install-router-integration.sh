#!/bin/bash
# Script de instalación para integrar routers OpenWRT con el Sistema Gestor de Routers
# Ejecutar en el router como root

echo "=== Instalación del Sistema Gestor de Routers ==="
echo "Este script configurará el router para enviar datos al nuevo sistema de gestión"
echo ""

# Verificar si estamos en OpenWRT
if [ ! -f "/etc/openwrt_release" ]; then
    echo "ERROR: Este script debe ejecutarse en un router con OpenWRT"
    exit 1
fi

# Crear directorio de scripts si no existe
mkdir -p /etc/config/scripts

# Verificar si existe el token
if [ ! -f "/etc/config/scripts/token" ]; then
    echo "ADVERTENCIA: No se encontró el archivo de token en /etc/config/scripts/token"
    echo "¿Deseas crear un token único para este router? (y/n)"
    read -r create_token
    
    if [ "$create_token" = "y" ] || [ "$create_token" = "Y" ]; then
        # Generar token único basado en MAC address y hostname
        HOSTNAME=$(cat /etc/config/system | grep hostname | cut -d "'" -f2)
        MAC_ADDR=$(ifconfig eth0 | grep HWaddr | awk '{print $5}' | tr -d ':')
        TOKEN="${HOSTNAME}-${MAC_ADDR}-$(date +%s)"
        echo "$TOKEN" > /etc/config/scripts/token
        echo "Token creado: $TOKEN"
    else
        echo "Debes crear manualmente el archivo /etc/config/scripts/token con un token único"
        exit 1
    fi
fi

# Backup del script original si existe
if [ -f "/etc/config/scripts/info.sh" ]; then
    echo "Creando backup del script original..."
    cp /etc/config/scripts/info.sh /etc/config/scripts/info.sh.backup.$(date +%Y%m%d_%H%M%S)
fi

# Copiar el nuevo script
echo "Instalando el nuevo script de reporte..."
cat > /etc/config/scripts/info.sh << 'EOF'
#!/bin/sh
#version=2025100301
# Script actualizado para enviar datos al Sistema Gestor de Routers

IP_WAN=$(ifconfig | grep -A1 "eth1" | grep addr: | cut -d":" -f2 | cut -d" " -f1)
IP_LAN=$(cat /etc/config/network | grep -A10 "config interface 'lan'" | grep ipaddr | cut -d"'" -f2)
HOSTNAME=$(cat /etc/config/system | grep hostname | cut -d "'" -f2)
MODEL=$(cat /proc/cpuinfo | grep machine | cut -d":" -f 2 | xargs)
VERSION=$(cat /etc/openwrt_release | grep DISTRIB_DESCRIPTION | cut -d "'" -f2 | cut -d " " -f1-2)
UPTIME=$(uptime | cut -d "p" -f2 | cut -d "," -f1)
TOKEN=$(cat /etc/config/scripts/token)

# Desde la version openwrt 23.x las interfaces se renombran a phy0-ap0 (5GHz) y phy1-ap0 (2.4GHz) 
if echo $VERSION | grep -q 23; then
	DEVICE_5=phy0-ap0
	DEVICE_2=phy1-ap0
else
	DEVICE_5=wlan0
	DEVICE_2=wlan1
fi

CH_2=$(iwinfo $DEVICE_2 info | grep Channel | head -n1 | awk '{print $4}')
CH_5=$(iwinfo $DEVICE_5 info | grep Channel | head -n1 | awk '{print $4}')

# Se obtienen los SSID de ambas interfaces, si la interface esta apagada se setea OFF
SSID_STATUS=$(cat /etc/config/wireless)
if echo $SSID_STATUS | grep -q "disabled '1'"; then
        SSID_2G=OFF
        SSID_5G=OFF
else
	SSID_2G=$(cat /etc/config/wireless | grep ssid | awk '{print $NF}' | cut -d "'" -f2 |tail -n1)
	SSID_5G=$(cat /etc/config/wireless | grep ssid | awk '{print $NF}' | cut -d "'" -f2 | head -n1)
fi

# Se obtienen los clientes conectados de ambas interfaces 2.4 y 5GHz
CLIENTS_CONNECTED_2G=$(iwinfo $DEVICE_2 assoclist | grep dBm | wc -l)
CLIENTS_CONNECTED_5G=$(iwinfo $DEVICE_5 assoclist | grep dBm | wc -l)
CLIENTS_CONNECTED=$((CLIENTS_CONNECTED_2G+CLIENTS_CONNECTED_5G))

# Se obtienen métricas adicionales del sistema
CPU_USAGE=$(top -bn1 | grep "CPU:" | sed "s/.*, *\([0-9.]*\)%id.*/\1/" | awk '{print 100 - $1}')
MEMORY_USAGE=$(free | grep Mem | awk '{printf("%.0f", $3/$2 * 100.0)}')
LOAD_AVG=$(uptime | awk -F'load average:' '{print $2}' | awk '{print $1}' | sed 's/,//')

# Se arma el json con los datos para publicar
JSON_STRING="{\"ip\":\"$IP_LAN\",
		\"ip_wan\":\"$IP_WAN\",
		\"hostname\":\"$HOSTNAME\",
		\"model\":\"$MODEL\",
		\"clients_connected_2\":\"$CLIENTS_CONNECTED_2G\",
		\"clients_connected_5\":\"$CLIENTS_CONNECTED_5G\",
		\"clients_connected\":\"$CLIENTS_CONNECTED\",
		\"uptime\":\"$UPTIME\",
		\"token\":\"$TOKEN\", 
		\"ssid\":\"$SSID_2G\",
		\"ssid_5\":\"$SSID_5G\",
		\"ch_2\":\"$CH_2\",
		\"ch_5\":\"$CH_5\",
		\"version\":\"$VERSION\",
		\"cpu_usage\":\"$CPU_USAGE\",
		\"memory_usage\":\"$MEMORY_USAGE\",
		\"load_avg\":\"$LOAD_AVG\"
		}"

echo $JSON_STRING

# URL del servidor Supabase
SERVER_URL="https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/router-update"

# Envío principal al nuevo sistema gestor
wget -q "$SERVER_URL" \
     --header="Content-Type: application/json" \
     --header="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqa2xubGRxd21mcGFnamh2emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDU2NzcsImV4cCI6MjA3NTA4MTY3N30.NLnE3meI45wFW66AQHMoeZ5MOD8gy0edo0zWtmm6PKA" \
     --post-data "$JSON_STRING" \
     -O /dev/null

EOF

# Hacer el script ejecutable
chmod +x /etc/config/scripts/info.sh

# Configurar crontab para ejecutar cada 30 segundos
echo "Configurando la tarea programada..."

# Crear script que ejecute info.sh cada 30 segundos
cat > /etc/config/scripts/router_monitor.sh << 'EOF'
#!/bin/sh
# Monitor del router - ejecuta info.sh cada 30 segundos

while true; do
    /etc/config/scripts/info.sh
    sleep 30
done
EOF

chmod +x /etc/config/scripts/router_monitor.sh

# Verificar si ya existe en crontab
if ! crontab -l 2>/dev/null | grep -q "router_monitor.sh"; then
    # Agregar a crontab para que se ejecute al reiniciar
    (crontab -l 2>/dev/null; echo "@reboot /etc/config/scripts/router_monitor.sh &") | crontab -
    echo "Tarea programada configurada"
else
    echo "Tarea programada ya existe"
fi

# Crear script de inicio para rc.local si no existe
if ! grep -q "router_monitor.sh" /etc/rc.local 2>/dev/null; then
    # Agregar al final de rc.local, antes de 'exit 0'
    sed -i '/exit 0/i /etc/config/scripts/router_monitor.sh &' /etc/rc.local 2>/dev/null || {
        # Si no existe rc.local, crearlo
        cat > /etc/rc.local << 'EOF'
#!/bin/sh
# Put your custom commands here that should be executed once
# the system init finished. By default this file does nothing.

/etc/config/scripts/router_monitor.sh &

exit 0
EOF
        chmod +x /etc/rc.local
    }
    echo "Script agregado a rc.local"
fi

echo ""
echo "=== Instalación completada ==="
echo "El router ahora enviará datos cada 30 segundos al sistema de gestión"
echo ""
echo "Para probar manualmente, ejecuta:"
echo "  /etc/config/scripts/info.sh"
echo ""
echo "Para iniciar el monitoreo en segundo plano:"
echo "  /etc/config/scripts/router_monitor.sh &"
echo ""
echo "Los logs se pueden ver con:"
echo "  logread | grep wget"
echo ""

# Ejecutar una vez para probar
echo "Ejecutando prueba..."
/etc/config/scripts/info.sh

if [ $? -eq 0 ]; then
    echo "✓ Prueba exitosa - el router está enviando datos"
    
    # Iniciar el monitor en segundo plano
    echo "Iniciando el monitor en segundo plano..."
    /etc/config/scripts/router_monitor.sh &
    echo "✓ Monitor iniciado (PID: $!)"
else
    echo "✗ Error en la prueba - revisa la conectividad de red"
fi

echo ""
echo "=== Instalación finalizada ==="