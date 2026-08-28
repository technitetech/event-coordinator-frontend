/**
 * Global test setup — runs before every test file.
 *
 * Sets env vars so modules that read process.env at import-time
 * (session.js, freellm.js) get a deterministic test value.
 *
 * Also stubs Next.js-specific packages that throw in non-server test
 * environments: server-only, react-cache, next/headers.
 */

// ── Environment ──────────────────────────────────────────────────────────────
process.env.SESSION_SECRET = "test-secret-1234567890abcdef1234567890abcdef";
process.env.DB_HOST        = "localhost";
process.env.DB_USER        = "root";
process.env.DB_PASSWORD    = "";
process.env.DB_NAME        = "event_coordinator_test";
process.env.FREELLM_API_KEY = "test-key";
