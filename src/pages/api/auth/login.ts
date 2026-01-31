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

    // Set cookie
    cookies.set(getAuthCookieName(), token, {
      path: '/',
      httpOnly: true,
      secure: import.meta.env.PROD,
      sameSite: 'lax',
      maxAge: 60 * 60 * 24, // 24 hours
    });

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
