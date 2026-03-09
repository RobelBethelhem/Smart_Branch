// ===========================================
// Centralized Environment Configuration
// ===========================================
// All URLs are configured via .env.local file.
// To switch between localhost and production:
//   1. Edit .env.local in the project root
//   2. Restart the dev server
// ===========================================

/**
 * Base URL for the Express backend API.
 * Set via NEXT_PUBLIC_API_URL in .env.local
 * Default: http://localhost:5000
 */
export const API_BASE_URL = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

/**
 * Fingerprint WebSocket service URL.
 * Set via NEXT_PUBLIC_FINGERPRINT_WS_URL in .env.local
 * Default: ws://localhost:8089
 */
export const FINGERPRINT_WS_URL = process.env.NEXT_PUBLIC_FINGERPRINT_WS_URL || 'ws://localhost:8089';

// Legacy export for backward compatibility
export const config = { apiBaseUrl: API_BASE_URL };