'use strict';

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::category.category', ({ strapi }) => ({

  // GET /api/categories — include blog count
  async find(ctx) {
    const categories = await strapi.db.query('api::category.category').findMany({
      populate: {
        image:   { select: ['url', 'alternativeText'] },
        seoMeta: true,
      },
    });

    // Attach blog count to each category
    const withCounts = await Promise.all(
      categories.map(async (cat) => {
        const count = await strapi.db.query('api::blog.blog').count({
          where: { category: cat.id, publishedAt: { $notNull: true } },
        });
        return { ...cat, blogCount: count };
      })
    );

    const sanitized = await this.sanitizeOutput(withCounts, ctx);
    return this.transformResponse(sanitized);
  },

  // GET /api/categories/:slug — category with paginated blogs
  async findBySlug(ctx) {
    const { slug } = ctx.params;
    const { page = 1, pageSize = 10 } = ctx.query;

    const category = await strapi.db.query('api::category.category').findOne({
      where:   { slug },
      populate: { image: true, seoMeta: true },
    });

    if (!category) return ctx.notFound('Category not found');

    const [blogs, total] = await Promise.all([
      strapi.db.query('api::blog.blog').findMany({
        where:   { category: category.id, publishedAt: { $notNull: true } },
        orderBy: { publishedDate: 'desc' },
        limit:   parseInt(pageSize),
        offset:  (parseInt(page) - 1) * parseInt(pageSize),
        populate: {
          featuredImage: { select: ['url', 'alternativeText'] },
          author:   { select: ['username', 'firstName', 'lastName'] },
          tags:     { select: ['name', 'slug'] },
        },
      }),
      strapi.db.query('api::blog.blog').count({
        where: { category: category.id, publishedAt: { $notNull: true } },
      }),
    ]);

    return ctx.send({
      data: { category, blogs },
      meta: {
        pagination: {
          page: parseInt(page),
          pageSize: parseInt(pageSize),
          total,
          pageCount: Math.ceil(total / parseInt(pageSize)),
        },
      },
    });
  },

}));
