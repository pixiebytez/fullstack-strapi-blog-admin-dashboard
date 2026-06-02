'use strict';

/**
 * Policy: is-owner
 *
 * Ensures the authenticated user is the owner of the resource
 * they are trying to modify. Used on blog update/delete routes.
 *
 * Usage in route config:
 *   policies: ['global::is-owner']
 */

module.exports = async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;

  if (!user) {
    policyContext.forbidden('You must be logged in');
    return false;
  }

  // Admins bypass ownership check
  if (user.role?.type === 'administrator' || user.role?.type === 'moderator') {
    return true;
  }

  const { id }        = policyContext.params;
  const contentType   = config.contentType || 'api::blog.blog';
  const ownerField    = config.ownerField   || 'author';

  if (!id) return true; // No ID = create action, allow

  const entity = await strapi.db.query(contentType).findOne({
    where:   { id },
    populate: { [ownerField]: { select: ['id'] } },
  });

  if (!entity) {
    policyContext.notFound('Resource not found');
    return false;
  }

  const ownerId = entity[ownerField]?.id;

  if (String(ownerId) !== String(user.id)) {
    policyContext.forbidden('You do not have permission to modify this resource');
    return false;
  }

  return true;
};
