#!/bin/sh
#version=2025100301
# Script actualizado para enviar datos al Sistema Gestor de Routers
# Reemplaza el script info.sh original

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

# URL del servidor Supabase (reemplaza esto con tu URL real)
SERVER_URL="https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/router-update"

# Envío principal al nuevo sistema gestor
wget -q "$SERVER_URL" \
     --header="Content-Type: application/json" \
     --header="Authorization: Bearer eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Imtqa2xubGRxd21mcGFnamh2emx3Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTk1MDU2NzcsImV4cCI6MjA3NTA4MTY3N30.NLnE3meI45wFW66AQHMoeZ5MOD8gy0edo0zWtmm6PKA" \
     --post-data "$JSON_STRING" \
     -O /dev/null

# Backup: también envía al sistema original por compatibilidad (opcional)
# wget -q https://monitor.fi.uncoma.edu.ar/api/update.php --post-data "$JSON_STRING" -O /dev/null