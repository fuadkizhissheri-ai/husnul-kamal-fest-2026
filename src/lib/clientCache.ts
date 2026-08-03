/**
 * Client-Side In-Memory & SessionStorage Cache Helper
 * Deduplicates in-flight requests and caches responses for fast navigation.
 */

const memoryCache = new Map<string, { data: any; expiry: number }>();
const inFlightRequests = new Map<string, Promise<any>>();

export async function fetchWithCache<T = any>(
  url: string,
  ttlMs: number = 300000 // default 5 minutes cache TTL
): Promise<T> {
  const now = Date.now();
  const cached = memoryCache.get(url);

  // 1. Return valid in-memory cache
  if (cached && now < cached.expiry) {
    return cached.data as T;
  }

  // 2. Return valid sessionStorage cache
  if (typeof window !== 'undefined' && window.sessionStorage) {
    try {
      const stored = sessionStorage.getItem(`hk_cache_${url}`);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed && now < parsed.expiry) {
          memoryCache.set(url, parsed);
          return parsed.data as T;
        }
      }
    } catch (e) {
      // Ignore storage errors
    }
  }

  // 3. Deduplicate duplicate parallel requests (In-Flight Promise reuse)
  if (inFlightRequests.has(url)) {
    return inFlightRequests.get(url) as Promise<T>;
  }

  // 4. Create single network fetch Promise
  const fetchPromise = (async () => {
    try {
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`Failed to fetch ${url}: ${res.statusText}`);
      }
      const data = await res.json();

      const cacheEntry = { data, expiry: Date.now() + ttlMs };
      memoryCache.set(url, cacheEntry);

      if (typeof window !== 'undefined' && window.sessionStorage) {
        try {
          sessionStorage.setItem(`hk_cache_${url}`, JSON.stringify(cacheEntry));
        } catch (e) {
          // Ignore quota errors
        }
      }

      return data as T;
    } finally {
      inFlightRequests.delete(url);
    }
  })();

  inFlightRequests.set(url, fetchPromise);
  return fetchPromise;
}

export function invalidateCache(url?: string) {
  if (url) {
    memoryCache.delete(url);
    inFlightRequests.delete(url);
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        sessionStorage.removeItem(`hk_cache_${url}`);
      } catch (e) {}
    }
  } else {
    memoryCache.clear();
    inFlightRequests.clear();
    if (typeof window !== 'undefined' && window.sessionStorage) {
      try {
        Object.keys(sessionStorage).forEach((key) => {
          if (key.startsWith('hk_cache_')) {
            sessionStorage.removeItem(key);
          }
        });
      } catch (e) {}
    }
  }
}
