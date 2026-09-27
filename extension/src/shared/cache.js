/**
 * SenseWeb AI - Cache Utility Module
 * 
 * Provides URL-keyed caching via chrome.storage.local to minimize
 * redundant API calls. Used by the React popup/sidepanel components.
 * 
 * Content scripts and service worker inline their own cache logic
 * since they can't import ES modules.
 */

const CACHE_PREFIX = 'senseweb_cache_';
const CACHE_TTL_MS = 7 * 24 * 60 * 60 * 1000; // 7 days

/**
 * Retrieves a cached result if it exists and hasn't expired.
 * @param {string} key - Cache key
 * @returns {Promise<any|null>} Cached data or null
 */
export async function getCachedResult(key) {
  const result = await chrome.storage.local.get([key]);
  const data = result[key];

  if (data && data.timestamp && (Date.now() - data.timestamp < CACHE_TTL_MS)) {
    return data.value;
  }

  // Clear expired entry
  if (data) {
    await chrome.storage.local.remove(key);
  }

  return null;
}

/**
 * Stores a result in cache with a timestamp.
 * @param {string} key - Cache key
 * @param {any} value - Data to cache
 */
export async function setCachedResult(key, value) {
  await chrome.storage.local.set({
    [key]: { value, timestamp: Date.now() }
  });
}

/**
 * Generates a unique cache key from URL, type, and optional element hash.
 * @param {string} url - Page or resource URL
 * @param {string} type - Cache type (e.g., 'caption', 'simplify')
 * @param {string} [elementHash=''] - Optional element identifier
 * @returns {string} Cache key
 */
export function generateCacheKey(url, type, elementHash = '') {
  const urlHash = url.split('').reduce((a, b) => {
    a = ((a << 5) - a) + b.charCodeAt(0);
    return a & a;
  }, 0);
  return `${CACHE_PREFIX}${type}_${urlHash}_${elementHash}`;
}

/**
 * Removes all expired cache entries from chrome.storage.local.
 */
export async function clearExpiredCache() {
  const items = await chrome.storage.local.get(null);
  const now = Date.now();
  const keysToRemove = [];

  for (const [key, data] of Object.entries(items)) {
    if (key.startsWith(CACHE_PREFIX) && data.timestamp && (now - data.timestamp >= CACHE_TTL_MS)) {
      keysToRemove.push(key);
    }
  }

  if (keysToRemove.length > 0) {
    await chrome.storage.local.remove(keysToRemove);
  }

  return keysToRemove.length;
}

/**
 * Gets the total size of cached data.
 * @returns {Promise<{count: number, keys: string[]}>}
 */
export async function getCacheStats() {
  const items = await chrome.storage.local.get(null);
  const cacheKeys = Object.keys(items).filter(k => k.startsWith(CACHE_PREFIX));
  return { count: cacheKeys.length, keys: cacheKeys };
}
