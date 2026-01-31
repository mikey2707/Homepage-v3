import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Get configuration from environment variables
  const SONARR_URL = import.meta.env.SONARR_URL || 'http://localhost:8989';
  const SONARR_API_KEY = import.meta.env.SONARR_API_KEY || '';

  if (!SONARR_API_KEY) {
    return new Response(
      JSON.stringify({ 
        online: false,
        error: 'Sonarr API key not configured' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Check system status
    const statusResponse = await fetch(`${SONARR_URL}/api/v3/system/status`, {
      headers: {
        'X-Api-Key': SONARR_API_KEY,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Sonarr API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    // Get queue information
    const queueResponse = await fetch(`${SONARR_URL}/api/v3/queue`, {
      headers: {
        'X-Api-Key': SONARR_API_KEY,
      },
    });

    const queue = queueResponse.ok ? await queueResponse.json() : [];

    // Get series count
    const seriesResponse = await fetch(`${SONARR_URL}/api/v3/series`, {
      headers: {
        'X-Api-Key': SONARR_API_KEY,
      },
    });

    const series = seriesResponse.ok ? await seriesResponse.json() : [];

    return new Response(
      JSON.stringify({
        online: true,
        version: status.version,
        queueCount: queue.length || 0,
        seriesCount: series.length || 0,
        status: status.status,
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

