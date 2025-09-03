import { Request, Response, NextFunction } from "express";

interface CacheEntry {
  data: any;
  timestamp: number;
  ttl: number;
}

interface CacheOptions {
  ttl?: number; // Time to live in milliseconds
  key?: string | ((req: Request) => string);
  condition?: (req: Request) => boolean;
}

class MemoryCache {
  private cache = new Map<string, CacheEntry>();
  private readonly defaultTTL = 5 * 60 * 1000; // 5 minutes

  set(key: string, data: any, ttl?: number): void {
    const entry: CacheEntry = {
      data,
      timestamp: Date.now(),
      ttl: ttl || this.defaultTTL,
    };
    this.cache.set(key, entry);
  }

  get(key: string): any | null {
    const entry = this.cache.get(key);
    if (!entry) return null;

    const now = Date.now();
    if (now - entry.timestamp > entry.ttl) {
      this.cache.delete(key);
      return null;
    }

    return entry.data;
  }

  delete(key: string): void {
    this.cache.delete(key);
  }

  clear(): void {
    this.cache.clear();
  }

  // Clean up expired entries
  cleanup(): void {
    const now = Date.now();
    for (const [key, entry] of this.cache.entries()) {
      if (now - entry.timestamp > entry.ttl) {
        this.cache.delete(key);
      }
    }
  }

  // Get cache statistics
  getStats() {
    return {
      size: this.cache.size,
      keys: Array.from(this.cache.keys()),
    };
  }
}

// Global cache instance
const globalCache = new MemoryCache();

// Cleanup expired entries every minute
setInterval(() => {
  globalCache.cleanup();
}, 60 * 1000);

export function cache(options: CacheOptions = {}) {
  return (req: Request, res: Response, next: NextFunction) => {
    const { ttl = 5 * 60 * 1000, key, condition } = options;

    // Check if caching should be applied
    if (condition && !condition(req)) {
      return next();
    }

    // Generate cache key
    let cacheKey: string;
    if (typeof key === "function") {
      cacheKey = key(req);
    } else if (key) {
      cacheKey = key;
    } else {
      // Default cache key based on URL and query params
      cacheKey = `${req.method}:${req.originalUrl}:${JSON.stringify(
        req.query
      )}`;
    }

    // Check cache
    const cachedData = globalCache.get(cacheKey);
    if (cachedData) {
      return res.json(cachedData);
    }

    // Store original send method
    const originalSend = res.json;

    // Override send method to cache response
    res.json = function (data: any) {
      globalCache.set(cacheKey, data, ttl);
      return originalSend.call(this, data);
    };

    next();
  };
}

// Cache invalidation middleware
export function invalidateCache(pattern: string | RegExp) {
  return (req: Request, res: Response, next: NextFunction) => {
    const stats = globalCache.getStats();
    const keysToDelete = stats.keys.filter((key) => {
      if (typeof pattern === "string") {
        return key.includes(pattern);
      }
      return pattern.test(key);
    });

    keysToDelete.forEach((key) => globalCache.delete(key));

    next();
  };
}

// Cache control headers middleware
export function cacheControl(maxAge: number = 300) {
  return (req: Request, res: Response, next: NextFunction) => {
    res.set("Cache-Control", `public, max-age=${maxAge}`);
    next();
  };
}

// Export cache instance for manual operations
export { globalCache };

// Cache utilities
export const cacheUtils = {
  // Cache user-specific data
  userCache: (userId: string, key: string, data: any, ttl?: number) => {
    const cacheKey = `user:${userId}:${key}`;
    globalCache.set(cacheKey, data, ttl);
  },

  // Get user-specific cached data
  getUserCache: (userId: string, key: string) => {
    const cacheKey = `user:${userId}:${key}`;
    return globalCache.get(cacheKey);
  },

  // Invalidate all user cache
  invalidateUserCache: (userId: string) => {
    const stats = globalCache.getStats();
    const userKeys = stats.keys.filter((key) =>
      key.startsWith(`user:${userId}:`)
    );
    userKeys.forEach((key) => globalCache.delete(key));
  },

  // Cache habit statistics
  habitStatsCache: (habitId: string, data: any, ttl?: number) => {
    const cacheKey = `habit:${habitId}:stats`;
    globalCache.set(cacheKey, data, ttl);
  },

  // Get cached habit statistics
  getHabitStatsCache: (habitId: string) => {
    const cacheKey = `habit:${habitId}:stats`;
    return globalCache.get(cacheKey);
  },

  // Invalidate habit cache
  invalidateHabitCache: (habitId: string) => {
    const stats = globalCache.getStats();
    const habitKeys = stats.keys.filter((key) =>
      key.startsWith(`habit:${habitId}:`)
    );
    habitKeys.forEach((key) => globalCache.delete(key));
  },
};
