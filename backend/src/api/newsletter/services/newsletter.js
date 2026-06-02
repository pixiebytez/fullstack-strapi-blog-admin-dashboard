'use strict';

const { createCoreService } = require('@strapi/strapi').factories;

module.exports = createCoreService('api::newsletter.newsletter', ({ strapi }) => ({

  async sendConfirmationEmail({ email, firstName, token }) {
    const confirmUrl = `${process.env.STRAPI_ADMIN_BACKEND_URL}/api/newsletters/confirm?token=${token}`;

    await strapi.plugin('email').service('email').send({
      to:      email,
      subject: 'Confirm your subscription to AI Blog CMS',
      html: `
        <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
          <h2>Welcome${firstName ? `, ${firstName}` : ''}!</h2>
          <p>Thank you for subscribing to AI Blog CMS newsletter.</p>
          <p>Click the button below to confirm your email address:</p>
          <a href="${confirmUrl}"
             style="display: inline-block; padding: 12px 24px; background: #6366f1;
                    color: white; text-decoration: none; border-radius: 6px; margin: 16px 0;">
            Confirm Subscription
          </a>
          <p style="color: #6b7280; font-size: 14px;">
            If you didn't sign up, you can safely ignore this email.
          </p>
        </div>
      `,
    });
  },

  async sendWeeklyDigest(subscribers, blogs) {
    const blogHtml = blogs.map((b) =>
      `<li><a href="${process.env.FRONTEND_URL}/blog/${b.slug}">${b.title}</a></li>`
    ).join('');

    for (const sub of subscribers) {
      const unsubUrl = `${process.env.STRAPI_ADMIN_BACKEND_URL}/api/newsletters/unsubscribe?email=${sub.email}`;
      await strapi.plugin('email').service('email').send({
        to:      sub.email,
        subject: 'AI Blog CMS — Weekly Digest',
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2>This Week's Top Posts</h2>
            <ul>${blogHtml}</ul>
            <hr />
            <p style="color: #6b7280; font-size: 12px;">
              <a href="${unsubUrl}">Unsubscribe</a>
            </p>
          </div>
        `,
      });
    }
  },

}));
