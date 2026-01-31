import type { APIRoute } from 'astro';
import https from 'https';

export const GET: APIRoute = async ({ request }) => {
  const PROXMOX_URL = import.meta.env.PROXMOX_URL || 'https://localhost:8006';
  const PROXMOX_TOKEN_ID = import.meta.env.PROXMOX_TOKEN_ID || '';
  const PROXMOX_TOKEN_SECRET = import.meta.env.PROXMOX_TOKEN_SECRET || '';

  if (!PROXMOX_TOKEN_ID || !PROXMOX_TOKEN_SECRET) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'Proxmox credentials not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  // Format bytes for display
  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB', 'TB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  try {
    // Proxmox API uses PVEAPIToken format: PVEAPIToken=USER@REALM!TOKENID=SECRET
    const authHeader = `PVEAPIToken=${PROXMOX_TOKEN_ID}=${PROXMOX_TOKEN_SECRET}`;

    // Use node's native https for self-signed cert support
    const fetchWithAgent = async (url: string) => {
      return new Promise<any>((resolve, reject) => {
        const urlObj = new URL(url);
        const options = {
          hostname: urlObj.hostname,
          port: urlObj.port || 8006,
          path: urlObj.pathname,
          method: 'GET',
          headers: {
            'Authorization': authHeader,
            'Accept': 'application/json',
          },
          rejectUnauthorized: false, // Allow self-signed certs
        };

        const req = https.request(options, (res) => {
          let data = '';
          res.on('data', (chunk) => { data += chunk; });
          res.on('end', () => {
            if (res.statusCode && res.statusCode >= 200 && res.statusCode < 300) {
              try {
                resolve(JSON.parse(data));
              } catch {
                reject(new Error('Invalid JSON response'));
              }
            } else {
              reject(new Error(`Proxmox API returned ${res.statusCode}`));
            }
          });
        });

        req.on('error', (e) => reject(e));
        req.setTimeout(10000, () => {
          req.destroy();
          reject(new Error('Request timeout'));
        });
        req.end();
      });
    };

    // Get cluster resources
    const data = await fetchWithAgent(`${PROXMOX_URL}/api2/json/cluster/resources`);
    const resources = data.data || [];

    // Get VMs and LXC containers
    const vms = resources.filter((r: any) => r.type === 'qemu');
    const lxc = resources.filter((r: any) => r.type === 'lxc');

    // Combine all guests (VMs + LXC)
    const allGuests = [...vms, ...lxc];
    const runningGuests = allGuests.filter((g: any) => g.status === 'running').length;
    const stoppedGuests = allGuests.length - runningGuests;

    // Calculate total CPU and memory usage from nodes
    const nodes = resources.filter((r: any) => r.type === 'node');
    let totalCpu = 0;
    let totalMem = 0;
    let totalMaxMem = 0;
    for (const node of nodes) {
      if (node.cpu !== undefined) totalCpu += node.cpu;
      if (node.mem !== undefined) totalMem += node.mem;
      if (node.maxmem !== undefined) totalMaxMem += node.maxmem;
    }
    const avgCpu = nodes.length > 0 ? (totalCpu / nodes.length * 100).toFixed(1) : '0';
    const memUsage = totalMaxMem > 0 ? ((totalMem / totalMaxMem) * 100).toFixed(1) : '0';

    // Build per-guest resource breakdown
    const guestDetails = allGuests
      .filter((g: any) => g.status === 'running') // Only show running guests
      .map((guest: any) => {
        const cpuPercent = guest.cpu !== undefined ? (guest.cpu * 100).toFixed(1) : '0';
        const memUsed = guest.mem || 0;
        const memMax = guest.maxmem || 0;
        const memPercent = memMax > 0 ? ((memUsed / memMax) * 100).toFixed(1) : '0';

        return {
          name: guest.name || `${guest.type}-${guest.vmid}`,
          type: guest.type === 'qemu' ? 'VM' : 'LXC',
          vmid: guest.vmid,
          status: guest.status,
          cpu: `${cpuPercent}%`,
          memory: `${memPercent}%`,
          memoryUsed: formatBytes(memUsed),
          memoryMax: formatBytes(memMax),
        };
      })
      .sort((a: any, b: any) => a.name.localeCompare(b.name));

    return new Response(
      JSON.stringify({
        online: true,
        // Combined guest stats
        totalGuests: allGuests.length,
        runningGuests: runningGuests,
        stoppedGuests: stoppedGuests,
        // Overall resource usage
        cpuUsage: `${avgCpu}%`,
        memoryUsage: `${memUsage}%`,
        memoryUsed: formatBytes(totalMem),
        memoryTotal: formatBytes(totalMaxMem),
        // Per-guest breakdown
        guests: guestDetails,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    let errorMessage = 'Connection failed';
    if (error instanceof Error) {
      errorMessage = error.message;
    }

    return new Response(
      JSON.stringify({
        online: false,
        error: errorMessage,
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
