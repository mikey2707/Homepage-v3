/**
 * Authentication utilities for the dashboard
 * Designed as an abstraction layer for easy Authentik SSO migration later
 */

// Simple session token using HMAC-like signature
// In production with Authentik, this would be replaced with JWT validation

export interface AuthSession {
  username: string;
  expiresAt: number;
}

const AUTH_COOKIE_NAME = 'auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

/**
 * Validate credentials against environment variables
 * When migrating to Authentik, replace this with OAuth token validation
 */
export function validateCredentials(username: string, password: string): boolean {
  const validUsername = import.meta.env.AUTH_USERNAME || 'admin';
  const validPassword = import.meta.env.AUTH_PASSWORD || '';

  if (!validPassword) {
    console.warn('AUTH_PASSWORD not set - authentication disabled');
    return false;
  }

  return username === validUsername && password === validPassword;
}

/**
 * Create a session token
 * When migrating to Authentik, this would store/validate Authentik tokens
 */
export function createSessionToken(username: string): string {
  const secret = import.meta.env.AUTH_SECRET || 'default-secret-change-me';
  const expiresAt = Date.now() + SESSION_DURATION;
  const payload = JSON.stringify({ username, expiresAt });

  // Simple base64 encoding with a signature
  // In production, use proper JWT or Authentik tokens
  const encoded = Buffer.from(payload).toString('base64');
  const signature = createSignature(encoded, secret);

  return `${encoded}.${signature}`;
}

/**
 * Validate a session token
 * Returns the session data if valid, null otherwise
 */
export function validateSessionToken(token: string): AuthSession | null {
  if (!token) return null;

  const secret = import.meta.env.AUTH_SECRET || 'default-secret-change-me';
  const parts = token.split('.');

  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;

  // Verify signature
  const expectedSignature = createSignature(encoded, secret);
  if (signature !== expectedSignature) return null;

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64').toString('utf-8'));

    // Check expiration
    if (payload.expiresAt < Date.now()) return null;

    return {
      username: payload.username,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Create a simple signature for the token
 * This is a basic implementation - Authentik will provide proper JWT validation
 */
function createSignature(data: string, secret: string): string {
  // Simple hash-like signature (not cryptographically secure, but sufficient for basic auth)
  // In production with Authentik, this would be replaced with proper JWT verification
  let hash = 0;
  const combined = data + secret;
  for (let i = 0; i < combined.length; i++) {
    const char = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + char;
    hash = hash & hash; // Convert to 32bit integer
  }
  return Math.abs(hash).toString(36);
}

/**
 * Get the auth cookie name
 */
export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME;
}

/**
 * Check if a request is authenticated
 */
export function isAuthenticated(cookies: { get: (name: string) => { value: string } | undefined }): boolean {
  const cookie = cookies.get(AUTH_COOKIE_NAME);
  if (!cookie) return false;

  const session = validateSessionToken(cookie.value);
  return session !== null;
}

/**
 * Get the current session from cookies
 */
export function getSession(cookies: { get: (name: string) => { value: string } | undefined }): AuthSession | null {
  const cookie = cookies.get(AUTH_COOKIE_NAME);
  if (!cookie) return null;

  return validateSessionToken(cookie.value);
}
