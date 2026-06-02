'use strict';

/**
 * Strapi application entry point
 * Registers: cron jobs, global error handlers, startup tasks
 */

const cron = require('node-cron');

module.exports = {

  /**
   * Called before application bootstrap.
   * Register custom services, plugins, or global config here.
   */
  register({ strapi }) {
    // Register custom GraphQL resolvers (extend schema)
    if (strapi.plugin('graphql')) {
      const extensionService = strapi.plugin('graphql').service('extension');
      extensionService.use(({ nexus }) => ({
        types: [
          nexus.extendType({
            type: 'Query',
            definition(t) {
              t.field('trendingBlogs', {
                type:     nexus.list('BlogEntityResponse'),
                args:     { limit: nexus.intArg({ default: 10 }) },
                resolve:  async (_root, args, ctx) => {
                  return strapi.controller('api::blog.blog').trending({ ...ctx, query: { limit: args.limit } });
                },
              });
            },
          }),
        ],
      }));
    }
  },

  /**
   * Called after application is fully bootstrapped.
   * Start cron jobs and run migrations.
   */
  async bootstrap({ strapi }) {
    strapi.log.info('🚀 AI Blog CMS starting up...');

    // ----------------------------------------------------------
    // CRON: Recalculate trending scores every hour
    // ----------------------------------------------------------
    cron.schedule('0 * * * *', async () => {
      strapi.log.info('CRON: Recalculating trending scores...');
      try {
        await strapi.service('api::blog.blog').recalculateAllTrendingScores();
      } catch (err) {
        strapi.log.error('CRON trending error:', err.message);
      }
    });

    // ----------------------------------------------------------
    // CRON: Send weekly newsletter digest (every Monday 9am)
    // ----------------------------------------------------------
    cron.schedule('0 9 * * 1', async () => {
      strapi.log.info('CRON: Sending weekly newsletter digest...');
      try {
        const subscribers = await strapi.db.query('api::newsletter.newsletter').findMany({
          where: { status: 'subscribed' },
        });

        if (subscribers.length === 0) return;

        const topBlogs = await strapi.db.query('api::blog.blog').findMany({
          where:   { publishedAt: { $notNull: true } },
          orderBy: { viewCount: 'desc' },
          limit:   5,
          select:  ['title', 'slug', 'excerpt'],
        });

        await strapi.service('api::newsletter.newsletter').sendWeeklyDigest(subscribers, topBlogs);
        strapi.log.info(`Newsletter sent to ${subscribers.length} subscribers`);
      } catch (err) {
        strapi.log.error('CRON newsletter error:', err.message);
      }
    });

    // ----------------------------------------------------------
    // Health check endpoint
    // ----------------------------------------------------------
    strapi.server.routes([
      {
        method: 'GET',
        path:   '/_health',
        handler: (ctx) => {
          ctx.body = {
            status:    'ok',
            timestamp: new Date().toISOString(),
            uptime:    process.uptime(),
            memory:    process.memoryUsage(),
          };
        },
        config: { auth: false },
      },
    ]);

    strapi.log.info('✅ AI Blog CMS is ready!');
  },
};
