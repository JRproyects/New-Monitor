import { useState, useEffect } from 'react';
import { projectId, publicAnonKey } from '../utils/supabase/info';

interface AccessPoint {
  id: number;
  hostname: string;
  ipWan: string;
  ipLan: string;
  ssid: string;
  ssidCh24: string;
  ssidCh5: number | string;
  ch24: string;
  ch5: number | string;
  uptime: string;
  hardware: string;
  firmware: string;
  status: 'online' | 'warning' | 'offline';
  cpuUsage: number;
  memoryUsage: number;
  connectedDevices: number;
  lastUpdate: string;
}

interface NetworkMetrics {
  totalDevices: number;
  onlineDevices: number;
  offlineDevices: number;
  warningDevices: number;
  totalTraffic: string;
  lastUpdate: string;
}

// Fallback data for when server is not available
const fallbackAccessPoints: AccessPoint[] = [
  {
    id: 1,
    hostname: 'CUMBRES-P1',
    ipWan: '192.168.1.19',
    ipLan: '192.168.1.1',
    ssid: 'CUMBRES_Piso_1',
    ssidCh24: 'CUMBRES_Piso_1_5GHz',
    ssidCh5: 1,
    ch24: 'CUMBRES_Piso_1',
    ch5: 157,
    uptime: '8:46',
    hardware: 'TP-Link Archer C6V V1',
    firmware: 'OpenWrt 23.05.4',
    status: 'online',
    cpuUsage: 45,
    memoryUsage: 62,
    connectedDevices: 12,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 2,
    hostname: 'CUMBRES-P2',
    ipWan: '192.168.1.20',
    ipLan: '192.168.1.2',
    ssid: 'CUMBRES_Piso_2',
    ssidCh24: 'CUMBRES_Piso_2_2GHz',
    ssidCh5: 11,
    ch24: 'CUMBRES_Piso_2',
    ch5: 165,
    uptime: '8:46',
    hardware: 'TP-Link Archer C6V V1',
    firmware: 'OpenWrt 23.05.4',
    status: 'online',
    cpuUsage: 38,
    memoryUsage: 55,
    connectedDevices: 8,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 3,
    hostname: 'CUMBRES-PR',
    ipWan: '192.168.1.21',
    ipLan: '192.168.1.3',
    ssid: 'CUMBRES_PR',
    ssidCh24: 'CUMBRES_PR_2GHz',
    ssidCh5: 11,
    ch24: 'CUMBRES_PR',
    ch5: 36,
    uptime: '8:46',
    hardware: 'TP-Link Archer C6V V1',
    firmware: 'OpenWrt 23.05.4',
    status: 'online',
    cpuUsage: 52,
    memoryUsage: 71,
    connectedDevices: 15,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 4,
    hostname: 'PIRINOA-POTIER',
    ipWan: '192.168.56.1',
    ipLan: '192.168.56.1',
    ssid: 'WiFi-PIRINOA',
    ssidCh24: 'WiFi-PIRINOA-5GHz',
    ssidCh5: '',
    ch24: 'WiFi-PIRINOA-5GHz',
    ch5: '',
    uptime: '8:46',
    hardware: 'TP-Link Archer C7 V5',
    firmware: 'OpenWrt 23.05.4',
    status: 'warning',
    cpuUsage: 78,
    memoryUsage: 85,
    connectedDevices: 3,
    lastUpdate: new Date().toISOString()
  },
  {
    id: 5,
    hostname: 'SEBRA-BASE-CLIENTE',
    ipWan: '192.168.0.32',
    ipLan: '192.168.0.1',
    ssid: 'CLIENTE',
    ssidCh24: 'CLIENTE-5GHz',
    ssidCh5: 11,
    ch24: 'SEBRA-BASE-CLIENTE',
    ch5: 36,
    uptime: '8:46',
    hardware: 'TP-Link Archer C6V V1',
    firmware: 'OpenWrt 23.05.4',
    status: 'offline',
    cpuUsage: 0,
    memoryUsage: 0,
    connectedDevices: 0,
    lastUpdate: new Date().toISOString()
  }
];

const fallbackMetrics: NetworkMetrics = {
  totalDevices: 212,
  onlineDevices: 45,
  offlineDevices: 2,
  warningDevices: 3,
  totalTraffic: '1.2 GB/s',
  lastUpdate: new Date().toISOString()
};

export function useRouterData() {
  const [accessPoints, setAccessPoints] = useState<AccessPoint[]>([]);
  const [metrics, setMetrics] = useState<NetworkMetrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [usingFallback, setUsingFallback] = useState(false);

  const baseUrl = `https://${projectId}.supabase.co/functions/v1/make-server-3cfb2aad`;

  const fetchAccessPoints = async () => {
    try {
      const response = await fetch(`${baseUrl}/access-points`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setAccessPoints(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch access points');
      }
    } catch (err) {
      console.error('Error fetching access points:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const fetchMetrics = async () => {
    try {
      const response = await fetch(`${baseUrl}/metrics`, {
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        setMetrics(result.data);
      } else {
        throw new Error(result.error || 'Failed to fetch metrics');
      }
    } catch (err) {
      console.error('Error fetching metrics:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const initializeData = async () => {
    try {
      const response = await fetch(`${baseUrl}/initialize`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        console.log('Sample data initialized successfully');
        await Promise.all([fetchAccessPoints(), fetchMetrics()]);
      } else {
        throw new Error(result.error || 'Failed to initialize data');
      }
    } catch (err) {
      console.error('Error initializing data:', err);
      setError(err instanceof Error ? err.message : 'An error occurred');
    }
  };

  const updateAccessPoint = async (id: number, data: Partial<AccessPoint>) => {
    try {
      const response = await fetch(`${baseUrl}/access-points/${id}`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${publicAnonKey}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(data),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const result = await response.json();
      if (result.success) {
        // Update the local state
        setAccessPoints(prev => 
          prev.map(ap => ap.id === id ? { ...ap, ...result.data } : ap)
        );
        return result.data;
      } else {
        throw new Error(result.error || 'Failed to update access point');
      }
    } catch (err) {
      console.error('Error updating access point:', err);
      throw err;
    }
  };

  const refreshData = async () => {
    if (usingFallback) {
      console.log('In fallback mode, skipping server refresh');
      return;
    }
    
    setLoading(true);
    setError(null);
    try {
      await Promise.all([fetchAccessPoints(), fetchMetrics()]);
    } catch (err) {
      console.log('Error refreshing data:', err);
      setError(err instanceof Error ? err.message : 'Failed to refresh data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      setError(null);
      setUsingFallback(false);
      
      try {
        // First try to fetch existing data
        await Promise.all([fetchAccessPoints(), fetchMetrics()]);
        console.log('Successfully loaded data from server');
      } catch (err) {
        console.log('Error fetching existing data:', err);
        
        // Try to initialize with sample data
        try {
          console.log('Attempting to initialize with sample data...');
          await initializeData();
          console.log('Successfully initialized data on server');
        } catch (initErr) {
          console.log('Failed to initialize sample data, using fallback:', initErr);
          
          // Use fallback data if server is completely unavailable
          setAccessPoints(fallbackAccessPoints);
          setMetrics(fallbackMetrics);
          setUsingFallback(true);
          setError('Using offline mode - server unavailable');
        }
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, []);

  // Check if we need to initialize data after first load
  useEffect(() => {
    const checkAndInitialize = async () => {
      if (!loading && accessPoints.length === 0 && !error) {
        console.log('No access points found after initial load, initializing...');
        try {
          await initializeData();
        } catch (err) {
          console.log('Failed to initialize after check:', err);
        }
      }
    };

    checkAndInitialize();
  }, [loading, accessPoints.length, error]);

  // Auto-refresh data every 30 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      if (!loading) {
        refreshData();
      }
    }, 30000);

    return () => clearInterval(interval);
  }, [loading]);

  return {
    accessPoints,
    metrics,
    loading,
    error,
    usingFallback,
    refreshData,
    updateAccessPoint,
    initializeData
  };
}