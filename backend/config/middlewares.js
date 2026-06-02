/**
 * Strapi middleware stack
 * Order matters — listed top to bottom is execution order
 */
module.exports = [
  // Trust proxies (required behind Nginx)
  'strapi::errors',
  {
    name: 'strapi::security',
    config: {
      contentSecurityPolicy: {
        useDefaults: true,
        directives: {
          'connect-src':  ["'self'", 'https:'],
          'img-src':      ["'self'", 'data:', 'blob:', 'res.cloudinary.com', 'market-assets.strapi.io'],
          'media-src':    ["'self'", 'data:', 'blob:', 'res.cloudinary.com'],
          'script-src':   ["'self'", "'unsafe-inline'"],
          upgradeInsecureRequests: null,
        },
      },
      frameguard:  { action: 'sameorigin' },
      hsts:        { maxAge: 31536000, includeSubDomains: true },
      xssFilter:   true,
      noSniff:     true,
      referrerPolicy: { policy: 'same-origin' },
    },
  },
  {
    name: 'strapi::cors',
    config: {
      enabled:     true,
      headers:     '*',
      origin: [
        process.env.FRONTEND_URL || 'http://localhost:3000',
        'http://localhost:3000',
        'http://localhost:1337',
      ],
      methods:     ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'],
      credentials: true,
      keepHeaderOnError: true,
    },
  },
  'strapi::poweredBy',
  {
    name: 'strapi::logger',
    config: {
      level:  process.env.NODE_ENV === 'production' ? 'warn' : 'debug',
      exposeInContext: true,
      requests: true,
    },
  },
  'strapi::query',
  {
    name: 'strapi::body',
    config: {
      formLimit:  '256mb',
      jsonLimit:  '256mb',
      textLimit:  '256mb',
      formidable: {
        maxFileSize: 200 * 1024 * 1024, // 200 MB
      },
    },
  },
  'strapi::session',
  'strapi::favicon',
  'strapi::public',

  // Custom middlewares (registered in src/middlewares/)
  {
    name: 'global::rate-limit',
    config: {
      windowMs: parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'),
      max:      parseInt(process.env.RATE_LIMIT_MAX || '100'),
    },
  },
  {
    name: 'global::redis-cache',
    config: {
      enabled: process.env.NODE_ENV === 'production',
      ttl:     parseInt(process.env.CACHE_TTL_BLOGS || '300'),
    },
  },
  {
    name: 'global::audit-log',
    config: {
      enabled: process.env.AUDIT_LOG_ENABLED === 'true',
    },
  },
];
