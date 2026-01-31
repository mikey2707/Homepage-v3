import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  // Use process.env for runtime Docker compatibility
  const ADGUARD_URL = process.env.ADGUARD_URL || import.meta.env.ADGUARD_URL || 'http://localhost:3000';
  const ADGUARD_USERNAME = process.env.ADGUARD_USERNAME || import.meta.env.ADGUARD_USERNAME || '';
  const ADGUARD_PASSWORD = process.env.ADGUARD_PASSWORD || import.meta.env.ADGUARD_PASSWORD || '';

  console.log('[AdGuard] Debug - URL:', ADGUARD_URL);
  console.log('[AdGuard] Debug - Username configured:', !!ADGUARD_USERNAME);
  console.log('[AdGuard] Debug - Password configured:', !!ADGUARD_PASSWORD);

  if (!ADGUARD_USERNAME || !ADGUARD_PASSWORD) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'AdGuard credentials not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Create Basic Auth header
    const auth = Buffer.from(`${ADGUARD_USERNAME}:${ADGUARD_PASSWORD}`).toString('base64');

    // Get status with extended timeout
    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000); // 10 second timeout

    const statusResponse = await fetch(`${ADGUARD_URL}/control/status`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      signal: controller.signal,
    });

    clearTimeout(timeoutId);

    if (!statusResponse.ok) {
      throw new Error(`AdGuard API error (${statusResponse.status}). Check credentials and URL.`);
    }

    const status = await statusResponse.json();

    // Get stats
    const statsController = new AbortController();
    const statsTimeoutId = setTimeout(() => statsController.abort(), 10000);

    const statsResponse = await fetch(`${ADGUARD_URL}/control/stats`, {
      headers: {
        'Authorization': `Basic ${auth}`,
        'Accept': 'application/json',
      },
      signal: statsController.signal,
    });

    clearTimeout(statsTimeoutId);

    const stats = statsResponse.ok ? await statsResponse.json() : {};

    // Calculate average processing time in ms
    const avgTime = stats.avg_processing_time
      ? (stats.avg_processing_time * 1000).toFixed(2) + ' ms'
      : '0 ms';

    return new Response(
      JSON.stringify({
        online: true,
        protection: status.protection_enabled ? 'Enabled' : 'Disabled',
        dnsQueries: stats.num_dns_queries || 0,
        blockedQueries: stats.num_blocked_filtering || 0,
        blockRate: stats.num_dns_queries > 0
          ? ((stats.num_blocked_filtering / stats.num_dns_queries) * 100).toFixed(1) + '%'
          : '0%',
        safeBrowsingBlocked: stats.num_replaced_safebrowsing || 0,
        parentalBlocked: stats.num_replaced_parental || 0,
        safeSearchEnforced: stats.num_replaced_safesearch || 0,
        avgProcessingTime: avgTime,
        // Additional status info
        dhcpEnabled: status.dhcp_available ? 'Yes' : 'No',
        runningStatus: status.running ? 'Running' : 'Stopped',
        version: status.version || 'Unknown',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    let errorMessage = 'Connection failed';
    if (error instanceof Error) {
      if (error.name === 'AbortError') {
        errorMessage = `Timeout connecting to ${ADGUARD_URL}. Check if AdGuard is running.`;
      } else if (error.message.includes('fetch failed')) {
        errorMessage = `Cannot reach ${ADGUARD_URL}. Check URL and ensure AdGuard is accessible.`;
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
