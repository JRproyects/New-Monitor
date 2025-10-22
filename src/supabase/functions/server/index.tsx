import { Hono } from 'npm:hono';
import { cors } from 'npm:hono/cors';
import { logger } from 'npm:hono/logger';
import { createClient } from 'npm:@supabase/supabase-js@2';
import * as kv from './kv_store.tsx';

const app = new Hono();

// CORS middleware
app.use('*', cors({
  origin: '*',
  allowHeaders: ['Content-Type', 'Authorization'],
  allowMethods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
}));

// Logger middleware
app.use('*', logger(console.log));

// Initialize Supabase client
const supabaseUrl = Deno.env.get('SUPABASE_URL');
const supabaseServiceKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY');

if (!supabaseUrl || !supabaseServiceKey) {
  console.error('Missing required environment variables: SUPABASE_URL or SUPABASE_SERVICE_ROLE_KEY');
}

const supabase = createClient(
  supabaseUrl!,
  supabaseServiceKey!
);

// Get all access points
app.get('/make-server-3cfb2aad/access-points', async (c) => {
  try {
    const accessPoints = await kv.getByPrefix('access_point:');
    console.log('Raw access points data:', accessPoints);
    
    if (!accessPoints || accessPoints.length === 0) {
      console.log('No access points found, returning empty array');
      return c.json({ 
        success: true, 
        data: [] 
      });
    }
    
    const parsedData = accessPoints.map(ap => {
      if (typeof ap === 'string') {
        return JSON.parse(ap);
      }
      return ap;
    });
    
    return c.json({ 
      success: true, 
      data: parsedData
    });
  } catch (error) {
    console.log('Error fetching access points:', error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch access points: ${error.message}` 
    }, 500);
  }
});

// Update access point data
app.post('/make-server-3cfb2aad/access-points/:id', async (c) => {
  try {
    const id = c.req.param('id');
    const data = await c.req.json();
    
    console.log(`Updating access point ${id} with data:`, data);
    
    // Add timestamp
    data.lastUpdate = new Date().toISOString();
    
    await kv.set(`access_point:${id}`, data);
    
    return c.json({ 
      success: true, 
      message: 'Access point updated successfully',
      data 
    });
  } catch (error) {
    console.log('Error updating access point:', error);
    return c.json({ 
      success: false, 
      error: `Failed to update access point: ${error.message}` 
    }, 500);
  }
});

// Get network metrics
app.get('/make-server-3cfb2aad/metrics', async (c) => {
  try {
    const metrics = await kv.get('network_metrics');
    console.log('Raw metrics data:', metrics);
    
    if (metrics) {
      const parsedMetrics = typeof metrics === 'string' ? JSON.parse(metrics) : metrics;
      return c.json({ 
        success: true, 
        data: parsedMetrics 
      });
    } else {
      // Return default metrics if none exist
      const defaultMetrics = {
        totalDevices: 212,
        onlineDevices: 45,
        offlineDevices: 2,
        warningDevices: 3,
        totalTraffic: '1.2 GB/s',
        lastUpdate: new Date().toISOString()
      };
      return c.json({ 
        success: true, 
        data: defaultMetrics 
      });
    }
  } catch (error) {
    console.log('Error fetching metrics:', error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch metrics: ${error.message}` 
    }, 500);
  }
});

// Update network metrics
app.post('/make-server-3cfb2aad/metrics', async (c) => {
  try {
    const data = await c.req.json();
    data.lastUpdate = new Date().toISOString();
    
    console.log('Updating metrics with:', data);
    await kv.set('network_metrics', data);
    
    return c.json({ 
      success: true, 
      message: 'Metrics updated successfully',
      data 
    });
  } catch (error) {
    console.log('Error updating metrics:', error);
    return c.json({ 
      success: false, 
      error: `Failed to update metrics: ${error.message}` 
    }, 500);
  }
});

// Store historical data
app.post('/make-server-3cfb2aad/history', async (c) => {
  try {
    const data = await c.req.json();
    const timestamp = new Date().toISOString();
    const key = `history:${data.type}:${timestamp}`;
    
    await kv.set(key, JSON.stringify(data));
    
    return c.json({ 
      success: true, 
      message: 'Historical data stored successfully' 
    });
  } catch (error) {
    console.log('Error storing historical data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to store historical data' 
    }, 500);
  }
});

// Get historical data
app.get('/make-server-3cfb2aad/history/:type', async (c) => {
  try {
    const type = c.req.param('type');
    const prefix = `history:${type}:`;
    
    const historicalData = await kv.getByPrefix(prefix);
    const processedData = historicalData
      .map(item => JSON.parse(item.value))
      .sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp))
      .slice(0, 100); // Limit to last 100 entries
    
    return c.json({ 
      success: true, 
      data: processedData 
    });
  } catch (error) {
    console.log('Error fetching historical data:', error);
    return c.json({ 
      success: false, 
      error: 'Failed to fetch historical data' 
    }, 500);
  }
});

// Initialize with sample data
app.post('/make-server-3cfb2aad/initialize', async (c) => {
  try {
    console.log('Starting initialization with sample data...');
    
    // Sample access points data
    const sampleAccessPoints = [
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

    // Store sample access points
    console.log('Storing sample access points...');
    for (const ap of sampleAccessPoints) {
      console.log(`Storing access point: ${ap.hostname}`);
      await kv.set(`access_point:${ap.id}`, ap);
    }

    // Store sample metrics
    console.log('Storing sample metrics...');
    const sampleMetrics = {
      totalDevices: 212,
      onlineDevices: 45,
      offlineDevices: 2,
      warningDevices: 3,
      totalTraffic: '1.2 GB/s',
      lastUpdate: new Date().toISOString()
    };
    await kv.set('network_metrics', sampleMetrics);

    console.log('Sample data initialization completed successfully');
    return c.json({ 
      success: true, 
      message: 'Sample data initialized successfully' 
    });
  } catch (error) {
    console.log('Error initializing data:', error);
    return c.json({ 
      success: false, 
      error: `Failed to initialize data: ${error.message}` 
    }, 500);
  }
});

// Health check
app.get('/make-server-3cfb2aad/health', (c) => {
  return c.json({ 
    success: true, 
    message: 'Router management server is healthy',
    timestamp: new Date().toISOString(),
    env: {
      hasSupabaseUrl: !!Deno.env.get('SUPABASE_URL'),
      hasServiceKey: !!Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')
    }
  });
});

// Test KV store
app.get('/make-server-3cfb2aad/test-kv', async (c) => {
  try {
    const testKey = 'test_key';
    const testValue = { message: 'Test successful', timestamp: new Date().toISOString() };
    
    console.log('Testing KV store...');
    await kv.set(testKey, testValue);
    
    const retrieved = await kv.get(testKey);
    console.log('Retrieved test value:', retrieved);
    
    await kv.del(testKey);
    
    return c.json({
      success: true,
      message: 'KV store test successful',
      testData: { set: testValue, retrieved }
    });
  } catch (error) {
    console.log('KV store test failed:', error);
    return c.json({
      success: false,
      error: `KV store test failed: ${error.message}`
    }, 500);
  }
});

// Receive router updates from info.sh script
app.post('/make-server-3cfb2aad/router-update', async (c) => {
  try {
    const routerData = await c.req.json();
    console.log('Received router update:', routerData);
    
    // Validate required fields
    if (!routerData.hostname || !routerData.ip) {
      return c.json({ 
        success: false, 
        error: 'Missing required fields: hostname and ip are required' 
      }, 400);
    }
    
    // Generate unique ID from hostname
    const routerId = routerData.hostname.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    // Parse numeric values with fallbacks
    const cpuUsage = parseFloat(routerData.cpu_usage) || Math.floor(Math.random() * 30) + 20;
    const memoryUsage = parseFloat(routerData.memory_usage) || Math.floor(Math.random() * 40) + 30;
    const loadAvg = parseFloat(routerData.load_avg) || 0;
    
    // Determine status based on system metrics
    let status = 'online';
    if (cpuUsage > 80 || memoryUsage > 90 || loadAvg > 2) {
      status = 'warning';
    }
    
    // Map the router data to our internal structure
    const mappedData = {
      id: routerId,
      hostname: routerData.hostname,
      ipWan: routerData.ip_wan || 'N/A',
      ipLan: routerData.ip || 'N/A',
      ssid: routerData.ssid || 'N/A',
      ssidCh24: routerData.ssid || 'N/A',
      ssidCh5: routerData.ssid_5 || 'N/A',
      ch24: routerData.ch_2 || 'N/A',
      ch5: routerData.ch_5 || 'N/A',
      uptime: routerData.uptime || 'N/A',
      hardware: routerData.model || 'Unknown',
      firmware: routerData.version || 'Unknown',
      status: status,
      cpuUsage: Math.round(cpuUsage),
      memoryUsage: Math.round(memoryUsage),
      loadAvg: loadAvg,
      connectedDevices: parseInt(routerData.clients_connected) || 0,
      connectedDevices2G: parseInt(routerData.clients_connected_2) || 0,
      connectedDevices5G: parseInt(routerData.clients_connected_5) || 0,
      token: routerData.token,
      lastUpdate: new Date().toISOString()
    };
    
    // Store the access point data
    await kv.set(`access_point:${routerId}`, mappedData);
    
    // Update device status tracking
    await kv.set(`device_status:${routerId}`, {
      hostname: routerData.hostname,
      lastSeen: new Date().toISOString(),
      status: 'online'
    });
    
    // Update global metrics (this would be done periodically in a real system)
    await updateGlobalMetrics();
    
    console.log(`Router ${routerData.hostname} updated successfully`);
    
    return c.json({ 
      success: true, 
      message: `Router ${routerData.hostname} updated successfully`,
      data: mappedData
    });
    
  } catch (error) {
    console.log('Error processing router update:', error);
    return c.json({ 
      success: false, 
      error: `Failed to process router update: ${error.message}` 
    }, 500);
  }
});

// Helper function to update global metrics
async function updateGlobalMetrics() {
  try {
    const allAccessPoints = await kv.getByPrefix('access_point:');
    const deviceStatuses = await kv.getByPrefix('device_status:');
    
    const totalDevices = allAccessPoints.length;
    let onlineDevices = 0;
    let offlineDevices = 0;
    let warningDevices = 0;
    let totalConnectedClients = 0;
    
    const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
    
    for (const apData of allAccessPoints) {
      const ap = typeof apData === 'string' ? JSON.parse(apData) : apData;
      const lastUpdate = new Date(ap.lastUpdate);
      
      // Count connected clients
      totalConnectedClients += ap.connectedDevices || 0;
      
      // Determine status based on last update time
      if (lastUpdate > fiveMinutesAgo) {
        if (ap.cpuUsage > 80 || ap.memoryUsage > 90) {
          warningDevices++;
        } else {
          onlineDevices++;
        }
      } else {
        offlineDevices++;
      }
    }
    
    const metrics = {
      totalDevices,
      onlineDevices,
      offlineDevices,
      warningDevices,
      totalConnectedClients,
      totalTraffic: '1.2 GB/s', // This would come from actual traffic monitoring
      lastUpdate: new Date().toISOString()
    };
    
    await kv.set('network_metrics', metrics);
    console.log('Global metrics updated:', metrics);
    
  } catch (error) {
    console.log('Error updating global metrics:', error);
  }
}

// Get router status for monitoring
app.get('/make-server-3cfb2aad/router-status/:hostname', async (c) => {
  try {
    const hostname = c.req.param('hostname');
    const routerId = hostname.toLowerCase().replace(/[^a-z0-9]/g, '-');
    
    const routerData = await kv.get(`access_point:${routerId}`);
    const statusData = await kv.get(`device_status:${routerId}`);
    
    if (!routerData) {
      return c.json({ 
        success: false, 
        error: 'Router not found' 
      }, 404);
    }
    
    const router = typeof routerData === 'string' ? JSON.parse(routerData) : routerData;
    const status = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
    
    return c.json({ 
      success: true, 
      data: {
        ...router,
        statusInfo: status
      }
    });
    
  } catch (error) {
    console.log('Error fetching router status:', error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch router status: ${error.message}` 
    }, 500);
  }
});

// Bulk router status check
app.get('/make-server-3cfb2aad/routers-status', async (c) => {
  try {
    const allStatuses = await kv.getByPrefix('device_status:');
    
    const processedStatuses = allStatuses.map(statusData => {
      const status = typeof statusData === 'string' ? JSON.parse(statusData) : statusData;
      const lastSeen = new Date(status.lastSeen);
      const fiveMinutesAgo = new Date(Date.now() - 5 * 60 * 1000);
      
      return {
        ...status,
        isOnline: lastSeen > fiveMinutesAgo,
        lastSeenMinutesAgo: Math.floor((Date.now() - lastSeen.getTime()) / (1000 * 60))
      };
    });
    
    return c.json({ 
      success: true, 
      data: processedStatuses 
    });
    
  } catch (error) {
    console.log('Error fetching routers status:', error);
    return c.json({ 
      success: false, 
      error: `Failed to fetch routers status: ${error.message}` 
    }, 500);
  }
});

// Start server
Deno.serve(app.fetch);