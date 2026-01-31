import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const PORTAINER_URL = import.meta.env.PORTAINER_URL || 'http://localhost:9000';
  const PORTAINER_API_KEY = import.meta.env.PORTAINER_API_KEY || '';

  if (!PORTAINER_API_KEY) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'Portainer API key not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  const headers = {
    'X-API-Key': PORTAINER_API_KEY,
    'Accept': 'application/json',
  };

  try {
    // Get endpoints (Docker environments)
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    const endpointsResponse = await fetch(`${PORTAINER_URL}/api/endpoints`, {
      headers,
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!endpointsResponse.ok) {
      throw new Error(`Portainer API error (${endpointsResponse.status}). Check API key and URL.`);
    }

    const endpoints = await endpointsResponse.json();

    // Count active endpoints
    const activeEndpoints = endpoints.filter((ep: any) => ep.Status === 1).length;

    // Get containers from all active endpoints
    let totalContainers = 0;
    let runningContainers = 0;
    let stoppedContainers = 0;
    let pausedContainers = 0;

    for (const endpoint of endpoints) {
      // Only query active endpoints
      if (endpoint.Status !== 1) continue;

      try {
        const containersController = new AbortController();
        const containersTimeoutId = setTimeout(() => containersController.abort(), 5000);

        // Get all containers (including stopped ones)
        const containersResponse = await fetch(
          `${PORTAINER_URL}/api/endpoints/${endpoint.Id}/docker/containers/json?all=true`,
          {
            headers,
            signal: containersController.signal,
          }
        );

        clearTimeout(containersTimeoutId);

        if (containersResponse.ok) {
          const containers = await containersResponse.json();
          totalContainers += containers.length;

          for (const container of containers) {
            const state = container.State?.toLowerCase() || '';
            if (state === 'running') {
              runningContainers++;
            } else if (state === 'paused') {
              pausedContainers++;
            } else {
              // exited, created, dead, removing, etc.
              stoppedContainers++;
            }
          }
        }
      } catch (containerError) {
        // Skip this endpoint if container fetch fails
        console.error(`Failed to fetch containers for endpoint ${endpoint.Id}:`, containerError);
      }
    }

    return new Response(
      JSON.stringify({
        online: true,
        endpoints: endpoints.length,
        activeEndpoints: activeEndpoints,
        totalContainers: totalContainers,
        runningContainers: runningContainers,
        stoppedContainers: stoppedContainers,
        pausedContainers: pausedContainers,
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    let errorMessage = 'Connection failed';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Timeout connecting to ${PORTAINER_URL}. Check if Portainer is running.`;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = `Cannot reach ${PORTAINER_URL}. Check URL and ensure Portainer is accessible.`;
      } else {
        errorMessage = error.message;
      }
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
