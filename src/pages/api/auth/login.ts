import type { APIRoute } from 'astro';
import {
  validateCredentials,
  createSessionToken,
  getAuthCookieName,
  checkRateLimit,
  recordFailedAttempt,
  resetRateLimit,
  getClientIp,
  sanitizeRedirectPath,
} from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies, clientAddress }) => {
  const clientIp = getClientIp(request, clientAddress);

  // Check rate limiting
  const rateLimit = checkRateLimit(clientIp);
  if (!rateLimit.allowed) {
    return new Response(
      JSON.stringify({
        success: false,
        error: `Too many failed attempts. Locked out for ${rateLimit.retryAfterSeconds} seconds.`,
      }),
      {
        status: 429,
        headers: {
          'Content-Type': 'application/json',
          'Retry-After': String(rateLimit.retryAfterSeconds || 900),
        },
      }
    );
  }

  try {
    let username = '';
    let password = '';
    let rawRedirect: unknown = '/dashboard';

    const contentType = request.headers.get('content-type') || '';
    const isJson = contentType.includes('application/json');

    if (isJson) {
      const body = await request.json().catch(() => ({}));
      username = typeof body.username === 'string' ? body.username : '';
      password = typeof body.password === 'string' ? body.password : '';
      if (body.redirect) rawRedirect = body.redirect;
    } else {
      const formData = await request.formData().catch(() => new FormData());
      username = (formData.get('username') as string) || '';
      password = (formData.get('password') as string) || '';
      const r = formData.get('redirect') as string;
      if (r) rawRedirect = r;
    }

    // Never bounce back to index, legacy /services, or external URLs; enforce safe internal path
    const redirectTarget = sanitizeRedirectPath(rawRedirect, '/dashboard');

    username = username.trim();
    password = password.trim();

    // Validate input
    if (!username || !password) {
      if (!isJson) {
        return Response.redirect(new URL('/login?error=missing', request.url).toString(), 302);
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate credentials
    if (!validateCredentials(username, password)) {
      recordFailedAttempt(clientIp);
      if (!isJson) {
        return Response.redirect(new URL('/login?error=invalid', request.url).toString(), 302);
      }
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid credentials. Please verify your username and passphrase.' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Reset rate limiter upon successful authentication
    resetRateLimit(clientIp);

    // Create session token
    const token = createSessionToken(username);

    // Check if request is over HTTPS
    const isHttps = request.url.startsWith('https://') || process.env.HTTPS_ENABLED === 'true';

    // Set secure cookie with lax sameSite so top-level navigations work seamlessly
    cookies.set(getAuthCookieName(), token, {
      path: '/',
      httpOnly: true,
      sameSite: 'lax',
      secure: isHttps,
      maxAge: 24 * 60 * 60,
    });

    if (!isJson) {
      return Response.redirect(new URL(redirectTarget, request.url).toString(), 302);
    }

    return new Response(
      JSON.stringify({ success: true, message: 'Authentication successful', redirect: redirectTarget }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error: any) {
    console.error('[Login Error]:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'Authentication service error' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
