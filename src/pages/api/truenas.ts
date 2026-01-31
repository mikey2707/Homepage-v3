import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const TRUENAS_URL = import.meta.env.TRUENAS_URL || 'http://localhost:80';
  const TRUENAS_API_KEY = import.meta.env.TRUENAS_API_KEY || '';

  if (!TRUENAS_API_KEY) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'TrueNAS API key not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Format bytes to readable size (binary / IEC units)
  const formatBytes = (bytes: number): string => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
    const i = Math.floor(Math.log(Math.abs(bytes)) / Math.log(k));
    return `${(bytes / Math.pow(k, i)).toFixed(1)} ${sizes[i]}`;
  };

  try {
    const headers = {
      'Authorization': `Bearer ${TRUENAS_API_KEY}`,
      'Content-Type': 'application/json',
    };

    // Get system info (includes physical memory)
    const systemInfoResponse = await fetch(`${TRUENAS_URL}/api/v2.0/system/info`, { headers });

    if (!systemInfoResponse.ok) {
      throw new Error(`TrueNAS API returned ${systemInfoResponse.status}`);
    }

    const systemInfo = await systemInfoResponse.json();
    const physMem = systemInfo.physmem || 0;

    // Get pool status
    const poolsResponse = await fetch(`${TRUENAS_URL}/api/v2.0/pool`, { headers });
    const pools = poolsResponse.ok ? await poolsResponse.json() : [];

    // Initialize stats
    let cpuUsage = 'N/A';
    let memoryUsage = 'N/A';
    let memoryFree = 'N/A';
    let memoryZfsCache = 'N/A';
    let memoryServices = 'N/A';
    let availableBytes = 0;
    let arcBytes = 0;

    // Fetch reporting data for CPU, Memory, and ARC size
    // TrueNAS v25.04.2 reporting.get_data endpoint requires aggregate: true
    // Use short time window (last 5 minutes) for more recent averaged data
    try {
      const now = Math.floor(Date.now() / 1000);
      const fiveMinutesAgo = now - 300;

      const reportingResponse = await fetch(`${TRUENAS_URL}/api/v2.0/reporting/get_data`, {
        method: 'POST',
        headers,
        body: JSON.stringify({
          graphs: [
            { name: 'cpu' },
            { name: 'memory' },
            { name: 'arcsize' }
          ],
          query: {
            start: fiveMinutesAgo,
            end: now,
            aggregate: true
          }
        }),
      });

      if (reportingResponse.ok) {
        const reportingData = await reportingResponse.json();

        for (const graph of reportingData) {
          const legend = graph.legend || [];
          const means = graph.aggregations?.mean || {};


          if (graph.name === 'cpu') {
            // CPU: use the 'cpu' key which is overall CPU usage
            if (means.cpu !== undefined && typeof means.cpu === 'number') {
              cpuUsage = `${means.cpu.toFixed(1)}%`;
            }
          }

          if (graph.name === 'memory') {
            // Memory: TrueNAS reports 'available' memory
            availableBytes = means.available || means.free || 0;

            if (availableBytes > 0) {
              memoryFree = formatBytes(availableBytes);
              if (physMem > 0) {
                const usedMem = physMem - availableBytes;
                memoryUsage = `${((usedMem / physMem) * 100).toFixed(1)}%`;
              }
            }
          }

          if (graph.name === 'arcsize') {
            // ARC size - ZFS cache - try different field names
            const arcValue = means.arcsize || means.arc_size || means.size || Object.values(means)[0] || 0;

            if (typeof arcValue === 'number' && arcValue > 0) {
              arcBytes = arcValue;
              memoryZfsCache = formatBytes(arcValue);
            }
          }
        }

        // Calculate services memory: Total - Available - ARC
        if (physMem > 0 && availableBytes > 0) {
          const servicesBytes = physMem - availableBytes - arcBytes;
          if (servicesBytes > 0) {
            memoryServices = formatBytes(servicesBytes);
          }
        }
      } else {
        const errorText = await reportingResponse.text();
        console.error('[TrueNAS] Reporting API error:', reportingResponse.status, errorText);
      }
    } catch (statsError) {
      console.error('[TrueNAS] Failed to fetch reporting stats:', statsError);
    }

    // Calculate per-pool and total storage
    let totalCapacity = 0;
    let totalUsed = 0;

    const poolDetails = pools.map((pool: any) => {
      let poolCapacity = 0;
      let poolUsed = 0;

      // Get capacity from topology data vdevs
      if (pool.topology?.data) {
        for (const vdev of pool.topology.data) {
          const stats = vdev.stats || {};
          poolCapacity += parseInt(stats.size || 0);
          poolUsed += parseInt(stats.allocated || 0);
        }
      }

      totalCapacity += poolCapacity;
      totalUsed += poolUsed;

      const usedPct = poolCapacity > 0
        ? ((poolUsed / poolCapacity) * 100).toFixed(1)
        : '0.0';

      return {
        name: pool.name || 'Unknown',
        status: pool.status || (pool.healthy ? 'ONLINE' : 'DEGRADED'),
        capacity: formatBytes(poolCapacity),
        used: formatBytes(poolUsed),
        usedPercentage: `${usedPct}%`,
        usedPctNum: parseFloat(usedPct),
      };
    });

    const storageUsage = totalCapacity > 0
      ? ((totalUsed / totalCapacity) * 100).toFixed(1) + '%'
      : '0%';

    return new Response(
      JSON.stringify({
        online: true,
        cpuUsage,
        memoryUsage,
        memoryFree,
        memoryZfsCache,
        memoryServices,
        memoryTotal: formatBytes(physMem),
        storageUsage,
        poolCount: pools.length,
        totalCapacity: formatBytes(totalCapacity),
        totalUsed: formatBytes(totalUsed),
        pools: poolDetails,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('[TrueNAS] API error:', error);
    return new Response(
      JSON.stringify({
        online: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
