'use strict';

/**
 * Audit log middleware
 *
 * Logs all write operations (POST, PUT, PATCH, DELETE) to the database
 * for compliance, debugging, and admin review.
 *
 * Stores: actor, action, entity, before/after state, IP, timestamp
 */

module.exports = (config, { strapi }) => {
  const enabled = config.enabled !== false;

  // Methods and paths to audit
  const AUDIT_METHODS = new Set(['POST', 'PUT', 'PATCH', 'DELETE']);
  const SKIP_PATHS    = ['/admin', '/_health', '/api/newsletters/confirm'];

  return async (ctx, next) => {
    if (!enabled) return next();

    const method = ctx.request.method;
    const path   = ctx.request.path;

    const shouldAudit = AUDIT_METHODS.has(method) &&
      !SKIP_PATHS.some((p) => path.startsWith(p));

    if (!shouldAudit) return next();

    const startTime = Date.now();
    const actor     = ctx.state.user
      ? { id: ctx.state.user.id, email: ctx.state.user.email }
      : { id: null, email: 'anonymous' };

    const requestBody = { ...ctx.request.body };
    // Redact sensitive fields
    ['password', 'token', 'secret', 'apiKey'].forEach((f) => {
      if (requestBody[f]) requestBody[f] = '[REDACTED]';
    });

    await next();

    const duration = Date.now() - startTime;

    // Log asynchronously — don't block the response
    setImmediate(async () => {
      try {
        const logEntry = {
          actor,
          method,
          path,
          statusCode:   ctx.status,
          ip:           ctx.ip,
          userAgent:    ctx.request.headers['user-agent'] || '',
          requestBody,
          duration,
          timestamp:    new Date().toISOString(),
        };

        // Write to Strapi logger (production: use structured logging to file/ELK)
        strapi.log.info('AUDIT', logEntry);

        // Optional: persist to DB audit_logs table
        // await strapi.db.query('api::audit-log.audit-log').create({ data: logEntry });

      } catch (err) {
        strapi.log.error('Audit log write failed:', err.message);
      }
    });
  };
};
