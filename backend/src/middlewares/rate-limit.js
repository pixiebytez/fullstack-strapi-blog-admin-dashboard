'use strict';

/**
 * Custom rate-limit middleware
 * Uses Redis as the store for distributed rate limiting across
 * multiple Strapi instances (horizontal scaling).
 */

const rateLimit   = require('express-rate-limit');
const RedisStore  = require('rate-limit-redis').default;
const { Redis }   = require('ioredis');

let redisClient;

function getRedis() {
  if (!redisClient) {
    redisClient = new Redis({
      host:     process.env.REDIS_HOST     || 'localhost',
      port:     parseInt(process.env.REDIS_PORT || '6379'),
      password: process.env.REDIS_PASSWORD || undefined,
      db:       parseInt(process.env.REDIS_DB || '0'),
      retryStrategy: (times) => Math.min(times * 50, 2000),
    });

    redisClient.on('error', (err) => {
      strapi?.log?.warn('Redis connection error (rate-limit):', err.message);
    });
  }
  return redisClient;
}

module.exports = (config, { strapi }) => {
  const windowMs  = config.windowMs  || 15 * 60 * 1000; // 15 min
  const max       = config.max       || 100;
  const authMax   = config.authMax   || 10;

  // General API limiter
  const apiLimiter = rateLimit({
    windowMs,
    max,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many requests, please try again later.' },
    skip: (req) => {
      // express-rate-limit receives the raw Node request in this setup.
      // Guard against missing req.path to avoid runtime crashes.
      const requestPath = req.path || req.url || '';
      return requestPath.startsWith('/admin') || requestPath === '/health' || requestPath === '/_health';
    },
    store: process.env.NODE_ENV === 'production'
      ? new RedisStore({ sendCommand: (...args) => getRedis().call(...args) })
      : undefined,
  });

  // Stricter auth limiter
  const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max:      authMax,
    standardHeaders: true,
    legacyHeaders:   false,
    message: { error: 'Too many authentication attempts, please try again later.' },
    store: process.env.NODE_ENV === 'production'
      ? new RedisStore({ sendCommand: (...args) => getRedis().call(...args), prefix: 'rl:auth:' })
      : undefined,
  });

  return async (ctx, next) => {
    const path = ctx.request.path;

    // Apply stricter limit for auth endpoints
    const isAuthRoute = /^\/(api\/auth|api\/users-permissions)/.test(path);
    const limiter     = isAuthRoute ? authLimiter : apiLimiter;

    // Express-style middleware wrapped for Koa
    await new Promise((resolve, reject) => {
      limiter(ctx.req, ctx.res, (err) => {
        if (err) return reject(err);
        resolve();
      });
    });

    await next();
  };
};
