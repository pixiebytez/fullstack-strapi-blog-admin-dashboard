'use strict';

/**
 * Blog controller
 *
 * Extends the default Strapi CRUD controller with:
 * - Slug-based fetching
 * - View count increment
 * - Related posts API
 * - Trending blogs
 * - AI content generation
 * - Search API
 */

const { createCoreController } = require('@strapi/strapi').factories;

module.exports = createCoreController('api::blog.blog', ({ strapi }) => ({

  // ----------------------------------------------------------
  // Override default find — add pagination meta
  // ----------------------------------------------------------
  async find(ctx) {
    const { data, meta } = await super.find(ctx);
    return { data, meta };
  },

  // ----------------------------------------------------------
  // Fetch blog by SLUG instead of ID
  // GET /api/blogs/slug/:slug
  // ----------------------------------------------------------
  async findBySlug(ctx) {
    const { slug } = ctx.params;

    const entity = await strapi.db.query('api::blog.blog').findOne({
      where: { slug, publishedAt: { $notNull: true } },
      populate: {
        featuredImage: true,
        author:    { select: ['id', 'username', 'email', 'firstName', 'lastName'] },
        category:  { select: ['id', 'name', 'slug'] },
        tags:      { select: ['id', 'name', 'slug'] },
        seoMeta:   true,
        openGraph: true,
        comments:  {
          where:   { status: 'approved', parentComment: null },
          orderBy: { createdAt: 'desc' },
          populate: { replies: { where: { status: 'approved' } }, author: true },
        },
        relatedPosts: {
          select:   ['id', 'title', 'slug', 'excerpt', 'publishedDate'],
          populate: { featuredImage: true },
        },
      },
    });

    if (!entity) return ctx.notFound('Blog post not found');

    // Increment view count asynchronously (fire and forget)
    strapi.service('api::blog.blog').incrementViewCount(entity.id);

    const sanitized = await this.sanitizeOutput(entity, ctx);
    return this.transformResponse(sanitized);
  },

  // ----------------------------------------------------------
  // Trending blogs — sorted by trending score
  // GET /api/blogs/trending?limit=10
  // ----------------------------------------------------------
  async trending(ctx) {
    const limit = parseInt(ctx.query.limit) || 10;

    const blogs = await strapi.db.query('api::blog.blog').findMany({
      where:   { publishedAt: { $notNull: true }, isTrending: true },
      orderBy: { trendingScore: 'desc' },
      limit,
      populate: {
        featuredImage: { select: ['url', 'alternativeText'] },
        author:   { select: ['username', 'firstName', 'lastName'] },
        category: { select: ['name', 'slug'] },
      },
    });

    const sanitized = await this.sanitizeOutput(blogs, ctx);
    return this.transformResponse(sanitized);
  },

  // ----------------------------------------------------------
  // Full-text search
  // GET /api/blogs/search?q=keyword&category=slug&tag=slug
  // ----------------------------------------------------------
  async search(ctx) {
    const { q, category, tag, page = 1, pageSize = 10 } = ctx.query;

    if (!q || q.trim().length < 2) {
      return ctx.badRequest('Search query must be at least 2 characters');
    }

    const filters = {
      publishedAt: { $notNull: true },
      $or: [
        { title:   { $containsi: q } },
        { excerpt: { $containsi: q } },
        { content: { $containsi: q } },
      ],
    };

    if (category) filters.category = { slug: category };
    if (tag)      filters.tags     = { slug: { $in: [tag] } };

    const [results, total] = await Promise.all([
      strapi.db.query('api::blog.blog').findMany({
        where:   filters,
        orderBy: { publishedDate: 'desc' },
        limit:   parseInt(pageSize),
        offset:  (parseInt(page) - 1) * parseInt(pageSize),
        populate: {
          featuredImage: { select: ['url', 'alternativeText'] },
          author:   { select: ['username', 'firstName', 'lastName'] },
          category: { select: ['name', 'slug'] },
          tags:     { select: ['name', 'slug'] },
        },
      }),
      strapi.db.query('api::blog.blog').count({ where: filters }),
    ]);

    const sanitized = await this.sanitizeOutput(results, ctx);
    return this.transformResponse(sanitized, {
      pagination: {
        page:      parseInt(page),
        pageSize:  parseInt(pageSize),
        pageCount: Math.ceil(total / parseInt(pageSize)),
        total,
      },
    });
  },

  // ----------------------------------------------------------
  // Related posts for a given blog
  // GET /api/blogs/:id/related?limit=4
  // ----------------------------------------------------------
  async related(ctx) {
    const { id } = ctx.params;
    const limit  = parseInt(ctx.query.limit) || 4;

    const blog = await strapi.db.query('api::blog.blog').findOne({
      where:   { id },
      populate: { category: true, tags: true },
    });

    if (!blog) return ctx.notFound('Blog not found');

    const tagIds = blog.tags?.map((t) => t.id) || [];

    const related = await strapi.db.query('api::blog.blog').findMany({
      where: {
        id:          { $ne: id },
        publishedAt: { $notNull: true },
        $or: [
          { category: blog.category?.id },
          { tags: { id: { $in: tagIds } } },
        ],
      },
      orderBy: { publishedDate: 'desc' },
      limit,
      populate: {
        featuredImage: { select: ['url', 'alternativeText'] },
        author:   { select: ['username', 'firstName', 'lastName'] },
        category: { select: ['name', 'slug'] },
      },
    });

    const sanitized = await this.sanitizeOutput(related, ctx);
    return this.transformResponse(sanitized);
  },

  // ----------------------------------------------------------
  // AI blog generation
  // POST /api/blogs/generate
  // Body: { topic, tone, length, keywords[] }
  // ----------------------------------------------------------
  async generate(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Login required');

    const { topic, tone = 'professional', length = 'medium', keywords = [] } = ctx.request.body;

    if (!topic) return ctx.badRequest('Topic is required');

    try {
      const generated = await strapi.service('api::blog.blog').generateWithAI({
        topic,
        tone,
        length,
        keywords,
      });

      return ctx.send({ data: generated });
    } catch (err) {
      strapi.log.error('AI generation error:', err.message);
      return ctx.internalServerError('AI generation failed. Try again later.');
    }
  },

}));
