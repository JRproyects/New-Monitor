import { useState } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from './ui/card';
import { Button } from './ui/button';
import { Input } from './ui/input';
import { Badge } from './ui/badge';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from './ui/table';
import { Progress } from './ui/progress';
import { 
  Search, 
  Filter, 
  MoreHorizontal, 
  Power, 
  Settings, 
  Eye,
  Wifi,
  Activity,
  Clock,
  HardDrive,
  AlertTriangle,
  CheckCircle,
  XCircle
} from 'lucide-react';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from './ui/dropdown-menu';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from './ui/select';
import { useRouterData } from '../hooks/useRouterData';

export function AccessPointsView() {
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const { accessPoints, loading, updateAccessPoint } = useRouterData();

  const handleRestartRouter = async (id: number) => {
    try {
      // Simulate restart by updating status temporarily
      await updateAccessPoint(id, { status: 'warning' });
      setTimeout(async () => {
        await updateAccessPoint(id, { status: 'online' });
      }, 3000);
    } catch (error) {
      console.error('Error restarting router:', error);
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'online':
        return <CheckCircle className="w-4 h-4 text-green-500" />;
      case 'warning':
        return <AlertTriangle className="w-4 h-4 text-yellow-500" />;
      case 'offline':
        return <XCircle className="w-4 h-4 text-red-500" />;
      default:
        return <XCircle className="w-4 h-4 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'online':
        return <Badge variant="default" className="bg-green-500">En línea</Badge>;
      case 'warning':
        return <Badge variant="secondary" className="bg-yellow-500">Advertencia</Badge>;
      case 'offline':
        return <Badge variant="destructive">Fuera de línea</Badge>;
      default:
        return <Badge variant="outline">Desconocido</Badge>;
    }
  };

  const filteredAccessPoints = accessPoints.filter(ap => {
    const matchesSearch = ap.hostname.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         ap.ipWan.includes(searchTerm) ||
                         ap.ssid.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesStatus = statusFilter === 'all' || ap.status === statusFilter;
    return matchesSearch && matchesStatus;
  });

  if (loading) {
    return (
      <div className="space-y-6">
        <Card>
          <CardContent className="p-6">
            <div className="flex items-center justify-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary"></div>
              <span className="ml-2">Cargando access points...</span>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Controles de filtrado */}
      <Card>
        <CardHeader>
          <CardTitle>Access Points</CardTitle>
          <CardDescription>
            Gestión y monitoreo de todos los puntos de acceso
          </CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex flex-col sm:flex-row gap-4 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Buscar por hostname, IP o SSID..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Filtrar por estado" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Todos los estados</SelectItem>
                <SelectItem value="online">En línea</SelectItem>
                <SelectItem value="warning">Con advertencias</SelectItem>
                <SelectItem value="offline">Fuera de línea</SelectItem>
              </SelectContent>
            </Select>
            <Button variant="outline">
              <Filter className="w-4 h-4 mr-2" />
              Más filtros
            </Button>
          </div>

          {/* Estadísticas rápidas */}
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-4 mb-6">
            <div className="text-center">
              <div className="text-2xl font-bold text-green-600">
                {accessPoints.filter(ap => ap.status === 'online').length}
              </div>
              <div className="text-sm text-muted-foreground">En línea</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-yellow-600">
                {accessPoints.filter(ap => ap.status === 'warning').length}
              </div>
              <div className="text-sm text-muted-foreground">Con advertencias</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-600">
                {accessPoints.filter(ap => ap.status === 'offline').length}
              </div>
              <div className="text-sm text-muted-foreground">Fuera de línea</div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold">
                {accessPoints.reduce((sum, ap) => sum + ap.connectedDevices, 0)}
              </div>
              <div className="text-sm text-muted-foreground">Dispositivos conectados</div>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Tabla de Access Points */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Estado</TableHead>
                  <TableHead>Hostname</TableHead>
                  <TableHead>IP WAN</TableHead>
                  <TableHead>IP LAN</TableHead>
                  <TableHead>SSID Principal</TableHead>
                  <TableHead>Canales</TableHead>
                  <TableHead>Recursos</TableHead>
                  <TableHead>Dispositivos</TableHead>
                  <TableHead>Uptime</TableHead>
                  <TableHead>Hardware</TableHead>
                  <TableHead>Acciones</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {filteredAccessPoints.map((ap) => (
                  <TableRow key={ap.id}>
                    <TableCell>
                      <div className="flex items-center space-x-2">
                        {getStatusIcon(ap.status)}
                        {getStatusBadge(ap.status)}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="font-medium">{ap.hostname}</div>
                      <div className="text-sm text-muted-foreground">
                        {ap.firmware}
                      </div>
                    </TableCell>
                    <TableCell>{ap.ipWan}</TableCell>
                    <TableCell>{ap.ipLan}</TableCell>
                    <TableCell>
                      <div className="space-y-1">
                        <div className="flex items-center space-x-1">
                          <Wifi className="w-3 h-3" />
                          <span className="text-sm">{ap.ssid}</span>
                        </div>
                        {ap.ssidCh24 && (
                          <div className="text-xs text-muted-foreground">
                            5GHz: {ap.ssidCh24}
                          </div>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div>2.4GHz: Ch {ap.ssidCh5}</div>
                        {ap.ch5 && <div>5GHz: Ch {ap.ch5}</div>}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="space-y-2 min-w-[120px]">
                        <div>
                          <div className="flex justify-between text-xs">
                            <span>CPU</span>
                            <span>{ap.cpuUsage}%</span>
                          </div>
                          <Progress value={ap.cpuUsage} className="h-1" />
                        </div>
                        <div>
                          <div className="flex justify-between text-xs">
                            <span>RAM</span>
                            <span>{ap.memoryUsage}%</span>
                          </div>
                          <Progress value={ap.memoryUsage} className="h-1" />
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-center">
                        <div className="font-medium">{ap.connectedDevices}</div>
                        <div className="text-xs text-muted-foreground">conectados</div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="flex items-center space-x-1">
                        <Clock className="w-3 h-3" />
                        <span className="text-sm">{ap.uptime}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="text-sm">
                        <div className="font-medium">{ap.hardware}</div>
                        <div className="text-xs text-muted-foreground">
                          {ap.firmware}
                        </div>
                      </div>
                    </TableCell>
                    <TableCell>
                      <DropdownMenu>
                        <DropdownMenuTrigger asChild>
                          <Button variant="ghost" className="h-8 w-8 p-0">
                            <MoreHorizontal className="h-4 w-4" />
                          </Button>
                        </DropdownMenuTrigger>
                        <DropdownMenuContent align="end">
                          <DropdownMenuLabel>Acciones</DropdownMenuLabel>
                          <DropdownMenuItem>
                            <Eye className="mr-2 h-4 w-4" />
                            Ver detalles
                          </DropdownMenuItem>
                          <DropdownMenuItem>
                            <Settings className="mr-2 h-4 w-4" />
                            Configurar
                          </DropdownMenuItem>
                          <DropdownMenuSeparator />
                          <DropdownMenuItem onClick={() => handleRestartRouter(ap.id)}>
                            <Power className="mr-2 h-4 w-4" />
                            Reiniciar
                          </DropdownMenuItem>
                        </DropdownMenuContent>
                      </DropdownMenu>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </CardContent>
      </Card>

      {/* Información adicional */}
      <div className="text-sm text-muted-foreground text-center">
        Mostrando {filteredAccessPoints.length} de {accessPoints.length} access points
      </div>
    </div>
  );
}