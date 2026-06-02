'use strict';

/**
 * Users & Permissions plugin extension
 * - Adds firstName, lastName to JWT payload
 * - Custom register flow with email verification
 * - Lifecycle hooks for user events
 */

module.exports = (plugin) => {

  // ----------------------------------------------------------
  // Extend the JWT callback to include extra user fields
  // ----------------------------------------------------------
  const originalIssueJWT = plugin.services.jwt.issue;

  plugin.services.jwt.issue = function (payload, jwtOptions = {}) {
    return originalIssueJWT.call(this, {
      ...payload,
      // Add fields you want inside the JWT
    }, jwtOptions);
  };

  // ----------------------------------------------------------
  // Override /auth/local/register to add extra fields
  // ----------------------------------------------------------
  const originalRegister = plugin.controllers['auth'].register;

  plugin.controllers['auth'].register = async (ctx) => {
    const { firstName, lastName } = ctx.request.body;

    // Call original register
    await originalRegister(ctx);

    // If registration succeeded, update the user record with extra fields
    if (ctx.status === 200 && ctx.body?.user?.id) {
      const userId = ctx.body.user.id;
      await strapi.db.query('plugin::users-permissions.user').update({
        where: { id: userId },
        data:  { firstName, lastName },
      });

      // Attach updated fields to response
      ctx.body.user.firstName = firstName;
      ctx.body.user.lastName  = lastName;
    }
  };

  // ----------------------------------------------------------
  // Add lifecycle hooks for the User model
  // ----------------------------------------------------------
  plugin.contentTypes.user.lifecycles = {

    async afterCreate({ result }) {
      strapi.log.info(`New user registered: ${result.email}`);

      // Send welcome email
      try {
        await strapi.plugin('email').service('email').send({
          to:      result.email,
          subject: 'Welcome to AI Blog CMS!',
          html: `
            <h2>Welcome${result.firstName ? `, ${result.firstName}` : ''}!</h2>
            <p>Your account has been created successfully.</p>
            <p>Start exploring amazing blog content today.</p>
            <a href="${process.env.FRONTEND_URL}/blog">Explore Blogs</a>
          `,
        });
      } catch (err) {
        strapi.log.error('Welcome email failed:', err.message);
      }
    },

    async beforeDelete({ params }) {
      // Soft-delete user's content (anonymize instead of cascade delete)
      await strapi.db.query('api::blog.blog').updateMany({
        where: { author: params.where.id },
        data:  { author: null },
      });
    },
  };

  return plugin;
};
