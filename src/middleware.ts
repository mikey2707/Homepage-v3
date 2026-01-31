import { defineMiddleware } from 'astro:middleware';
import { isAuthenticated } from './lib/auth';

// Routes that require authentication
const protectedRoutes = ['/services'];

// API routes that require authentication (except auth endpoints)
const protectedApiPrefixes = ['/api/'];
const publicApiRoutes = [
  '/api/auth/login',
  '/api/auth/logout',
  // Public API routes for the professional dashboard (/dashboard)
  '/api/adguard',
  '/api/homeassistant',
  '/api/immich',
  '/api/portainer',
  '/api/truenas',
];

export const onRequest = defineMiddleware(async (context, next) => {
  const { pathname } = context.url;

  // Check if this is a protected page route
  const isProtectedPage = protectedRoutes.some(route => pathname === route || pathname.startsWith(route + '/'));

  // Check if this is a protected API route
  const isProtectedApi = protectedApiPrefixes.some(prefix => pathname.startsWith(prefix)) &&
    !publicApiRoutes.includes(pathname);

  // If the route requires authentication
  if (isProtectedPage || isProtectedApi) {
    const authenticated = isAuthenticated(context.cookies);

    if (!authenticated) {
      // For API routes, return 401 JSON response
      if (isProtectedApi) {
        return new Response(
          JSON.stringify({ error: 'Unauthorized', message: 'Authentication required' }),
          {
            status: 401,
            headers: { 'Content-Type': 'application/json' },
          }
        );
      }

      // For page routes, redirect to login
      const loginUrl = new URL('/login', context.url.origin);
      loginUrl.searchParams.set('redirect', pathname);
      return context.redirect(loginUrl.toString());
    }
  }

  // Continue to the requested page
  return next();
});
