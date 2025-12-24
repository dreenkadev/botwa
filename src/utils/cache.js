/**
 * Simple in-memory cache for media metadata
 * Speeds up repeated downloads of the same URL
 */

const cache = new Map();
const CACHE_TTL = 30 * 60 * 1000; // 30 minutes
const MAX_CACHE_SIZE = 100; // Maximum cached items

/**
 * Get cached metadata for a URL
 * @param {string} url - The URL to look up
 * @returns {object|null} Cached metadata or null if not found/expired
 */
function getMetadataCache(url) {
    const key = normalizeUrl(url);
    const cached = cache.get(key);

    if (!cached) return null;

    // Check if expired
    if (Date.now() - cached.timestamp > CACHE_TTL) {
        cache.delete(key);
        return null;
    }

    return cached.data;
}

/**
 * Store metadata in cache
 * @param {string} url - The URL key
 * @param {object} data - The metadata to cache
 */
function setMetadataCache(url, data) {
    const key = normalizeUrl(url);

    // Cleanup old entries if cache is full
    if (cache.size >= MAX_CACHE_SIZE) {
        cleanupCache();
    }

    cache.set(key, {
        data,
        timestamp: Date.now()
    });
}

/**
 * Normalize URL for consistent cache keys
 */
function normalizeUrl(url) {
    try {
        const parsed = new URL(url);
        // Remove tracking parameters
        parsed.searchParams.delete('utm_source');
        parsed.searchParams.delete('utm_medium');
        parsed.searchParams.delete('utm_campaign');
        parsed.searchParams.delete('igshid');
        parsed.searchParams.delete('fbclid');
        return parsed.href.toLowerCase();
    } catch {
        return url.toLowerCase();
    }
}

/**
 * Remove expired entries and oldest entries if still over limit
 */
function cleanupCache() {
    const now = Date.now();

    // Remove expired entries
    for (const [key, value] of cache) {
        if (now - value.timestamp > CACHE_TTL) {
            cache.delete(key);
        }
    }

    // If still over limit, remove oldest entries
    if (cache.size >= MAX_CACHE_SIZE) {
        const entries = [...cache.entries()]
            .sort((a, b) => a[1].timestamp - b[1].timestamp);

        const toRemove = entries.slice(0, Math.floor(MAX_CACHE_SIZE / 2));
        for (const [key] of toRemove) {
            cache.delete(key);
        }
    }
}

/**
 * Clear all cached metadata
 */
function clearMetadataCache() {
    cache.clear();
}

/**
 * Get cache statistics
 */
function getCacheStats() {
    return {
        size: cache.size,
        maxSize: MAX_CACHE_SIZE,
        ttlMinutes: CACHE_TTL / 60000
    };
}

module.exports = {
    getMetadataCache,
    setMetadataCache,
    clearMetadataCache,
    getCacheStats
};
