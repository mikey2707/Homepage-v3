import type { APIRoute } from 'astro';

interface YouTubeVideo {
  title: string;
  link: string;
  channelName: string;
  videoId: string;
  thumbnail: string;
  pubDate: string;
  description?: string;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

export const GET: APIRoute = async () => {
  const YOUTUBE_CHANNEL_IDS = import.meta.env.YOUTUBE_CHANNEL_IDS || '';

  if (!YOUTUBE_CHANNEL_IDS) {
    return new Response(
      JSON.stringify({ items: [], error: 'No YouTube channel IDs configured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const channelIds = YOUTUBE_CHANNEL_IDS.split(',').map((id: string) => id.trim()).filter(Boolean);
    const allVideos: YouTubeVideo[] = [];

    for (const channelId of channelIds) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(
          `https://www.youtube.com/feeds/videos.xml?channel_id=${channelId}`,
          {
            headers: { 'Accept': 'application/xml' },
            signal: controller.signal,
          }
        );
        clearTimeout(timeoutId);

        if (response.ok) {
          const xml = await response.text();
          // Channel name is under <author><name>
          const authorBlock = xml.match(/<author>([\s\S]*?)<\/author>/i);
          const channelName = authorBlock ? extractTag(authorBlock[1], 'name') : extractTag(xml, 'title') || channelId;

          const entryRegex = /<entry>([\s\S]*?)<\/entry>/gi;
          let match;
          while ((match = entryRegex.exec(xml)) !== null) {
            const content = match[1];
            const title = extractTag(content, 'title');
            const videoIdMatch = content.match(/<yt:videoId>([^<]+)<\/yt:videoId>/);
            const videoId = videoIdMatch ? videoIdMatch[1] : '';
            const pubDate = extractTag(content, 'published');
            const description = extractTag(content, 'media:description');

            if (title && videoId) {
              allVideos.push({
                title,
                link: `https://www.youtube.com/watch?v=${videoId}`,
                channelName,
                videoId,
                thumbnail: `https://i.ytimg.com/vi/${videoId}/mqdefault.jpg`,
                pubDate,
                description: description ? description.substring(0, 200) : undefined,
              });
            }
          }
        }
      } catch {
        // Skip failed channels
      }
    }

    // Sort by date (newest first)
    allVideos.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return new Response(
      JSON.stringify({ items: allVideos.slice(0, 20) }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ items: [], error: error instanceof Error ? error.message : 'Failed to fetch YouTube videos' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
