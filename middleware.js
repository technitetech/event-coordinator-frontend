import { NextResponse } from "next/server";

/**
 * Edge middleware — runs before every matched request.
 *
 * Responsibilities:
 *   1. Inject security headers on every response
 *   2. Redirect unauthenticated requests to /admin/login
 *      (belt-and-suspenders; each admin Server Action also calls requireAdmin())
 *
 * Rate limiting and per-route auth are handled inside application code
 * (lib/rate-limiter.js, requireAdmin()) so they work regardless of whether
 * a reverse proxy forwards requests through this middleware.
 */

const SESSION_COOKIE = "sl_session";

// Security headers applied to every response
const SECURITY_HEADERS = {
  // Prevent browsers from sniffing the content type away from the declared one
  "X-Content-Type-Options": "nosniff",
  // Deny framing by any other origin (clickjacking protection)
  "X-Frame-Options": "DENY",
  // Force HTTPS in browsers that support it (1 year, include sub-domains)
  "Strict-Transport-Security": "max-age=31536000; includeSubDomains",
  // Opt out of Google's FLoC / Topics API
  "Permissions-Policy": "camera=(), microphone=(), geolocation=()",
  // Referrer policy — don't leak the full URL to third-party resources
  "Referrer-Policy": "strict-origin-when-cross-origin",
};

export function middleware(request) {
  const { pathname } = request.nextUrl;
  const response = NextResponse.next();

  // ── 1. Security headers ────────────────────────────────────────────────────
  for (const [header, value] of Object.entries(SECURITY_HEADERS)) {
    response.headers.set(header, value);
  }

  // ── 2. Admin route protection ──────────────────────────────────────────────
  // The /admin/(panel) group requires an active session cookie.
  // We only check for the cookie's presence here (not the JWT signature) to
  // keep middleware fast. The real auth enforcement is in requireAdmin() which
  // verifies the signature AND re-reads the user row from the DB on every call.
  if (pathname.startsWith("/admin") && !pathname.startsWith("/admin/login")) {
    const sessionCookie = request.cookies.get(SESSION_COOKIE);
    if (!sessionCookie?.value) {
      const loginUrl = request.nextUrl.clone();
      loginUrl.pathname = "/admin/login";
      return NextResponse.redirect(loginUrl);
    }
  }

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all paths except:
     * - _next/static  (static asset files)
     * - _next/image   (optimised images)
     * - favicon.ico / robots.txt / sitemap.xml (well-known files)
     */
    "/((?!_next/static|_next/image|favicon.ico|robots.txt|sitemap.xml).*)",
  ],
};
