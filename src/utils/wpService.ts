// src/utils/wpService.ts
export const WP_API_URL = (import.meta as any).env?.VITE_WP_API_URL || 'https://your-wordpress-site.com/wp-json';

export interface WPTokenResponse {
  token: string;
  user_email: string;
  user_nicename: string;
  user_display_name: string;
}

const WP_TOKEN_KEY = 'wp_jwt_token';

export const getWpToken = () => typeof window !== 'undefined' ? localStorage.getItem(WP_TOKEN_KEY) : null;
export const setWpToken = (token: string) => { if (typeof window !== 'undefined') localStorage.setItem(WP_TOKEN_KEY, token); };
export const clearWpToken = () => { if (typeof window !== 'undefined') localStorage.removeItem(WP_TOKEN_KEY); };

/**
 * Login to WordPress using JWT Authentication for WP REST API plugin
 */
export async function wpLogin(username: string, password: string): Promise<WPTokenResponse> {
  const response = await fetch(`${WP_API_URL}/jwt-auth/v1/token`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
  });

  if (!response.ok) {
    const errorData = await response.json().catch(() => ({}));
    throw new Error(errorData.message || 'Authentication failed');
  }

  const data: WPTokenResponse = await response.json();
  if (data.token) {
    setWpToken(data.token);
  }
  return data;
}

/**
 * Helper to make authenticated requests to WP REST API
 */
export async function wpFetch(endpoint: string, options: RequestInit = {}) {
  const token = getWpToken();
  const headers = new Headers(options.headers || {});
  
  headers.set('Content-Type', 'application/json');
  if (token) {
    headers.set('Authorization', `Bearer ${token}`);
  }

  const response = await fetch(`${WP_API_URL}${endpoint}`, {
    ...options,
    headers,
  });

  if (!response.ok) {
    if (response.status === 401 || response.status === 403) {
      throw new Error('Unauthorized or token expired. Please log in again.');
    }
    const errorText = await response.text();
    throw new Error(`WordPress API Error: ${response.statusText} - ${errorText}`);
  }

  return response.json();
}

/**
 * Fetch Custom Posts (e.g. reports)
 */
export async function getWpReports(page = 1, perPage = 10) {
  return wpFetch(`/wp/v2/posts?page=${page}&per_page=${perPage}&_embed`);
}

/**
 * Create a new post/report in WordPress
 */
export async function createWpReport(title: string, content: string, status: 'publish' | 'draft' = 'publish') {
  return wpFetch('/wp/v2/posts', {
    method: 'POST',
    body: JSON.stringify({
      title,
      content,
      status,
      // You can add meta fields or ACF fields here as well
    }),
  });
}

/**
 * Update an existing post/report in WordPress
 */
export async function updateWpReport(postId: number, updates: any) {
  return wpFetch(`/wp/v2/posts/${postId}`, {
    method: 'POST', // or PUT
    body: JSON.stringify(updates),
  });
}

/**
 * Fetch Media from WP
 */
export async function getWpMedia(page = 1, perPage = 100) {
  return wpFetch(`/wp/v2/media?page=${page}&per_page=${perPage}`);
}

/**
 * Check WP API Health & Latency
 */
export async function wpCheckHealth() {
  const start = Date.now();
  const data = await wpFetch('/');
  const latency = Date.now() - start;
  return {
    name: data.name || 'WordPress Site',
    description: data.description || '',
    url: data.url || '',
    latency,
    namespaces: data.namespaces || []
  };
}

/**
 * Validate / Refresh JWT Token silently
 */
export async function wpValidateToken() {
  try {
    const res = await wpFetch('/jwt-auth/v1/token/validate', {
      method: 'POST',
    });
    return res;
  } catch (error) {
    // If validation fails, clear token to force re-login
    clearWpToken();
    throw error;
  }
}

