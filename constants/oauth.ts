/**
 * OAuth / API configuration
 * This version is simplified for production builds using Railway.
 * We avoid dynamic hostname detection because it breaks inside Expo builds.
 */

/**
 * Your live Railway backend URL.
 * IMPORTANT: Do NOT add a trailing slash.
 */
const RAILWAY_URL = "https://ewf-emergency-call-backend-production.up.railway.app";

// Ensure clean URL with no whitespace or hidden characters
const API_BASE_URL = RAILWAY_URL.trim();

/**
 * Returns the API base URL used by tRPC / fetch clients.
 */
export function getApiBaseUrl(): string {
  console.log("[OAuth] Returning API URL:", API_BASE_URL);
  console.log("[OAuth] URL type:", typeof API_BASE_URL);
  console.log("[OAuth] URL length:", API_BASE_URL.length);
  console.log("[OAuth] First 10 char codes:", Array.from(API_BASE_URL.substring(0, 10)).map(c => c.charCodeAt(0)).join(','));
  return API_BASE_URL;
}

/**
 * Helper to build full endpoint URLs safely.
 */
export function buildApiUrl(path: string): string {
  if (!path.startsWith("/")) {
    path = `/${path}`;
  }
  return `${API_BASE_URL}${path}`;
}
