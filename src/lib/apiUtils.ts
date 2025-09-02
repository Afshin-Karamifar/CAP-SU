/**
 * Get the base URL for API requests
 * In development: returns empty string to use Vite proxy
 * In production: returns the Vercel serverless function proxy
 */
export const getApiBaseUrl = (): string => {
  // In development, use empty string to leverage Vite proxy
  if (import.meta.env.DEV) {
    return '';
  }

  // In production, use Vercel serverless function proxy
  return '/api/proxy?path=';
};

/**
 * Build a complete API URL
 * @param path - The API path (e.g., '/rest/api/3/project')
 * @returns Complete URL for the API request
 */
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();

  if (import.meta.env.DEV) {
    // Development: return path as-is for Vite proxy
    return `${baseUrl}${path}`;
  } else {
    // Production: encode the path for the serverless function
    return `${baseUrl}${encodeURIComponent(path)}`;
  }
};
