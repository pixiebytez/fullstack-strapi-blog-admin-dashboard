/**
 * Database configuration for Strapi v5
 * Supports PostgreSQL (production) and SQLite (development fallback)
 */
module.exports = ({ env }) => {
  const client = env('DATABASE_CLIENT', 'postgres');

  const connections = {
    postgres: {
      connection: {
        host:               env('DATABASE_HOST',     'localhost'),
        port:               env.int('DATABASE_PORT', 5432),
        database:           env('DATABASE_NAME',     'aiblog'),
        user:               env('DATABASE_USERNAME', 'aiblog'),
        password:           env('DATABASE_PASSWORD', ''),
        ssl: env.bool('DATABASE_SSL', false)
          ? { rejectUnauthorized: env.bool('DATABASE_SSL_REJECT_UNAUTHORIZED', true) }
          : false,
      },
      pool: {
        min:              env.int('DATABASE_POOL_MIN', 2),
        max:              env.int('DATABASE_POOL_MAX', 10),
        acquireTimeoutMillis: 60000,
        createTimeoutMillis:  30000,
        idleTimeoutMillis:    30000,
        reapIntervalMillis:   1000,
        createRetryIntervalMillis: 2000,
      },
      debug: env.bool('DATABASE_DEBUG', false),
    },

    // SQLite fallback for local dev without Docker
    sqlite: {
      connection: {
        filename: env('DATABASE_FILENAME', '.tmp/data.db'),
      },
      useNullAsDefault: true,
    },
  };

  return {
    connection: {
      client,
      ...connections[client],
      acquireConnectionTimeout: env.int('DATABASE_CONNECTION_TIMEOUT', 60000),
    },
  };
};
