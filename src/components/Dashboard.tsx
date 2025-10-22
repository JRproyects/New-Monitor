import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Progress } from './ui/progress';
import { 
  BarChart, 
  Bar, 
  XAxis, 
  YAxis, 
  CartesianGrid, 
  Tooltip, 
  ResponsiveContainer,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell
} from 'recharts';
import { 
  Activity, 
  Router, 
  Wifi, 
  AlertTriangle, 
  CheckCircle, 
  XCircle,
  TrendingUp,
  Users,
  Database,
  Zap
} from 'lucide-react';
import { useRouterData } from '../hooks/useRouterData';

export function Dashboard() {
  const { accessPoints, metrics, loading } = useRouterData();
  // Mock data para gráficos
  const networkTrafficData = [
    { time: '00:00', upload: 45, download: 80 },
    { time: '04:00', upload: 52, download: 75 },
    { time: '08:00', upload: 78, download: 120 },
    { time: '12:00', upload: 65, download: 95 },
    { time: '16:00', upload: 88, download: 140 },
    { time: '20:00', upload: 72, download: 110 },
  ];

  const deviceStatusData = metrics ? [
    { name: 'Online', value: metrics.onlineDevices, color: '#22c55e' },
    { name: 'Offline', value: metrics.offlineDevices, color: '#ef4444' },
    { name: 'Warning', value: metrics.warningDevices, color: '#f59e0b' },
  ] : [];

  const cpuUsageData = accessPoints
    .filter(ap => ap.status === 'online')
    .slice(0, 5)
    .map(ap => ({
      device: ap.hostname,
      usage: ap.cpuUsage,
    }));

  return (
    <div className="space-y-6">
      {/* Métricas principales */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Dispositivos Totales</CardTitle>
            <Router className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              +2 desde la última semana
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">En Línea</CardTitle>
            <CheckCircle className="h-4 w-4 text-green-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-green-600">{metrics?.onlineDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              {metrics ? ((metrics.onlineDevices / metrics.totalDevices) * 100).toFixed(1) : 0}% de disponibilidad
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Con Problemas</CardTitle>
            <AlertTriangle className="h-4 w-4 text-yellow-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{metrics?.warningDevices || 0}</div>
            <p className="text-xs text-muted-foreground">
              Requieren atención
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Tráfico Total</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{metrics?.totalTraffic || '0 GB/s'}</div>
            <p className="text-xs text-muted-foreground">
              +12% vs. mes anterior
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Gráficos principales */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Tráfico de red */}
        <Card>
          <CardHeader>
            <CardTitle>Tráfico de Red (24h)</CardTitle>
            <CardDescription>
              Upload y Download en Mbps
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={networkTrafficData}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="time" />
                <YAxis />
                <Tooltip />
                <Line 
                  type="monotone" 
                  dataKey="upload" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Upload (Mbps)"
                />
                <Line 
                  type="monotone" 
                  dataKey="download" 
                  stroke="#10b981" 
                  strokeWidth={2}
                  name="Download (Mbps)"
                />
              </LineChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        {/* Estado de dispositivos */}
        <Card>
          <CardHeader>
            <CardTitle>Estado de Dispositivos</CardTitle>
            <CardDescription>
              Distribución del estado actual
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={300}>
              <PieChart>
                <Pie
                  data={deviceStatusData}
                  cx="50%"
                  cy="50%"
                  outerRadius={80}
                  fill="#8884d8"
                  dataKey="value"
                  label={({ name, value }) => `${name}: ${value}`}
                >
                  {deviceStatusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      {/* Uso de CPU por dispositivo */}
      <Card>
        <CardHeader>
          <CardTitle>Uso de CPU por Dispositivo</CardTitle>
          <CardDescription>
            Porcentaje de uso de CPU en los principales routers
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={cpuUsageData}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="device" />
              <YAxis />
              <Tooltip />
              <Bar dataKey="usage" fill="#8b5cf6" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Métricas adicionales */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <Users className="w-4 h-4" />
              <span>Usuarios Conectados</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">
              {accessPoints.reduce((sum, ap) => sum + ap.connectedDevices, 0)}
            </div>
            <Progress value={67} className="h-2" />
            <p className="text-xs text-muted-foreground">67% de capacidad</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <Database className="w-4 h-4" />
              <span>Almacenamiento</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">78%</div>
            <Progress value={78} className="h-2" />
            <p className="text-xs text-muted-foreground">156 GB de 200 GB</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <Zap className="w-4 h-4" />
              <span>Consumo Energético</span>
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            <div className="text-2xl font-bold">2.4 kW</div>
            <Progress value={45} className="h-2" />
            <p className="text-xs text-muted-foreground">Normal para esta hora</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}