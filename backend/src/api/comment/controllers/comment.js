'use strict';

/**
 * Comment controller
 * Handles: create with spam check, moderate, like, nested replies
 */

const { createCoreController } = require('@strapi/strapi').factories;
const sanitizeHtml = require('sanitize-html');

module.exports = createCoreController('api::comment.comment', ({ strapi }) => ({

  // ----------------------------------------------------------
  // POST /api/comments — Create with spam detection
  // ----------------------------------------------------------
  async create(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Login required to comment');

    const { content, blogId, parentCommentId } = ctx.request.body.data || {};

    if (!content?.trim()) return ctx.badRequest('Comment content is required');
    if (!blogId)          return ctx.badRequest('Blog ID is required');

    // Sanitize input — strip all HTML
    const sanitized = sanitizeHtml(content.trim(), { allowedTags: [], allowedAttributes: {} });

    // Check blog exists and is published
    const blog = await strapi.db.query('api::blog.blog').findOne({
      where: { id: blogId, publishedAt: { $notNull: true } },
    });
    if (!blog) return ctx.notFound('Blog not found');

    // Spam heuristics
    const spamScore = await strapi.service('api::comment.comment').calculateSpamScore(sanitized);
    const status    = spamScore >= 0.8 ? 'spam' : spamScore >= 0.5 ? 'pending' : 'approved';

    const comment = await strapi.db.query('api::comment.comment').create({
      data: {
        content:       sanitized,
        status,
        spamScore,
        ipAddress:     ctx.ip,
        userAgent:     ctx.request.headers['user-agent'],
        author:        ctx.state.user.id,
        blog:          blogId,
        parentComment: parentCommentId || null,
      },
      populate: {
        author: { select: ['id', 'username', 'firstName', 'lastName'] },
      },
    });

    const sanitizedOutput = await this.sanitizeOutput(comment, ctx);
    return ctx.send({
      data: sanitizedOutput,
      meta: { status, message: status === 'approved' ? 'Comment posted' : 'Comment pending moderation' },
    });
  },

  // ----------------------------------------------------------
  // GET /api/comments/blog/:blogId — Approved comments for blog
  // ----------------------------------------------------------
  async findByBlog(ctx) {
    const { blogId } = ctx.params;
    const { page = 1, pageSize = 20 } = ctx.query;

    const [comments, total] = await Promise.all([
      strapi.db.query('api::comment.comment').findMany({
        where: {
          blog:          blogId,
          status:        'approved',
          parentComment: null,
        },
        orderBy: { createdAt: 'desc' },
        limit:   parseInt(pageSize),
        offset:  (parseInt(page) - 1) * parseInt(pageSize),
        populate: {
          author:  { select: ['id', 'username', 'firstName', 'lastName'] },
          replies: {
            where:   { status: 'approved' },
            orderBy: { createdAt: 'asc' },
            populate: { author: { select: ['id', 'username', 'firstName', 'lastName'] } },
          },
        },
      }),
      strapi.db.query('api::comment.comment').count({
        where: { blog: blogId, status: 'approved', parentComment: null },
      }),
    ]);

    const sanitizedOutput = await this.sanitizeOutput(comments, ctx);
    return this.transformResponse(sanitizedOutput, {
      pagination: { page: parseInt(page), pageSize: parseInt(pageSize), total },
    });
  },

  // ----------------------------------------------------------
  // PATCH /api/comments/:id/moderate — Admin moderation
  // ----------------------------------------------------------
  async moderate(ctx) {
    const { id }     = ctx.params;
    const { status } = ctx.request.body;

    const allowed = ['approved', 'rejected', 'spam'];
    if (!allowed.includes(status)) return ctx.badRequest('Invalid status');

    const comment = await strapi.db.query('api::comment.comment').update({
      where: { id },
      data:  { status },
    });

    return ctx.send({ data: comment });
  },

  // ----------------------------------------------------------
  // POST /api/comments/:id/like — Like a comment
  // ----------------------------------------------------------
  async like(ctx) {
    if (!ctx.state.user) return ctx.unauthorized('Login required');

    const { id } = ctx.params;

    await strapi.db.query('api::comment.comment').update({
      where: { id },
      data:  { likeCount: { $increment: 1 } },
    });

    return ctx.send({ message: 'Comment liked' });
  },

}));
