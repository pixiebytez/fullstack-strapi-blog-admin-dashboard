'use strict';

/**
 * Blog service
 *
 * Business logic:
 * - Slug generation
 * - Reading time calculation
 * - View count & trending score update
 * - Related posts computation
 * - AI content generation via OpenAI
 * - Sitemap data
 */

const { createCoreService } = require('@strapi/strapi').factories;
const slugify = require('slugify');
const OpenAI  = require('openai');

let openai;
function getOpenAI() {
  if (!openai) {
    openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
  }
  return openai;
}

module.exports = createCoreService('api::blog.blog', ({ strapi }) => ({

  // ----------------------------------------------------------
  // Generate a unique slug from title
  // ----------------------------------------------------------
  async generateSlug(title, excludeId = null) {
    let base = slugify(title, { lower: true, strict: true, trim: true });
    let slug = base;
    let counter = 1;

    while (true) {
      const existing = await strapi.db.query('api::blog.blog').findOne({
        where: excludeId
          ? { slug, id: { $ne: excludeId } }
          : { slug },
      });
      if (!existing) break;
      slug = `${base}-${counter++}`;
    }
    return slug;
  },

  // ----------------------------------------------------------
  // Calculate reading time in minutes (avg 200 wpm)
  // ----------------------------------------------------------
  calculateReadingTime(content = '') {
    const words = content.replace(/<[^>]*>/g, '').split(/\s+/).filter(Boolean).length;
    return Math.max(1, Math.round(words / 200));
  },

  // ----------------------------------------------------------
  // Increment view count — called on each blog fetch
  // ----------------------------------------------------------
  async incrementViewCount(id) {
    try {
      await strapi.db.query('api::blog.blog').update({
        where: { id },
        data:  { viewCount: { $increment: 1 } },
      });
      // Recalculate trending score after view
      await this.updateTrendingScore(id);
    } catch (err) {
      strapi.log.warn('Failed to increment view count:', err.message);
    }
  },

  // ----------------------------------------------------------
  // Trending score formula:
  //   score = (views * 0.4) + (likes * 0.4) + (comments * 0.2)
  //   decayed by days since published (half-life = 7 days)
  // ----------------------------------------------------------
  async updateTrendingScore(id) {
    const blog = await strapi.db.query('api::blog.blog').findOne({
      where:   { id },
      populate: { comments: { where: { status: 'approved' } } },
    });
    if (!blog) return;

    const daysSincePublished = blog.publishedDate
      ? (Date.now() - new Date(blog.publishedDate).getTime()) / 86400000
      : 0;

    const decayFactor = Math.pow(0.5, daysSincePublished / 7);

    const score =
      ((blog.viewCount  || 0) * 0.4 +
       (blog.likeCount  || 0) * 0.4 +
       (blog.comments?.length || 0) * 0.2) * decayFactor;

    await strapi.db.query('api::blog.blog').update({
      where: { id },
      data: {
        trendingScore: parseFloat(score.toFixed(4)),
        isTrending:    score > 10,
      },
    });
  },

  // ----------------------------------------------------------
  // Bulk update trending scores (run via cron)
  // ----------------------------------------------------------
  async recalculateAllTrendingScores() {
    const blogs = await strapi.db.query('api::blog.blog').findMany({
      where:   { publishedAt: { $notNull: true } },
      select:  ['id'],
    });

    await Promise.allSettled(
      blogs.map((b) => this.updateTrendingScore(b.id))
    );

    strapi.log.info(`Recalculated trending scores for ${blogs.length} blogs`);
  },

  // ----------------------------------------------------------
  // Get sitemap data (published blogs)
  // ----------------------------------------------------------
  async getSitemapData() {
    return strapi.db.query('api::blog.blog').findMany({
      where:   { publishedAt: { $notNull: true } },
      select:  ['slug', 'updatedAt', 'publishedDate'],
      orderBy: { publishedDate: 'desc' },
    });
  },

  // ----------------------------------------------------------
  // AI Content Generation via OpenAI
  // ----------------------------------------------------------
  async generateWithAI({ topic, tone, length, keywords }) {
    const ai = getOpenAI();

    const lengthMap = {
      short:  '300-500 words',
      medium: '800-1200 words',
      long:   '1500-2500 words',
    };

    const prompt = `
Write a ${tone} blog post about "${topic}".
Length: ${lengthMap[length] || lengthMap.medium}.
${keywords.length ? `Include these keywords naturally: ${keywords.join(', ')}.` : ''}

Return a JSON object with these fields:
{
  "title": "SEO-optimized title",
  "excerpt": "2-3 sentence summary (max 160 chars for SEO)",
  "content": "full blog post in markdown",
  "tags": ["tag1", "tag2"],
  "seoMeta": {
    "metaTitle": "title under 60 chars",
    "metaDescription": "description under 160 chars",
    "keywords": "comma separated keywords"
  }
}
Return ONLY valid JSON. No markdown fences.
`.trim();

    const completion = await ai.chat.completions.create({
      model:       process.env.OPENAI_MODEL || 'gpt-4-turbo-preview',
      messages:    [{ role: 'user', content: prompt }],
      max_tokens:  parseInt(process.env.OPENAI_MAX_TOKENS) || 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' },
    });

    const raw = completion.choices[0]?.message?.content || '{}';
    return JSON.parse(raw);
  },

}));
