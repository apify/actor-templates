// ***********************************************************
// This example support/e2e.js is processed and
// loaded automatically before your other test files.
//
// This is a great place to put global configuration and
// behavior that modifies Cypress.
//
// You can change the location of this file or turn off
// automatically serving support files with the
// 'supportFile' configuration option.
//
// You can read more here:
// https://on.cypress.io/guides/configuration#section-global
// ***********************************************************

// By default Cypress fails the test if the visited page throws an uncaught
// exception (e.g. a minified React hydration error like #418:
// https://react.dev/errors/418). For an end-to-end demo we only care that the
// page loads and our assertions pass, not that the site's own JavaScript is
// bug-free, so we swallow page-level exceptions and let the test continue.
// Remove this if you want your own tests to fail on the visited site's errors.
Cypress.on('uncaught:exception', () => false);
