'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

// Simple spam keywords list (extend as needed)
const SPAM_KEYWORDS = [
  'casino', 'free money', 'click here', 'buy now', 'cheap', 'discount',
  'viagra', 'crypto', 'bitcoin', 'make money fast', 'winner',
];

module.exports = createCoreService('api::comment.comment', ({ strapi }) => ({

  /**
   * Heuristic spam score (0 = clean, 1 = spam)
   * Checks: keyword matches, URL density, all-caps ratio
   */
  async calculateSpamScore(content) {
    let score = 0;
    const lower = content.toLowerCase();

    // Keyword check
    const keywordHits = SPAM_KEYWORDS.filter((kw) => lower.includes(kw)).length;
    score += Math.min(keywordHits * 0.2, 0.6);

    // URL density — more than 2 URLs = suspicious
    const urlCount = (content.match(/https?:\/\//gi) || []).length;
    if (urlCount > 2) score += 0.3;

    // All-caps ratio
    const letters = content.replace(/[^a-zA-Z]/g, '');
    if (letters.length > 10) {
      const capsRatio = (letters.match(/[A-Z]/g) || []).length / letters.length;
      if (capsRatio > 0.7) score += 0.2;
    }

    // Very short or repetitive content
    if (content.trim().length < 5) score += 0.5;

    return Math.min(parseFloat(score.toFixed(2)), 1);
  },

}));
