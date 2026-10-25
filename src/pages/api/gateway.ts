import type { APIRoute } from 'astro';
import { isAuthenticated } from '../../lib/auth';

/**
 * Secure Homelab Gateway
 * Shields private IP addresses and ports from being exposed to the client.
 * Only authenticated sessions can request service redirection.
 */

const SERVICE_URL_MAP: Record<string, () => string | undefined> = {
  truenas: () => process.env.TRUENAS_EXTERNAL_URL || process.env.TRUENAS_URL,
  proxmox: () => process.env.PROXMOX_EXTERNAL_URL || process.env.PROXMOX_URL,
  portainer: () => process.env.PORTAINER_EXTERNAL_URL || process.env.PORTAINER_URL,
  adguard: () => process.env.ADGUARD_EXTERNAL_URL || process.env.ADGUARD_URL,
  jellyfin: () => process.env.JELLYFIN_EXTERNAL_URL || process.env.JELLYFIN_URL,
  jellyseerr: () => process.env.JELLYSEERR_EXTERNAL_URL || process.env.JELLYSEERR_URL,
  sonarr: () => process.env.SONARR_EXTERNAL_URL || process.env.SONARR_URL,
  radarr: () => process.env.RADARR_EXTERNAL_URL || process.env.RADARR_URL,
  qbittorrent: () => process.env.QBITTORRENT_EXTERNAL_URL || process.env.QBITTORRENT_URL,
  prowlarr: () => process.env.PROWLARR_EXTERNAL_URL || process.env.PROWLARR_URL,
  tdarr: () => process.env.TDARR_EXTERNAL_URL || process.env.TDARR_URL,
  wazuh: () => process.env.WAZUH_EXTERNAL_URL || process.env.WAZUH_URL,
  npm: () => process.env.NPM_EXTERNAL_URL || process.env.NPM_URL,
  udm: () => process.env.UDM_EXTERNAL_URL || process.env.UDM_URL,
  crafty: () => process.env.CRAFTY_EXTERNAL_URL || process.env.CRAFTY_URL,
  amp: () => process.env.AMP_EXTERNAL_URL || process.env.AMP_URL,
  homeassistant: () => process.env.HOMEASSISTANT_EXTERNAL_URL || process.env.HOMEASSISTANT_URL,
  immich: () => process.env.IMMICH_EXTERNAL_URL || process.env.IMMICH_URL,
};

export const GET: APIRoute = async ({ request, cookies }) => {
  const authenticated = isAuthenticated(cookies);
  const url = new URL(request.url);
  const service = url.searchParams.get('service')?.toLowerCase().trim() || '';

  if (!authenticated) {
    const loginUrl = new URL('/login', url.origin);
    loginUrl.searchParams.set('redirect', `/api/gateway?service=${encodeURIComponent(service)}`);
    return Response.redirect(loginUrl.toString(), 302);
  }

  const getTargetUrl = SERVICE_URL_MAP[service];
  const targetUrl = getTargetUrl ? getTargetUrl() : null;

  if (!targetUrl) {
    return new Response(
      JSON.stringify({ error: 'NotFound', message: 'Service destination not configured' }),
      {
        status: 404,
        headers: {
          'Content-Type': 'application/json',
          'Cache-Control': 'no-store, no-cache',
        },
      }
    );
  }

  // Perform secure server-side redirect directly to the owner's destination
  return new Response(null, {
    status: 302,
    headers: {
      Location: targetUrl,
      'Cache-Control': 'no-store, private',
    },
  });
};
