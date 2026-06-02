'use strict';

/**
 * Policy: is-authenticated
 * Ensures the request carries a valid JWT token.
 */

module.exports = (policyContext) => {
  if (!policyContext.state.user) {
    policyContext.unauthorized('Authentication required');
    return false;
  }
  return true;
};
