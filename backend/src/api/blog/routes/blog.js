'use strict';

/**
 * Blog routes
 * Combines core CRUD routes with custom endpoints
 */

const { createCoreRouter } = require('@strapi/strapi').factories;

module.exports = createCoreRouter('api::blog.blog');
