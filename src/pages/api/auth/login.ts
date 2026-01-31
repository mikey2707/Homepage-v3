import type { APIRoute } from 'astro';
import { validateCredentials, createSessionToken, getAuthCookieName } from '../../../lib/auth';

export const POST: APIRoute = async ({ request, cookies }) => {
  try {
    const body = await request.json();
    const { username, password } = body;

    // Validate input
    if (!username || !password) {
      return new Response(
        JSON.stringify({ success: false, error: 'Username and password are required' }),
        { status: 400, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Validate credentials
    if (!validateCredentials(username, password)) {
      return new Response(
        JSON.stringify({ success: false, error: 'Invalid username or password' }),
        { status: 401, headers: { 'Content-Type': 'application/json' } }
      );
    }

    // Create session token
    const token = createSessionToken(username);

    // Determine if we should use secure cookies
    // Use HTTPS_ENABLED env var, or check if request is over HTTPS
    const forceHttps = process.env.HTTPS_ENABLED === 'true';
    const isSecure = forceHttps || request.url.startsWith('https://');

    console.log('[Auth] Debug - Setting cookie, secure:', isSecure);
    console.log('[Auth] Debug - Cookie name:', getAuthCookieName());
    console.log('[Auth] Debug - Token created:', !!token);

    // Set cookie
    cookies.set(getAuthCookieName(), token, {
      path: '/',
      httpOnly: true,
      secure: isSecure,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

    console.log('[Auth] Debug - Cookie set successfully');

    return new Response(
      JSON.stringify({ success: true, message: 'Login successful' }),
      { status: 200, headers: { 'Content-Type': 'application/json' } }
    );
  } catch (error) {
    console.error('Login error:', error);
    return new Response(
      JSON.stringify({ success: false, error: 'An error occurred during login' }),
      { status: 500, headers: { 'Content-Type': 'application/json' } }
    );
  }
};
