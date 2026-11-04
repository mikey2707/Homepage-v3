import type { APIRoute } from 'astro';
import http from 'http';
import https from 'https';

const stripQuotes = (v: string) => v.replace(/^['"]|['"]$/g, '').trim();

let cachedPayload: string | null = null;
let cachedAt = 0;
const CACHE_TTL_MS = 30000;

function checkUrlOnline(urlStr: string, timeoutMs = 3000): Promise<boolean> {
  return new Promise((resolve) => {
    try {
      const u = new URL(urlStr);
      const client = u.protocol === 'https:' ? https : http;
      const req = client.request(
        {
          hostname: u.hostname,
          port: u.port || (u.protocol === 'https:' ? 443 : 80),
          path: u.pathname + u.search,
          method: 'GET',
          timeout: timeoutMs,
          rejectUnauthorized: false,
        },
        (res) => {
          res.resume();
          const code = res.statusCode || 0;
          resolve(code >= 200 && code < 500);
        }
      );
      req.on('error', () => resolve(false));
      req.on('timeout', () => {
        req.destroy();
        resolve(false);
      });
      req.end();
    } catch {
      resolve(false);
    }
  });
}

export const GET: APIRoute = async () => {
  const now = Date.now();
  if (cachedPayload && now - cachedAt < CACHE_TTL_MS) {
    return new Response(cachedPayload, {
      status: 200,
      headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
    });
  }

  const jellyfinLocal = stripQuotes(process.env.JELLYFIN_URL || import.meta.env.JELLYFIN_URL || '');
  const jellyseerrLocal = stripQuotes(process.env.JELLYSEERR_URL || import.meta.env.JELLYSEERR_URL || '');

  const [jellyfin, jellyseerr, tools] = await Promise.all([
     (jellyfinLocal ? checkUrlOnline(`${jellyfinLocal}/System/Ping`) : Promise.resolve(false)).then(
      (ok) => ok || checkUrlOnline('https://jelly.mikey.host')
    ),
    (jellyseerrLocal ? checkUrlOnline(`${jellyseerrLocal}/api/v1/status`) : Promise.resolve(false)).then(
      (ok) => ok || checkUrlOnline('https://jellyseerr.mikey.host')
    ),
    checkUrlOnline('https://tools.mikey.host'),
  ]);

  const payload = JSON.stringify({
    jellyfin,
    jellyseerr,
    tools,
  });

  cachedPayload = payload;
  cachedAt = now;

  return new Response(payload, {
    status: 200,
    headers: { 'Content-Type': 'application/json', 'Cache-Control': 'no-store' },
  });
};
