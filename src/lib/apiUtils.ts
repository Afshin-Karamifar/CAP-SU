/**
 * Get the base URL for API requests
 * In development: returns empty string to use Vite proxy
 * In production: returns the full JIRA domain
 */
export const getApiBaseUrl = (): string => {
  // In development, use empty string to leverage Vite proxy
  if (import.meta.env.DEV) {
    return '';
  }

  // In production, use the full JIRA domain
  const jiraDomain = import.meta.env.VITE_JIRA_DOMAIN;
  if (!jiraDomain) {
    throw new Error('VITE_JIRA_DOMAIN environment variable is required for production builds');
  }

  return jiraDomain;
};

/**
 * Build a complete API URL
 * @param path - The API path (e.g., '/rest/api/3/project')
 * @returns Complete URL for the API request
 */
export const buildApiUrl = (path: string): string => {
  const baseUrl = getApiBaseUrl();
  return `${baseUrl}${path}`;
};
