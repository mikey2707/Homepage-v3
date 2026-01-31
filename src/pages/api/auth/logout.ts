import type { APIRoute } from 'astro';
import { getAuthCookieName } from '../../../lib/auth';

export const POST: APIRoute = async ({ cookies, redirect }) => {
  // Clear the auth cookie
  cookies.delete(getAuthCookieName(), {
    path: '/',
  });

  return new Response(
    JSON.stringify({ success: true, message: 'Logged out successfully' }),
    { status: 200, headers: { 'Content-Type': 'application/json' } }
  );
};

export const GET: APIRoute = async ({ cookies, redirect }) => {
  // Clear the auth cookie
  cookies.delete(getAuthCookieName(), {
    path: '/',
  });

  // Redirect to home page
  return redirect('/');
};
