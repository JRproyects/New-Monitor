# Guía de Integración - Sistema Gestor de Routers

## Resumen

Esta guía documenta la integración completa del script `info.sh` de los routers OpenWRT con el Sistema Gestor de Routers desarrollado en React + Supabase.

## Arquitectura

```
Router OpenWRT (info.sh) → Supabase Edge Function → KV Store → React Frontend
```

### Componentes

1. **Script `info.sh`**: Recopila datos del router y los envía vía HTTP POST
2. **Servidor Supabase**: Recibe y procesa los datos en tiempo real
3. **Base de datos KV**: Almacena información de routers y métricas
4. **Frontend React**: Visualiza datos en dashboard interactivo

## Datos Recopilados

El script actualizado recopila la siguiente información de cada router:

### Información básica
- **hostname**: Nombre del router
- **ip**: IP LAN del router
- **ip_wan**: IP WAN del router
- **model**: Modelo del hardware
- **version**: Versión de OpenWRT
- **uptime**: Tiempo de funcionamiento
- **token**: Token único de identificación

### Información de WiFi
- **ssid**: SSID de la red 2.4GHz
- **ssid_5**: SSID de la red 5GHz
- **ch_2**: Canal 2.4GHz
- **ch_5**: Canal 5GHz
- **clients_connected**: Total de clientes conectados
- **clients_connected_2**: Clientes en 2.4GHz
- **clients_connected_5**: Clientes en 5GHz

### Métricas del sistema (nuevas)
- **cpu_usage**: Uso de CPU en porcentaje
- **memory_usage**: Uso de memoria en porcentaje
- **load_avg**: Promedio de carga del sistema

## Instalación en Routers

### 1. Script de instalación automática

```bash
# Descargar y ejecutar el script de instalación
wget -O install.sh https://tu-servidor.com/install-router-integration.sh
chmod +x install.sh
./install.sh
```

### 2. Instalación manual

1. **Crear directorio de scripts:**
```bash
mkdir -p /etc/config/scripts
```

2. **Crear token único:**
```bash
HOSTNAME=$(cat /etc/config/system | grep hostname | cut -d "'" -f2)
MAC_ADDR=$(ifconfig eth0 | grep HWaddr | awk '{print $5}' | tr -d ':')
TOKEN="${HOSTNAME}-${MAC_ADDR}-$(date +%s)"
echo "$TOKEN" > /etc/config/scripts/token
```

3. **Instalar script actualizado:**
```bash
# Copiar el nuevo info.sh al router
cp info-updated.sh /etc/config/scripts/info.sh
chmod +x /etc/config/scripts/info.sh
```

4. **Configurar ejecución automática:**
```bash
# Agregar a crontab
(crontab -l 2>/dev/null; echo "@reboot /etc/config/scripts/router_monitor.sh &") | crontab -

# Agregar a rc.local
echo "/etc/config/scripts/router_monitor.sh &" >> /etc/rc.local
```

## Configuración del Servidor

### Endpoints API

El servidor Supabase expone los siguientes endpoints:

#### 1. Recibir actualizaciones de routers
```
POST /make-server-3cfb2aad/router-update
```

**Headers:**
```
Content-Type: application/json
Authorization: Bearer <public_anon_key>
```

**Payload:** JSON con datos del router (formato del script info.sh)

#### 2. Obtener estado de router específico
```
GET /make-server-3cfb2aad/router-status/:hostname
```

#### 3. Obtener todos los access points
```
GET /make-server-3cfb2aad/access-points
```

#### 4. Obtener métricas generales
```
GET /make-server-3cfb2aad/metrics
```

#### 5. Estado de todos los routers
```
GET /make-server-3cfb2aad/routers-status
```

### Procesamiento de Datos

1. **Recepción**: El endpoint `/router-update` recibe datos JSON
2. **Validación**: Verifica campos requeridos (hostname, ip)
3. **Mapeo**: Convierte formato del script a estructura interna
4. **Almacenamiento**: Guarda en KV store con clave `access_point:${router_id}`
5. **Métricas**: Actualiza estadísticas globales automáticamente

### Detección de Estado

- **Online**: Router envió datos en los últimos 5 minutos
- **Warning**: CPU > 80% o Memoria > 90%
- **Offline**: Sin datos por más de 5 minutos

## Frontend React

### Componentes Principales

1. **Dashboard**: Métricas generales y gráficos
2. **AccessPointsView**: Lista detallada de routers
3. **NetworkTopology**: Visualización de red
4. **useRouterData**: Hook para gestión de datos

### Actualización en Tiempo Real

- **Intervalo**: Actualización cada 30 segundos
- **Fallback**: Modo offline con datos locales si servidor no disponible
- **Estados**: Loading, error, online, offline

## Monitoreo y Debugging

### Script de monitoreo del servidor

```bash
# Hacer ejecutable
chmod +x router-status-monitor.sh

# Comandos disponibles
./router-status-monitor.sh all           # Todos los routers
./router-status-monitor.sh metrics       # Métricas del sistema
./router-status-monitor.sh status ROUTER # Estado específico
./router-status-monitor.sh test          # Test conectividad
./router-status-monitor.sh monitor       # Monitor tiempo real
```

### Logs del router

```bash
# Ver logs de envío
logread | grep wget

# Ejecutar manualmente
/etc/config/scripts/info.sh

# Ver procesos
ps | grep router_monitor
```

### Logs del servidor

Los logs se pueden ver en el dashboard de Supabase o mediante:

```bash
# Endpoint de salud
curl -s "https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/health"
```

## Troubleshooting

### Router no aparece en dashboard

1. **Verificar conectividad:**
```bash
ping 8.8.8.8
```

2. **Test manual del script:**
```bash
/etc/config/scripts/info.sh
```

3. **Verificar token:**
```bash
cat /etc/config/scripts/token
```

4. **Revisar logs:**
```bash
logread | tail -20
```

### Errores comunes

#### 1. "Missing required fields"
- Verificar que el script tenga hostname e ip válidos

#### 2. "401 Unauthorized"
- Verificar que el token de Supabase sea correcto

#### 3. "Connection timeout"
- Verificar conectividad a internet del router
- Verificar que no haya firewall bloqueando

#### 4. "Router not found"
- El router nunca envió datos o el hostname no coincide

### Estado del servicio

```bash
# Verificar estado del servidor
curl -s "https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/health"

# Verificar métricas
curl -H "Authorization: Bearer <token>" \
     "https://kjklnldqwmfpagjhvzlw.supabase.co/functions/v1/make-server-3cfb2aad/metrics"
```

## Seguridad

### Tokens y Autenticación

- **Router Token**: Token único por router para identificación
- **Supabase Token**: Public anon key para autenticación API
- **HTTPS**: Todas las comunicaciones encriptadas

### Recomendaciones

1. **Rotar tokens** periódicamente
2. **Monitorear logs** para detectar anomalías
3. **Validar datos** en servidor antes de almacenar
4. **Limitar rate** de requests por router

## Escalabilidad

### Optimizaciones

1. **Batch updates**: Agrupar múltiples actualizaciones
2. **Caching**: Cache de métricas frecuentes
3. **Compression**: Comprimir payloads JSON
4. **CDN**: Distribuir contenido estático

### Métricas de rendimiento

- **Latencia**: < 500ms por request
- **Throughput**: 100+ routers simultáneos
- **Disponibilidad**: 99.9% uptime target
- **Almacenamiento**: ~1KB por router por update

## Próximos Pasos

### Funcionalidades futuras

1. **Alertas**: Notificaciones en tiempo real
2. **Historiales**: Gráficos de tendencias
3. **Comandos remotos**: Ejecutar comandos en routers
4. **Backup automático**: Respaldo de configuraciones
5. **Geolocalización**: Mapas de ubicación
6. **API pública**: Integración con sistemas externos

### Mejoras técnicas

1. **WebSockets**: Updates en tiempo real
2. **GraphQL**: API más eficiente
3. **Microservicios**: Separar responsabilidades
4. **Monitoring**: Métricas de aplicación
5. **Testing**: Cobertura de tests automatizados