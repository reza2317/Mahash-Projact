export interface MediaHealthStatus {
  url: string;
  status: 'ok' | 'error' | 'checking' | 'timeout';
  statusCode?: number;
  lastChecked: number;
}

const healthCache = new Map<string, MediaHealthStatus>();

export const checkMediaHealth = async (url: string): Promise<MediaHealthStatus> => {
  const cached = healthCache.get(url);
  // Don't re-check if checked within the last hour
  if (cached && Date.now() - cached.lastChecked < 3600000) {
    return cached;
  }

  // Skip base64 data URIs
  if (url.startsWith('data:')) {
    return { url, status: 'ok', lastChecked: Date.now() };
  }

  try {
    const res = await fetch('/api/health/probe-url', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ url, timeoutMs: 5000 }),
    });
    
    if (res.ok) {
      const data = await res.json();
      const result: MediaHealthStatus = {
        url,
        status: data.ok ? 'ok' : 'error',
        statusCode: data.status,
        lastChecked: Date.now(),
      };
      healthCache.set(url, result);
      return result;
    }
    
    const result: MediaHealthStatus = {
      url,
      status: 'error',
      statusCode: res.status,
      lastChecked: Date.now(),
    };
    healthCache.set(url, result);
    return result;
  } catch (err: any) {
    const result: MediaHealthStatus = {
      url,
      status: 'error',
      lastChecked: Date.now(),
    };
    healthCache.set(url, result);
    return result;
  }
};
