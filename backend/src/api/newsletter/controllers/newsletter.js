'use strict';

/**
 * Newsletter controller
 * Handles: subscribe, confirm, unsubscribe
 */

const { createCoreController } = require('@strapi/strapi').factories;
const crypto = require('crypto');

module.exports = createCoreController('api::newsletter.newsletter', ({ strapi }) => ({

  // ----------------------------------------------------------
  // POST /api/newsletters/subscribe
  // ----------------------------------------------------------
  async subscribe(ctx) {
    const { email, firstName, source } = ctx.request.body;

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return ctx.badRequest('Valid email is required');
    }

    // Check if already subscribed
    const existing = await strapi.db.query('api::newsletter.newsletter').findOne({
      where: { email },
    });

    if (existing?.status === 'subscribed') {
      return ctx.send({ message: 'Already subscribed' });
    }

    const token = crypto.randomBytes(32).toString('hex');

    if (existing) {
      // Re-subscribe
      await strapi.db.query('api::newsletter.newsletter').update({
        where: { id: existing.id },
        data:  { status: 'pending', token, firstName: firstName || existing.firstName },
      });
    } else {
      await strapi.db.query('api::newsletter.newsletter').create({
        data: { email, firstName, status: 'pending', token, source: source || 'website' },
      });
    }

    // Send confirmation email
    await strapi.service('api::newsletter.newsletter').sendConfirmationEmail({ email, firstName, token });

    return ctx.send({ message: 'Please check your email to confirm subscription' });
  },

  // ----------------------------------------------------------
  // GET /api/newsletters/confirm?token=xxx
  // ----------------------------------------------------------
  async confirm(ctx) {
    const { token } = ctx.query;

    if (!token) return ctx.badRequest('Token is required');

    const subscriber = await strapi.db.query('api::newsletter.newsletter').findOne({
      where: { token },
    });

    if (!subscriber) return ctx.notFound('Invalid or expired token');

    await strapi.db.query('api::newsletter.newsletter').update({
      where: { id: subscriber.id },
      data:  { status: 'subscribed', confirmedAt: new Date(), token: null },
    });

    // Redirect to frontend with success
    return ctx.redirect(`${process.env.FRONTEND_URL}/newsletter/success`);
  },

  // ----------------------------------------------------------
  // GET /api/newsletters/unsubscribe?token=xxx
  // ----------------------------------------------------------
  async unsubscribe(ctx) {
    const { email } = ctx.query;

    if (!email) return ctx.badRequest('Email is required');

    await strapi.db.query('api::newsletter.newsletter').updateMany({
      where: { email },
      data:  { status: 'unsubscribed', unsubscribedAt: new Date() },
    });

    return ctx.redirect(`${process.env.FRONTEND_URL}/newsletter/unsubscribed`);
  },

}));
