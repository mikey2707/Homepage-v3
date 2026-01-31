import type { APIRoute } from 'astro';

export const GET: APIRoute = async ({ request }) => {
  const JELLYFIN_URL = import.meta.env.JELLYFIN_URL || 'http://localhost:8096';
  const JELLYFIN_API_KEY = import.meta.env.JELLYFIN_API_KEY || '';

  if (!JELLYFIN_API_KEY) {
    return new Response(
      JSON.stringify({ 
        online: false,
        error: 'Jellyfin API key not configured' 
      }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    // Jellyfin uses a different auth method - API key in header
    const systemInfoResponse = await fetch(`${JELLYFIN_URL}/System/Info`, {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Astro", Device="Web", DeviceId="astro-web", Version="1.0.0", Token="${JELLYFIN_API_KEY}"`,
      },
    });

    if (!systemInfoResponse.ok) {
      throw new Error(`Jellyfin API returned ${systemInfoResponse.status}`);
    }

    const systemInfo = await systemInfoResponse.json();

    // Get library statistics
    const itemsResponse = await fetch(`${JELLYFIN_URL}/Items/Counts`, {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Astro", Device="Web", DeviceId="astro-web", Version="1.0.0", Token="${JELLYFIN_API_KEY}"`,
      },
    });

    const items = itemsResponse.ok ? await itemsResponse.json() : {};

    // Get active sessions (current viewers)
    const sessionsResponse = await fetch(`${JELLYFIN_URL}/Sessions`, {
      headers: {
        'X-Emby-Authorization': `MediaBrowser Client="Astro", Device="Web", DeviceId="astro-web", Version="1.0.0", Token="${JELLYFIN_API_KEY}"`,
      },
    });

    const sessions = sessionsResponse.ok ? await sessionsResponse.json() : [];

    // Filter active playback sessions
    const activeStreams = sessions.filter((session: any) => session.NowPlayingItem);

    // Format viewer information
    const viewers = activeStreams.map((session: any) => {
      const item = session.NowPlayingItem;
      const user = session.UserName || 'Unknown User';
      const content = item.SeriesName
        ? `${item.SeriesName} - S${item.ParentIndexNumber}E${item.IndexNumber}`
        : item.Name;

      return {
        user,
        content,
        type: item.Type,
        client: session.Client || 'Unknown',
        deviceName: session.DeviceName || 'Unknown Device'
      };
    });

    return new Response(
      JSON.stringify({
        online: true,
        version: systemInfo.Version || 'Unknown',
        serverName: systemInfo.ServerName || 'Jellyfin',
        movieCount: items.MovieCount || 0,
        seriesCount: items.SeriesCount || 0,
        episodeCount: items.EpisodeCount || 0,
        activeStreams: activeStreams.length,
        viewers: viewers,
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

