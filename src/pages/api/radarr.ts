import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const RADARR_URL = import.meta.env.RADARR_URL || 'http://localhost:7878';
  const RADARR_API_KEY = import.meta.env.RADARR_API_KEY || '';

  if (!RADARR_API_KEY) {
    return new Response(
      JSON.stringify({ 
        online: false,
        error: 'Radarr API key not configured' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const statusResponse = await fetch(`${RADARR_URL}/api/v3/system/status`, {
      headers: {
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Radarr API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    const queueResponse = await fetch(`${RADARR_URL}/api/v3/queue`, {
      headers: {
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    const queue = queueResponse.ok ? await queueResponse.json() : [];

    const movieResponse = await fetch(`${RADARR_URL}/api/v3/movie`, {
      headers: {
        'X-Api-Key': RADARR_API_KEY,
      },
    });

    const movies = movieResponse.ok ? await movieResponse.json() : [];

    return new Response(
      JSON.stringify({
        online: true,
        version: status.version,
        queueCount: queue.length || 0,
        movieCount: movies.length || 0,
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

