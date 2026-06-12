describe('second tests suite', () => {
    it('finds the outbound link', () => {
        cy.visit('/');
        cy.log('Locating the outbound link by its target');
        // Select the link by its href attribute rather than its text. This is
        // robust to copy changes on the page (the visible label may differ) and
        // demonstrates asserting on an attribute instead of clicking through to
        // another domain, which Cypress restricts across origins.
        cy.get('a[href*="iana.org"]').should('be.visible');
    });
});
