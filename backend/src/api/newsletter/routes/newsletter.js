'use strict';

module.exports = {
  routes: [
    {
      method:  'POST',
      path:    '/newsletters/subscribe',
      handler: 'newsletter.subscribe',
      config:  { auth: false, description: 'Subscribe to newsletter' },
    },
    {
      method:  'GET',
      path:    '/newsletters/confirm',
      handler: 'newsletter.confirm',
      config:  { auth: false, description: 'Confirm newsletter subscription' },
    },
    {
      method:  'GET',
      path:    '/newsletters/unsubscribe',
      handler: 'newsletter.unsubscribe',
      config:  { auth: false, description: 'Unsubscribe from newsletter' },
    },
  ],
};
