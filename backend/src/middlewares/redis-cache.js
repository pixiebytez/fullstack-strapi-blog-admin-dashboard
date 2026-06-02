'use strict';

/**
 * Redis caching middleware
 *
 * Caches GET responses for public read-only routes.
 * Cache is automatically invalidated on POST/PUT/PATCH/DELETE.
 *
 * Cache key format: `cache:<METHOD>:<PATH>:<QUERY_STRING>`
 */

const { Redis } = require('ioredis');

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      host:     process.env.REDIS_HOST     || 'localhost',
      port:     parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db:       parseInt(process.env.REDIS_DB || '0'),
    });
    redisClient.on('error', (err) => console.warn('Redis cache error:', err.message));
  }
  return redisClient;
}

// Routes that should be cached
const CACHEABLE_PATHS = [
  /^\/api\/blogs(\/|$)/,
  /^\/api\/categories(\/|$)/,
  /^\/api\/tags(\/|$)/,
];

// Routes that invalidate cache on write
const INVALIDATION_MAP = {
  '/api/blogs':      'cache:GET:/api/blogs*',
  '/api/categories': 'cache:GET:/api/categories*',
  '/api/tags':       'cache:GET:/api/tags*',
};

module.exports = (config, { strapi }) => {
  const enabled = config.enabled !== false;
  const ttl     = config.ttl || 300; // 5 minutes default

  return async (ctx, next) => {
    if (!enabled) return next();

    const method = ctx.request.method;
    const path   = ctx.request.path;

    // --- Cache reads (GET) ------------------------------------
    if (method === 'GET' && CACHEABLE_PATHS.some((r) => r.test(path))) {
      const qs  = new URLSearchParams(ctx.request.query).toString();
      const key = `cache:GET:${path}${qs ? ':' + qs : ''}`;

      try {
        const cached = await getRedis().get(key);
        if (cached) {
          ctx.set('X-Cache', 'HIT');
          ctx.set('Content-Type', 'application/json');
          ctx.body = JSON.parse(cached);
          return;
        }
      } catch (err) {
        strapi.log.warn('Redis cache read error:', err.message);
      }

      await next();

      // Store response in cache
      if (ctx.status === 200 && ctx.body) {
        try {
          await getRedis().setex(key, ttl, JSON.stringify(ctx.body));
          ctx.set('X-Cache', 'MISS');
        } catch (err) {
          strapi.log.warn('Redis cache write error:', err.message);
        }
      }
      return;
    }

    // --- Cache invalidation on writes --------------------------
    if (['POST', 'PUT', 'PATCH', 'DELETE'].includes(method)) {
      await next();

      // Find matching invalidation pattern
      const matchedKey = Object.keys(INVALIDATION_MAP).find((k) => path.startsWith(k));
      if (matchedKey) {
        try {
          const pattern = INVALIDATION_MAP[matchedKey];
          const keys    = await getRedis().keys(pattern);
          if (keys.length) await getRedis().del(...keys);
          strapi.log.debug(`Cache invalidated: ${keys.length} keys matching ${pattern}`);
        } catch (err) {
          strapi.log.warn('Redis cache invalidation error:', err.message);
        }
      }
      return;
    }

    await next();
  };
};
