'use strict';

/**
 * Policy: is-admin
 * Restricts access to users with the administrator or moderator role.
 */

module.exports = async (policyContext, config, { strapi }) => {
  const { user } = policyContext.state;

  if (!user) {
    policyContext.unauthorized('Authentication required');
    return false;
  }

  // Load full user with role
  const fullUser = await strapi.db.query('plugin::users-permissions.user').findOne({
    where:   { id: user.id },
    populate: { role: true },
  });

  const allowedRoles = ['administrator', 'moderator', ...(config.roles || [])];

  if (!allowedRoles.includes(fullUser?.role?.type)) {
    policyContext.forbidden('Insufficient permissions');
    return false;
  }

  return true;
};
