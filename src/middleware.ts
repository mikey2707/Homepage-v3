import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/auth';

// Routes that require authentication
const protectedRoutes = ['/dashboard', '/services'];

// API routes that require authentication (except public auth endpoints and public 3D cooler thermal feed)
const protectedApiPrefixes = ['/api/'];
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/logout',
  '/api/gateway',
  // Public API route for the 3D diorama walk-in fridge station
  '/api/truenas',
];

export const onRequest = defineMiddleware(async (context, next) => {
  // Normalize and decode pathname to prevent URL-encoded middleware bypasses
  let pathname = context.url.pathname;
  try {
    pathname = decodeURIComponent(pathname).replace(/\/+/g, '/');
    if (pathname.length > 1 && pathname.endsWith('/')) {
      pathname = pathname.slice(0, -1);
    }
  } catch {
    return new Response(JSON.stringify({ error: 'Bad Request' }), {
      status: 400,
      headers: { 'Content-Type': 'application/json' },
    });
  }

  // Check if this is a protected page route
  const isProtectedPage = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Check if this is a protected API route
  const isProtectedApi = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix)) &&
    !publicApiRoutes.includes(pathname);

  // If the route requires authentication
  if (isProtectedPage || isProtectedApi) {
    const authenticated = isAuthenticated(context.cookies);

    if (!authenticated) {
      if (isProtectedApi) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
          {
            status: 401,
            headers: {
              'Content-Type': 'application/json',
              'X-Content-Type-Options': 'nosniff',
              'X-Frame-Options': 'DENY',
            },
          }
        );
      }

      // For page routes, redirect to login
      const loginUrl = new URL('/login', context.url.origin);
      loginUrl.searchParams.set('redirect', pathname);
      return context.redirect(loginUrl.toString());
    }
  }

  // Continue to the requested page/handler
  const response = await next();

  // Inject comprehensive security headers safely (redirect responses have immutable headers)
  try {
    response.headers.set('X-Content-Type-Options', 'nosniff');
    response.headers.set('X-Frame-Options', 'DENY');
    response.headers.set('X-XSS-Protection', '1; mode=block');
    response.headers.set('Referrer-Policy', 'strict-origin-when-cross-origin');
    response.headers.set('Permissions-Policy', 'camera=(), microphone=(), geolocation=()');
  } catch {
    // Return immutable redirect response safely
  }

  return response;
});
