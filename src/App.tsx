import { useState } from 'react';
import { Dashboard } from './components/Dashboard';
import { AccessPointsView } from './components/AccessPointsView';
import { NetworkTopology } from './components/NetworkTopology';
import { Tabs, TabsContent, TabsList, TabsTrigger } from './components/ui/tabs';
import { Card } from './components/ui/card';
import { Badge } from './components/ui/badge';
import { Button } from './components/ui/button';
import { Activity, Router, Network, BarChart3, RefreshCw } from 'lucide-react';
import { useRouterData } from './hooks/useRouterData';

export default function App() {
  const [activeTab, setActiveTab] = useState('dashboard');
  const { metrics, loading, error, usingFallback, refreshData } = useRouterData();

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b bg-card">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <div className="flex items-center space-x-2">
                <Router className="w-8 h-8 text-primary" />
                <h1 className="text-2xl font-bold">Sistema Gestor de Routers</h1>
              </div>
              {metrics && (
                <Badge variant="outline" className="ml-4">
                  <Activity className="w-3 h-3 mr-1" />
                  En línea: {metrics.onlineDevices}
                </Badge>
              )}
            </div>
            
            <div className="flex items-center space-x-4">
              <Button 
                variant="outline" 
                size="sm" 
                onClick={refreshData}
                disabled={loading}
              >
                <RefreshCw className={`w-4 h-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
                Actualizar
              </Button>
              {metrics && (
                <>
                  <div className="text-sm text-muted-foreground">
                    Última actualización: {new Date(metrics.lastUpdate).toLocaleTimeString()}
                  </div>
                  <Badge variant="secondary">
                    Total: {metrics.totalDevices} dispositivos
                  </Badge>
                </>
              )}
              {error && (
                <Badge variant={usingFallback ? "secondary" : "destructive"}>
                  {usingFallback ? "Modo offline" : `Error: ${error}`}
                </Badge>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-6">
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-4 lg:w-auto lg:grid-cols-4">
            <TabsTrigger value="dashboard" className="flex items-center space-x-2">
              <BarChart3 className="w-4 h-4" />
              <span>Dashboard</span>
            </TabsTrigger>
            <TabsTrigger value="access-points" className="flex items-center space-x-2">
              <Router className="w-4 h-4" />
              <span>Access Points</span>
            </TabsTrigger>
            <TabsTrigger value="topology" className="flex items-center space-x-2">
              <Network className="w-4 h-4" />
              <span>Topología</span>
            </TabsTrigger>
            <TabsTrigger value="monitoring" className="flex items-center space-x-2">
              <Activity className="w-4 h-4" />
              <span>Monitoreo</span>
            </TabsTrigger>
          </TabsList>

          <TabsContent value="dashboard" className="space-y-6">
            <Dashboard />
          </TabsContent>

          <TabsContent value="access-points" className="space-y-6">
            <AccessPointsView />
          </TabsContent>

          <TabsContent value="topology" className="space-y-6">
            <NetworkTopology />
          </TabsContent>

          <TabsContent value="monitoring" className="space-y-6">
            <Card className="p-6">
              <h3 className="text-lg font-semibold mb-4">Monitoreo en Tiempo Real</h3>
              <p className="text-muted-foreground">
                Vista de monitoreo avanzado con métricas en tiempo real y alertas.
              </p>
            </Card>
          </TabsContent>
        </Tabs>
      </div>
    </div>
  );
}