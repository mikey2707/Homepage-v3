import type { APIRoute } from 'astro';

interface FeedItem {
  title: string;
  link: string;
  pubDate: string;
  source: string;
  description?: string;
}

function extractTag(xml: string, tag: string): string {
  const regex = new RegExp(`<${tag}[^>]*>(?:<!\\[CDATA\\[)?([\\s\\S]*?)(?:\\]\\]>)?</${tag}>`, 'i');
  const match = xml.match(regex);
  return match ? match[1].trim() : '';
}

function parseRSSItems(xml: string, sourceName: string): FeedItem[] {
  const items: FeedItem[] = [];
  const itemRegex = /<(?:item|entry)[\s>]([\s\S]*?)<\/(?:item|entry)>/gi;
  let match;
  while ((match = itemRegex.exec(xml)) !== null) {
    const content = match[1];
    const title = extractTag(content, 'title');

    // RSS uses <link>url</link>, Atom uses <link href="..."/>
    let link = extractTag(content, 'link');
    if (!link) {
      const linkHref = content.match(/<link[^>]*href=["']([^"']+)["']/i);
      if (linkHref) link = linkHref[1];
    }

    const pubDate = extractTag(content, 'pubDate') || extractTag(content, 'published') || extractTag(content, 'updated');
    const description = extractTag(content, 'description') || extractTag(content, 'summary');

    if (title) {
      items.push({
        title,
        link,
        pubDate,
        source: sourceName,
        description: description.replace(/<[^>]+>/g, '').substring(0, 200),
      });
    }
  }
  return items;
}

export const GET: APIRoute = async () => {
  const RSS_FEED_URLS = import.meta.env.RSS_FEED_URLS || '';

  if (!RSS_FEED_URLS) {
    return new Response(
      JSON.stringify({ items: [], error: 'No RSS feed URLs configured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const feedUrls = RSS_FEED_URLS.split(',').map((u: string) => u.trim()).filter(Boolean);
    const allItems: FeedItem[] = [];

    for (const url of feedUrls) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(url, {
          headers: { 'Accept': 'application/rss+xml, application/xml, text/xml' },
          signal: controller.signal,
        });
        clearTimeout(timeoutId);

        if (response.ok) {
          const xml = await response.text();
          const feedTitle = extractTag(xml, 'title') || new URL(url).hostname;
          const items = parseRSSItems(xml, feedTitle);
          allItems.push(...items);
        }
      } catch {
        // Skip failed feeds silently
      }
    }

    // Sort by date (newest first) and limit
    allItems.sort((a, b) => new Date(b.pubDate).getTime() - new Date(a.pubDate).getTime());

    return new Response(
      JSON.stringify({ items: allItems.slice(0, 20) }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ items: [], error: error instanceof Error ? error.message : 'Failed to fetch feeds' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
