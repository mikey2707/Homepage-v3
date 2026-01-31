import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Get configuration from environment variables
  const JELLYSEERR_URL = import.meta.env.JELLYSEERR_URL || 'http://localhost:5055';
  const JELLYSEERR_API_KEY = import.meta.env.JELLYSEERR_API_KEY || '';

  if (!JELLYSEERR_API_KEY) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'Jellyseerr API key not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check system status
    const statusResponse = await fetch(`${JELLYSEERR_URL}/api/v1/status`, {
      headers: {
        'X-Api-Key': JELLYSEERR_API_KEY,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Jellyseerr API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    // Get request count statistics
    const requestCountResponse = await fetch(`${JELLYSEERR_URL}/api/v1/request/count`, {
      headers: {
        'X-Api-Key': JELLYSEERR_API_KEY,
      },
    });

    let requestStats = { pending: 0, approved: 0, total: 0 };
    if (requestCountResponse.ok) {
      requestStats = await requestCountResponse.json();
    }

    return new Response(
      JSON.stringify({
        online: true,
        version: status.version || 'Unknown',
        pendingRequests: requestStats.pending || 0,
        approvedRequests: requestStats.approved || 0,
        totalRequests: requestStats.total || 0,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        online: false,
        error: error instanceof Error ? error.message : 'Unknown error',
      }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
