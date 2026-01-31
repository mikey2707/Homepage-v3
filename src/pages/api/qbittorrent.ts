import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const QBITTORRENT_URL = import.meta.env.QBITTORRENT_URL || 'http://localhost:8080';
  const QBITTORRENT_USERNAME = import.meta.env.QBITTORRENT_USERNAME || '';
  const QBITTORRENT_PASSWORD = import.meta.env.QBITTORRENT_PASSWORD || '';

  if (!QBITTORRENT_USERNAME || !QBITTORRENT_PASSWORD) {
    return new Response(
      JSON.stringify({
        online: false,
        error: 'qBittorrent credentials not configured'
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // qBittorrent requires login first
    const loginResponse = await fetch(`${QBITTORRENT_URL}/api/v2/auth/login`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: `username=${encodeURIComponent(QBITTORRENT_USERNAME)}&password=${encodeURIComponent(QBITTORRENT_PASSWORD)}`,
    });

    if (!loginResponse.ok) {
      throw new Error(`Login failed with status ${loginResponse.status}. Check username/password.`);
    }

    const loginResult = await loginResponse.text();
    if (loginResult !== 'Ok.') {
      throw new Error('Login failed. Invalid credentials.');
    }

    // Extract SID cookie
    const cookies = loginResponse.headers.get('set-cookie');
    let sid = '';
    if (cookies) {
      const sidMatch = cookies.match(/SID=([^;]+)/);
      sid = sidMatch ? sidMatch[1] : '';
    }

    if (!sid) {
      throw new Error('Failed to get session ID');
    }

    // Get torrent list
    const torrentsResponse = await fetch(`${QBITTORRENT_URL}/api/v2/torrents/info`, {
      headers: {
        Cookie: `SID=${sid}`,
        'Content-Type': 'application/json',
      },
    });

    if (!torrentsResponse.ok) {
      throw new Error(`Failed to get torrents: ${torrentsResponse.status}`);
    }

    const torrents = await torrentsResponse.json();

    // Get global transfer info
    const transferInfoResponse = await fetch(`${QBITTORRENT_URL}/api/v2/transfer/info`, {
      headers: {
        Cookie: `SID=${sid}`,
        'Content-Type': 'application/json',
      },
    });

    const transferInfo = transferInfoResponse.ok ? await transferInfoResponse.json() : {};

    // Format torrent list with relevant info
    const activeTorrents = torrents
      .filter((t: any) => t.state === 'downloading' || t.state === 'uploading' || t.state === 'stalledDL' || t.state === 'stalledUP')
      .slice(0, 5) // Limit to 5 most recent active torrents
      .map((t: any) => ({
        name: t.name,
        progress: (t.progress * 100).toFixed(1) + '%',
        dlspeed: t.dlspeed,
        upspeed: t.upspeed,
        state: t.state,
        size: t.size,
        downloaded: t.downloaded,
      }));

    return new Response(
      JSON.stringify({
        online: true,
        torrentCount: torrents.length || 0,
        downloadSpeed: transferInfo.dl_info_speed || 0,
        uploadSpeed: transferInfo.up_info_speed || 0,
        activeTorrents: activeTorrents,
        status: 'Connected',
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({
        online: false,
        error: error instanceof Error ? error.message : 'Connection failed',
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
