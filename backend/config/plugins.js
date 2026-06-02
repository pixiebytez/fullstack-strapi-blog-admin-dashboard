/**
 * Strapi plugin configuration
 * Covers: users-permissions, graphql, i18n, email, upload
 */
module.exports = ({ env }) => ({

  // ----------------------------------------------------------
  // GraphQL plugin
  // ----------------------------------------------------------
  graphql: {
    enabled: true,
    config: {
      endpoint:        '/graphql',
      shadowCRUD:      true,
      playgroundAlways: env.bool('GRAPHQL_PLAYGROUND', false),
      depthLimit:       10,
      amountLimit:      100,
      apolloServer: {
        tracing: false,
        introspection: env.bool('GRAPHQL_INTROSPECTION', false),
      },
    },
  },

  // ----------------------------------------------------------
  // Email plugin (Nodemailer / SMTP)
  // ----------------------------------------------------------
  email: {
    config: {
      provider: 'nodemailer',
      providerOptions: {
        host:   env('SMTP_HOST',     'smtp.gmail.com'),
        port:   env.int('SMTP_PORT', 587),
        auth: {
          user: env('SMTP_USERNAME'),
          pass: env('SMTP_PASSWORD'),
        },
        secure: false,
      },
      settings: {
        defaultFrom:     env('SMTP_FROM'),
        defaultReplyTo:  env('SMTP_FROM'),
        defaultFromName: env('SMTP_FROM_NAME', 'AI Blog CMS'),
      },
    },
  },

  // ----------------------------------------------------------
  // Upload plugin (Cloudinary in production, local in dev)
  // ----------------------------------------------------------
  upload: {
    config: {
      provider: env('NODE_ENV') === 'production' ? 'cloudinary' : 'local',
      providerOptions: env('NODE_ENV') === 'production'
        ? {
            cloud_name: env('CLOUDINARY_NAME'),
            api_key:    env('CLOUDINARY_KEY'),
            api_secret: env('CLOUDINARY_SECRET'),
          }
        : {},
      actionOptions: {
        upload:       {},
        uploadStream: {},
        delete:       {},
      },
      breakpoints: {
        xlarge:  1920,
        large:   1000,
        medium:  750,
        small:   500,
        xsmall:  64,
      },
    },
  },

  // ----------------------------------------------------------
  // i18n (Internationalization)
  // ----------------------------------------------------------
  i18n: {
    enabled: true,
    config: {
      defaultLocale: 'en',
      locales:       ['en', 'es', 'fr', 'de'],
    },
  },

  // ----------------------------------------------------------
  // Users & Permissions
  // ----------------------------------------------------------
  'users-permissions': {
    config: {
      jwt: {
        expiresIn: env('JWT_EXPIRES_IN', '7d'),
      },
      jwtSecret:    env('JWT_SECRET'),
      ratelimit: {
        max: env.int('AUTH_RATE_LIMIT_MAX', 10),
      },
      register: {
        allowedFields: ['firstName', 'lastName', 'username'],
      },
    },
  },
});
