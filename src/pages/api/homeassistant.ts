import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const HA_URL = import.meta.env.HOMEASSISTANT_URL || 'http://localhost:8123';
  const HA_TOKEN = import.meta.env.HOMEASSISTANT_TOKEN || '';

  if (!HA_TOKEN) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'Home Assistant token not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Get status
    const statusResponse = await fetch(`${HA_URL}/api/`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
      },
    });

    if (!statusResponse.ok) {
      throw new Error(`Home Assistant API returned ${statusResponse.status}`);
    }

    const status = await statusResponse.json();

    // Get states count
    const statesResponse = await fetch(`${HA_URL}/api/states`, {
      headers: {
        'Authorization': `Bearer ${HA_TOKEN}`,
      },
    });

    const states = statesResponse.ok ? await statesResponse.json() : [];

    // Count entities by domain
    const entities = {
      lights: states.filter((s: any) => s.entity_id.startsWith('light.')).length,
      switches: states.filter((s: any) => s.entity_id.startsWith('switch.')).length,
      sensors: states.filter((s: any) => s.entity_id.startsWith('sensor.')).length,
      automations: states.filter((s: any) => s.entity_id.startsWith('automation.')).length,
    };

    return new Response(
      JSON.stringify({
        online: true,
        version: status.version || 'Unknown',
        totalEntities: states.length,
        lights: entities.lights,
        switches: entities.switches,
        sensors: entities.sensors,
        automations: entities.automations,
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
