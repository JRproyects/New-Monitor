import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Badge } from './ui/badge';
import { Button } from './ui/button';
import { 
  Router, 
  Wifi, 
  Smartphone, 
  Laptop, 
  Monitor,
  Globe,
  Activity,
  RefreshCw
} from 'lucide-react';
import { useRouterData } from '../hooks/useRouterData';

export function NetworkTopology() {
  const { accessPoints, loading, refreshData } = useRouterData();
  const networkNodes = [
    {
      id: 'internet',
      type: 'internet',
      label: 'Internet',
      x: 400,
      y: 50,
      status: 'online'
    },
    {
      id: 'main-router',
      type: 'router',
      label: 'Router Principal',
      x: 400,
      y: 150,
      status: 'online',
      ip: '192.168.1.1'
    },
    ...accessPoints.map((ap, index) => ({
      id: ap.hostname.toLowerCase(),
      type: 'access-point',
      label: ap.hostname,
      x: 150 + (index % 4) * 150,
      y: 280 + Math.floor(index / 4) * 100,
      status: ap.status,
      ip: ap.ipWan,
      connectedDevices: ap.connectedDevices
    }))
  ];

  const connections = [
    { from: 'internet', to: 'main-router' },
    { from: 'main-router', to: 'cumbres-p1' },
    { from: 'main-router', to: 'cumbres-p2' },
    { from: 'main-router', to: 'cumbres-pr' },
    { from: 'cumbres-p1', to: 'pirinoa' },
    { from: 'cumbres-pr', to: 'sebra' }
  ];

  const getNodeIcon = (type: string, status: string) => {
    const iconProps = { 
      className: `w-6 h-6 ${
        status === 'online' ? 'text-green-500' : 
        status === 'warning' ? 'text-yellow-500' : 
        'text-red-500'
      }` 
    };

    switch (type) {
      case 'internet':
        return <Globe {...iconProps} />;
      case 'router':
        return <Router {...iconProps} />;
      case 'access-point':
        return <Wifi {...iconProps} />;
      default:
        return <Router {...iconProps} />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'stroke-green-500';
      case 'warning':
        return 'stroke-yellow-500';
      case 'offline':
        return 'stroke-red-500';
      default:
        return 'stroke-gray-400';
    }
  };

  return (
    <div className="space-y-6">
      {/* Control de la topología */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle>Topología de Red</CardTitle>
              <CardDescription>
                Vista visual de la infraestructura de red
              </CardDescription>
            </div>
            <div className="flex items-center space-x-2">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              <Badge variant="secondary">
                <Activity className="w-3 h-3 mr-1" />
                Tiempo real
              </Badge>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Mapa de topología */}
      <Card>
        <CardContent className="p-6">
          <div className="relative w-full h-[500px] bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-blue-950 dark:to-indigo-900 rounded-lg overflow-hidden">
            {/* SVG para las conexiones */}
            <svg className="absolute inset-0 w-full h-full" style={{ zIndex: 1 }}>
              {connections.map((connection, index) => {
                const fromNode = networkNodes.find(n => n.id === connection.from);
                const toNode = networkNodes.find(n => n.id === connection.to);
                
                if (!fromNode || !toNode) return null;

                return (
                  <line
                    key={index}
                    x1={fromNode.x}
                    y1={fromNode.y}
                    x2={toNode.x}
                    y2={toNode.y}
                    className={`${getStatusColor(toNode.status)} stroke-2`}
                    strokeDasharray={toNode.status === 'offline' ? '5,5' : 'none'}
                  />
                );
              })}
            </svg>

            {/* Nodos de la red */}
            {networkNodes.map((node) => (
              <div
                key={node.id}
                className="absolute transform -translate-x-1/2 -translate-y-1/2"
                style={{ 
                  left: node.x, 
                  top: node.y,
                  zIndex: 2 
                }}
              >
                <div className={`
                  flex flex-col items-center space-y-2 p-3 bg-card border rounded-lg shadow-lg
                  ${node.status === 'online' ? 'border-green-200' : 
                    node.status === 'warning' ? 'border-yellow-200' : 
                    'border-red-200'}
                `}>
                  <div className="flex items-center space-x-2">
                    {getNodeIcon(node.type, node.status)}
                    <div className="text-sm font-medium">{node.label}</div>
                  </div>
                  
                  {node.ip && (
                    <div className="text-xs text-muted-foreground">{node.ip}</div>
                  )}
                  
                  {node.connectedDevices !== undefined && (
                    <Badge variant="outline" className="text-xs">
                      {node.connectedDevices} dispositivos
                    </Badge>
                  )}
                </div>
              </div>
            ))}

            {/* Leyenda */}
            <div className="absolute bottom-4 left-4 bg-card border rounded-lg p-3 shadow-lg">
              <h4 className="font-medium text-sm mb-2">Estado</h4>
              <div className="space-y-1">
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  <span>En línea</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-yellow-500 rounded-full"></div>
                  <span>Advertencia</span>
                </div>
                <div className="flex items-center space-x-2 text-xs">
                  <div className="w-3 h-3 bg-red-500 rounded-full"></div>
                  <span>Fuera de línea</span>
                </div>
              </div>
            </div>

            {/* Estadísticas rápidas */}
            <div className="absolute bottom-4 right-4 bg-card border rounded-lg p-3 shadow-lg">
              <h4 className="font-medium text-sm mb-2">Resumen</h4>
              <div className="space-y-1 text-xs">
                <div>Total de nodos: {networkNodes.length}</div>
                <div className="text-green-600">
                  En línea: {networkNodes.filter(n => n.status === 'online').length}
                </div>
                <div className="text-yellow-600">
                  Advertencias: {networkNodes.filter(n => n.status === 'warning').length}
                </div>
                <div className="text-red-600">
                  Fuera de línea: {networkNodes.filter(n => n.status === 'offline').length}
                </div>
              </div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Dispositivos conectados */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <Smartphone className="w-4 h-4" />
              <span>Dispositivos Móviles</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">24</div>
            <p className="text-xs text-muted-foreground">Smartphones y tablets</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <Laptop className="w-4 h-4" />
              <span>Computadoras</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">12</div>
            <p className="text-xs text-muted-foreground">Laptops y desktops</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-base flex items-center space-x-2">
              <Monitor className="w-4 h-4" />
              <span>Otros Dispositivos</span>
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">8</div>
            <p className="text-xs text-muted-foreground">IoT y smart devices</p>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}