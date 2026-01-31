import type { APIRoute } from 'astro';

interface RedditPost {
  title: string;
  link: string;
  subreddit: string;
  author: string;
  score: number;
  numComments: number;
  thumbnail: string | null;
  pubDate: string;
  selfText?: string;
}

export const GET: APIRoute = async () => {
  // Use process.env for runtime Docker compatibility
  const REDDIT_SUBREDDITS = process.env.REDDIT_SUBREDDITS || import.meta.env.REDDIT_SUBREDDITS || '';

  console.log('[Reddit] Debug - Subreddits configured:', !!REDDIT_SUBREDDITS);

  if (!REDDIT_SUBREDDITS) {
    return new Response(
      JSON.stringify({ items: [], error: 'No Reddit subreddits configured' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }

  try {
    const subreddits = REDDIT_SUBREDDITS.split(',').map((s: string) => s.trim()).filter(Boolean);
    const allPosts: RedditPost[] = [];
    const errors: string[] = [];

    for (const sub of subreddits) {
      try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 10000);

        const response = await fetch(`https://old.reddit.com/r/${sub}/hot.json?limit=10&raw_json=1`, {
          headers: {
            'User-Agent': 'Mozilla/5.0 (compatible; AstroDashboard/1.0; +https://mikey.host)',
            'Accept': 'application/json',
          },
          signal: controller.signal,
          redirect: 'follow',
        });
        clearTimeout(timeoutId);

        if (!response.ok) {
          errors.push(`r/${sub}: HTTP ${response.status}`);
          continue;
        }

        const text = await response.text();
        let data: any;
        try {
          data = JSON.parse(text);
        } catch {
          errors.push(`r/${sub}: invalid JSON response`);
          continue;
        }

        const posts = data.data?.children || [];

        for (const post of posts) {
          const d = post.data;
          if (d.stickied) continue;

          const thumbnail = (d.thumbnail && d.thumbnail.startsWith('http'))
            ? d.thumbnail
            : null;

          allPosts.push({
            title: d.title,
            link: `https://www.reddit.com${d.permalink}`,
            subreddit: d.subreddit_name_prefixed || `r/${sub}`,
            author: d.author,
            score: d.score,
            numComments: d.num_comments,
            thumbnail,
            pubDate: new Date(d.created_utc * 1000).toISOString(),
            selfText: d.selftext ? d.selftext.substring(0, 200) : undefined,
          });
        }
      } catch (e) {
        errors.push(`r/${sub}: ${e instanceof Error ? e.message : 'unknown error'}`);
      }
    }

    // Sort by score (hottest first)
    allPosts.sort((a, b) => b.score - a.score);

    return new Response(
      JSON.stringify({
        items: allPosts.slice(0, 20),
        ...(errors.length > 0 && allPosts.length === 0 && { error: errors.join('; ') }),
      }),
      { headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    return new Response(
      JSON.stringify({ items: [], error: error instanceof Error ? error.message : 'Failed to fetch Reddit posts' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
