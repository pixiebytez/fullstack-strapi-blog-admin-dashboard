/**
 * Strapi server configuration
 * Manages host, port, app keys, and admin settings
 */
module.exports = ({ env }) => ({
  host:    env('HOST', '0.0.0.0'),
  port:    env.int('PORT', 1337),
  app: {
    keys: env.array('APP_KEYS'),
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  admin: {
    // Admin panel is served at /admin
    url: '/admin',
    serveAdminPanel: env.bool('SERVE_ADMIN', true),
    autoOpen: false,
    watchIgnoreFiles: ['./node_modules', './.cache'],
    host: env('HOST', '0.0.0.0'),
    port: env.int('PORT', 1337),
    auth: {
      secret: env('ADMIN_JWT_SECRET'),
    },
    apiToken: {
      salt: env('API_TOKEN_SALT'),
    },
    transfer: {
      token: {
        salt: env('TRANSFER_TOKEN_SALT'),
      },
    },
    forgotPassword: {
      from:    env('SMTP_FROM'),
      replyTo: env('SMTP_FROM'),
    },
  },
});
