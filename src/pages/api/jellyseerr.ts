import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Use process.env for runtime Docker compatibility
  const JELLYSEERR_URL = process.env.JELLYSEERR_URL || process.env.SEERR_URL || import.meta.env.JELLYSEERR_URL || 'http://jellyseerr.local:5055';
  const JELLYSEERR_API_KEY = process.env.JELLYSEERR_API_KEY || process.env.SEERR_API_KEY || import.meta.env.JELLYSEERR_API_KEY || '';

  const fallback = {
    online: true,
    simulated: true,
    version: '1.9.2',
    pendingRequests: 3,
    approvedRequests: 42,
    totalRequests: 45,
    status: 'Operational',
  };

  if (!JELLYSEERR_API_KEY) {
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const headers = { 'X-Api-Key': JELLYSEERR_API_KEY };

    const statusResponse = await fetch(`${JELLYSEERR_URL}/api/v1/status`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (!statusResponse.ok) {
      throw new Error(`Jellyseerr API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    const requestCountResponse = await fetch(`${JELLYSEERR_URL}/api/v1/request/count`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    let requestStats = { pending: 3, approved: 42, total: 45 };
    if (requestCountResponse.ok) {
      requestStats = await requestCountResponse.json();
    }

    return new Response(
      JSON.stringify({
        online: true,
        simulated: false,
        version: status.version || 'v1',
        pendingRequests: requestStats.pending || 0,
        approvedRequests: requestStats.approved || 0,
        totalRequests: requestStats.total || 0,
        status: 'Operational',
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.warn('[Jellyseerr] Falling back to simulated live status:', error);
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
