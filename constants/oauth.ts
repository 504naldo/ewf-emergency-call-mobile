/**
 * OAuth / API configuration
 * This version is simplified for production builds using Railway.
 * We avoid dynamic hostname detection because it breaks inside Expo builds.
 */

/**
 * Your live Railway backend URL.
 * IMPORTANT: Do NOT add a trailing slash.
 */
const API_BASE_URL = "https://ewf-emergency-call-backend-production.up.railway.app";

/**
 * Returns the API base URL used by tRPC / fetch clients.
 */
export function getApiBaseUrl(): string {
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