import type { APIRoute } from 'astro';

// Format bytes to readable size (binary / IEC units)
function formatBytes(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KiB', 'MiB', 'GiB', 'TiB', 'PiB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${(bytes / Math.pow(k, i)).toFixed(2)} ${sizes[i]}`;
}

export const GET: APIRoute = async ({ request }) => {
  // Use process.env for runtime Docker compatibility
  const IMMICH_URL = process.env.IMMICH_URL || import.meta.env.IMMICH_URL || 'http://localhost:2283';
  const IMMICH_API_KEY = process.env.IMMICH_API_KEY || import.meta.env.IMMICH_API_KEY || '';

  console.log('[Immich] Debug - URL:', IMMICH_URL);
  console.log('[Immich] Debug - API Key configured:', !!IMMICH_API_KEY);

  if (!IMMICH_API_KEY) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'Immich API key not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Try newer API first (v1.95.0+)
    let serverInfoResponse = await fetch(`${IMMICH_URL}/api/server-info/ping`, {
      headers: {
        'x-api-key': IMMICH_API_KEY,
        'Accept': 'application/json',
      },
    });

    // If 404, try older API endpoint
    if (serverInfoResponse.status === 404) {
      serverInfoResponse = await fetch(`${IMMICH_URL}/api/server/ping`, {
        headers: {
          'x-api-key': IMMICH_API_KEY,
          'Accept': 'application/json',
        },
      });
    }

    if (!serverInfoResponse.ok) {
      throw new Error(`Immich server not responding (${serverInfoResponse.status}). Check URL and API key.`);
    }

    // Try to get statistics (newer API)
    let statsResponse = await fetch(`${IMMICH_URL}/api/server-info/statistics`, {
      headers: {
        'x-api-key': IMMICH_API_KEY,
        'Accept': 'application/json',
      },
    });

    // If 404, try older endpoint
    if (statsResponse.status === 404) {
      statsResponse = await fetch(`${IMMICH_URL}/api/server/statistics`, {
        headers: {
          'x-api-key': IMMICH_API_KEY,
          'Accept': 'application/json',
        },
      });
    }

    let stats: any = {};
    if (statsResponse.ok) {
      stats = await statsResponse.json();
    }

    // Fetch actual disk usage from storage endpoint (matches Immich UI)
    let storageResponse = await fetch(`${IMMICH_URL}/api/server-info/storage`, {
      headers: {
        'x-api-key': IMMICH_API_KEY,
        'Accept': 'application/json',
      },
    });

    if (storageResponse.status === 404) {
      storageResponse = await fetch(`${IMMICH_URL}/api/server/storage`, {
        headers: {
          'x-api-key': IMMICH_API_KEY,
          'Accept': 'application/json',
        },
      });
    }

    let storage: any = {};
    if (storageResponse.ok) {
      storage = await storageResponse.json();
    }

    // Prefer storage endpoint's diskUse (matches Immich UI), fall back to statistics
    const usageDisplay = storage.diskUse || formatBytes(stats.usage || stats.diskUsage || 0);
    const diskSize = storage.diskSize || null;
    const diskUsagePercentage = storage.diskUsagePercentage != null
      ? `${storage.diskUsagePercentage}%`
      : null;

    return new Response(
      JSON.stringify({
        online: true,
        photos: stats.photos || 0,
        videos: stats.videos || 0,
        usage: usageDisplay,
        ...(diskSize && { diskSize }),
        ...(diskUsagePercentage && { diskUsage: diskUsagePercentage }),
        totalObjects: (stats.photos || 0) + (stats.videos || 0),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        online: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
