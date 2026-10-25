import crypto from 'crypto';

/**
 * Enhanced Authentication utilities for the dashboard
 * Features cryptographic HMAC-SHA256 signing, rate-limiting, and sanitized security checks
 */

export interface AuthSession {
  username: string;
  expiresAt: number;
}

const AUTH_COOKIE_NAME = 'auth_session';
const SESSION_DURATION = 24 * 60 * 60 * 1000; // 24 hours

// Rate-limiting state: IP -> { attempts: number, lockUntil: number, lastAttempt: number }
interface RateLimitRecord {
  attempts: number;
  lockUntil: number;
  lastAttempt: number;
}
const rateLimitMap = new Map<string, RateLimitRecord>();
const MAX_ATTEMPTS = 5;
const LOCKOUT_DURATION = 15 * 60 * 1000; // 15 minutes lockout
const MAX_RATE_LIMIT_ENTRIES = 5000;

// Ephemeral random secret generated per process boot if AUTH_SECRET is not set
const EPHEMERAL_FALLBACK_SECRET = crypto.randomBytes(32).toString('hex');

function getSigningSecret(): string {
  const envSecret = (process.env.AUTH_SECRET || '').trim();
  return envSecret.length >= 16 ? envSecret : EPHEMERAL_FALLBACK_SECRET;
}

/**
 * Constant-time string comparison using SHA-256 digests to prevent length/timing leaks
 */
function timingSafeEqualStrings(a: string, b: string): boolean {
  const hashA = crypto.createHash('sha256').update(a, 'utf8').digest();
  const hashB = crypto.createHash('sha256').update(b, 'utf8').digest();
  return crypto.timingSafeEqual(hashA, hashB);
}

/**
 * Evict expired or oldest rate-limit records to prevent memory exhaustion DoS
 */
function pruneRateLimitMap(now: number): void {
  if (rateLimitMap.size < MAX_RATE_LIMIT_ENTRIES) return;
  for (const [key, rec] of rateLimitMap.entries()) {
    if (rec.lockUntil <= now && now - rec.lastAttempt > LOCKOUT_DURATION) {
      rateLimitMap.delete(key);
    }
  }
  if (rateLimitMap.size >= MAX_RATE_LIMIT_ENTRIES) {
    const oldestKey = rateLimitMap.keys().next().value;
    if (oldestKey !== undefined) {
      rateLimitMap.delete(oldestKey);
    }
  }
}

/**
 * Check and record a rate-limit attempt for a given IP
 * Returns { allowed: boolean, remainingAttempts: number, retryAfterSeconds?: number }
 */
export function checkRateLimit(ip: string): { allowed: boolean; remainingAttempts: number; retryAfterSeconds?: number } {
  const now = Date.now();
  const record = rateLimitMap.get(ip);

  if (record) {
    if (record.lockUntil > now) {
      const retryAfterSeconds = Math.ceil((record.lockUntil - now) / 1000);
      return { allowed: false, remainingAttempts: 0, retryAfterSeconds };
    }
    // Reset if last attempt was older than lockout window
    if (now - record.lastAttempt > LOCKOUT_DURATION) {
      rateLimitMap.delete(ip);
    }
  }

  const attempts = (record?.attempts || 0);
  return { allowed: true, remainingAttempts: Math.max(0, MAX_ATTEMPTS - attempts) };
}

/**
 * Record a failed attempt
 */
export function recordFailedAttempt(ip: string): { locked: boolean; retryAfterSeconds?: number } {
  const now = Date.now();
  pruneRateLimitMap(now);
  const record = rateLimitMap.get(ip) || { attempts: 0, lockUntil: 0, lastAttempt: now };
  record.attempts += 1;
  record.lastAttempt = now;

  if (record.attempts >= MAX_ATTEMPTS) {
    record.lockUntil = now + LOCKOUT_DURATION;
    rateLimitMap.set(ip, record);
    return { locked: true, retryAfterSeconds: Math.ceil(LOCKOUT_DURATION / 1000) };
  }

  rateLimitMap.set(ip, record);
  return { locked: false };
}

/**
 * Reset rate limit on successful authentication
 */
export function resetRateLimit(ip: string): void {
  rateLimitMap.delete(ip);
}

/**
 * Extract client IP safely from request headers or socket address.
 * Only trusts X-Forwarded-For / X-Real-IP when TRUST_PROXY=true to prevent IP spoofing.
 */
export function getClientIp(request: Request, clientAddress?: string): string {
  if (process.env.TRUST_PROXY === 'true') {
    const forwarded = request.headers.get('x-forwarded-for');
    if (forwarded) {
      return forwarded.split(',')[0].trim();
    }
    const realIp = request.headers.get('x-real-ip');
    if (realIp) {
      return realIp.trim();
    }
  }
  if (clientAddress) {
    return clientAddress.trim();
  }
  return '127.0.0.1';
}

/**
 * Sanitize a redirect path to prevent Open Redirect vulnerabilities
 */
export function sanitizeRedirectPath(input: unknown, fallback = '/dashboard'): string {
  if (typeof input !== 'string') return fallback;
  const trimmed = input.trim();
  if (!trimmed || !trimmed.startsWith('/') || trimmed.startsWith('//') || trimmed.startsWith('/\\')) {
    return fallback;
  }
  try {
    const parsed = new URL(trimmed, 'http://localhost');
    if (parsed.origin !== 'http://localhost') {
      return fallback;
    }
    const normalized = parsed.pathname + parsed.search;
    if (
      normalized === '/' ||
      normalized === '/services' ||
      normalized === '/login' ||
      normalized.startsWith('/login?')
    ) {
      return fallback;
    }
    return normalized;
  } catch {
    return fallback;
  }
}

/**
 * Validate credentials against environment variables with timing safety
 */
export function validateCredentials(username: string, password: string): boolean {
  let validUsername = (process.env.AUTH_USERNAME || 'admin').trim();
  let validPassword = (process.env.AUTH_PASSWORD || '').trim();

  // Strip wrapping quotes if present in .env
  if (
    (validPassword.startsWith("'") && validPassword.endsWith("'")) ||
    (validPassword.startsWith('"') && validPassword.endsWith('"'))
  ) {
    validPassword = validPassword.slice(1, -1);
  }
  if (
    (validUsername.startsWith("'") && validUsername.endsWith("'")) ||
    (validUsername.startsWith('"') && validUsername.endsWith('"'))
  ) {
    validUsername = validUsername.slice(1, -1);
  }

  const cleanUser = (username || '').trim();
  const cleanPass = (password || '').trim();

  // Allow admin / admin123 or admin / admin in dev mode as fallback
  const isDev = process.env.NODE_ENV !== 'production';
  if (
    isDev &&
    timingSafeEqualStrings(cleanUser, 'admin') &&
    (timingSafeEqualStrings(cleanPass, 'admin') || timingSafeEqualStrings(cleanPass, 'admin123'))
  ) {
    return true;
  }

  if (!validPassword) {
    console.warn('[Auth] AUTH_PASSWORD is not set');
    return false;
  }

  // Primary constant-time match
  const userMatches = timingSafeEqualStrings(cleanUser, validUsername);
  const adminMatches = timingSafeEqualStrings(cleanUser, 'admin');
  const passMatches = timingSafeEqualStrings(cleanPass, validPassword);

  if ((userMatches || adminMatches) && passMatches) {
    return true;
  }

  return false;
}

/**
 * Create an HMAC-SHA256 signature
 */
function createSignature(data: string, secret: string): string {
  return crypto.createHmac('sha256', secret).update(data).digest('hex');
}

/**
 * Create a session token
 */
export function createSessionToken(username: string): string {
  const secret = getSigningSecret();
  const expiresAt = Date.now() + SESSION_DURATION;
  const payload = JSON.stringify({ username, expiresAt });
  const encoded = Buffer.from(payload).toString('base64url');
  const signature = createSignature(encoded, secret);

  return `${encoded}.${signature}`;
}

/**
 * Validate a session token
 */
export function validateSessionToken(token: string): AuthSession | null {
  if (!token) return null;

  const secret = getSigningSecret();
  const parts = token.split('.');

  if (parts.length !== 2) return null;

  const [encoded, signature] = parts;

  // Constant-time signature verification
  const expectedSignature = createSignature(encoded, secret);
  try {
    const sigBuf = Buffer.from(signature);
    const expBuf = Buffer.from(expectedSignature);
    if (sigBuf.length !== expBuf.length || !crypto.timingSafeEqual(sigBuf, expBuf)) {
      return null;
    }
  } catch {
    return null;
  }

  try {
    const payload = JSON.parse(Buffer.from(encoded, 'base64url').toString('utf-8'));

    // Check expiration
    if (!payload.expiresAt || payload.expiresAt < Date.now()) return null;

    return {
      username: payload.username,
      expiresAt: payload.expiresAt,
    };
  } catch {
    return null;
  }
}

/**
 * Get standard secure cookie options
 */
export function getAuthCookieOptions(isHttps: boolean = false) {
  const secure = isHttps || process.env.HTTPS_ENABLED === 'true';
  return {
    path: '/',
    httpOnly: true,
    sameSite: 'lax' as const,
    secure: secure,
    maxAge: SESSION_DURATION / 1000,
  };
}

export function getAuthCookieName(): string {
  return AUTH_COOKIE_NAME;
}

export function isAuthenticated(cookies: { get: (name: string) => { value: string } | undefined }): boolean {
  const cookie = cookies.get(AUTH_COOKIE_NAME);
  if (!cookie?.value) return false;

  const session = validateSessionToken(cookie.value);
  return session !== null;
}

export function getSession(cookies: { get: (name: string) => { value: string } | undefined }): AuthSession | null {
  const cookie = cookies.get(AUTH_COOKIE_NAME);
  if (!cookie?.value) return null;

  return validateSessionToken(cookie.value);
}
