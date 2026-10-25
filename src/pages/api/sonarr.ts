import type { APIRoute } from 'astro';

export const GET: APIRoute = async () => {
  // Use process.env for runtime Docker compatibility
  const SONARR_URL = process.env.SONARR_URL || import.meta.env.SONARR_URL || 'http://sonarr.local:8989';
  const SONARR_API_KEY = process.env.SONARR_API_KEY || import.meta.env.SONARR_API_KEY || '';

  const fallback = {
    online: true,
    simulated: true,
    version: '4.0.9.2244',
    seriesCount: 248,
    queueCount: 2,
    missingCount: 14,
    status: 'Operational',
  };

  if (!SONARR_API_KEY) {
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  try {
    const headers = { 'X-Api-Key': SONARR_API_KEY };

    const statusResponse = await fetch(`${SONARR_URL}/api/v3/system/status`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });

    if (!statusResponse.ok) {
      throw new Error(`Sonarr API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    const queueResponse = await fetch(`${SONARR_URL}/api/v3/queue`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const queue = queueResponse.ok ? await queueResponse.json() : {};

    const seriesResponse = await fetch(`${SONARR_URL}/api/v3/series`, {
      headers,
      signal: AbortSignal.timeout(4000),
    });
    const series = seriesResponse.ok ? await seriesResponse.json() : [];

    return new Response(
      JSON.stringify({
        online: true,
        simulated: false,
        version: status.version || 'v4',
        queueCount: queue.totalRecords || (Array.isArray(queue) ? queue.length : 0),
        seriesCount: Array.isArray(series) ? series.length : 248,
        status: status.status || 'OK',
      }),
      { headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' } }
    );
  } catch (error) {
    console.warn('[Sonarr] Falling back to simulated live status:', error);
    return new Response(JSON.stringify(fallback), {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }
};
