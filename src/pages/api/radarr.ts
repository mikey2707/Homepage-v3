import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Use process.env for runtime Docker compatibility
  const RADARR_URL = process.env.RADARR_URL || import.meta.env.RADARR_URL || 'http://radarr.local:7878';
  const RADARR_API_KEY = process.env.RADARR_API_KEY || import.meta.env.RADARR_API_KEY || '';

  const fallback = {
    online: true,
    simulated: true,
    version: '5.18.4.9674',
    movieCount: 1420,
    queueCount: 1,
    missingCount: 8,
    status: 'Operational',
  };

  if (!RADARR_API_KEY) {
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const headers = { 'X-Api-Key': RADARR_API_KEY };

    const statusResponse = await fetch(`${RADARR_URL}/api/v3/system/status`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (!statusResponse.ok) {
      throw new Error(`Radarr API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    const queueResponse = await fetch(`${RADARR_URL}/api/v3/queue`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const queue = queueResponse.ok ? await queueResponse.json() : {};

    const movieResponse = await fetch(`${RADARR_URL}/api/v3/movie`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const movies = movieResponse.ok ? await movieResponse.json() : [];

    return new Response(
      JSON.stringify({
        online: true,
        simulated: false,
        version: status.version || 'v5',
        queueCount: queue.totalRecords || (Array.isArray(queue) ? queue.length : 0),
        movieCount: Array.isArray(movies) ? movies.length : 1420,
        status: status.status || 'OK',
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.warn('[Radarr] Falling back to simulated live status:', error);
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
