import { ICacheManager } from "./interface";
import { NoOpCacheManager } from "./noOpCache";
import { RedisCacheManager } from "./redisCache";

let cacheManager: ICacheManager;

/**
 * Initializes the cache manager based on the environment configuration.
 * If a Redis URL is provided, it uses the Redis-based cache. Otherwise, it falls back to a no-op cache.
 * Users can extend this function to add their own custom cache manager.
 * @returns An instance of a class that implements the ICacheManager interface.
 */
const initializeCacheManager = (): ICacheManager => {
  // If you have a Redis instance, the application will use it for caching.
  if (process.env.UPSTASH_REDIS_REST_URL) {
    console.log("Using Redis cache manager.");
    return new RedisCacheManager();
  }

  // To add your own cache manager, you can add a new condition here.
  // For example:
  // if (process.env.MY_CUSTOM_CACHE_URL) {
  //   return new MyCustomCacheManager();
  // }

  // If no cache is configured, the application will use a no-op cache manager
  // that does not persist any data.
  console.log("Using no-op cache manager.");
  return new NoOpCacheManager();
};

/**
 * Returns a singleton instance of the cache manager.
 * This function ensures that the cache manager is initialized only once.
 * @returns An instance of a class that implements the ICacheManager interface.
 */
export const getCacheManager = (): ICacheManager => {
  if (!cacheManager) {
    cacheManager = initializeCacheManager();
  }
  return cacheManager;
};
