describe('first tests suite', () => {
    it('visits the homepage', () => {
        // `baseUrl` is configured in cypress.config.js (and overridable from the
        // Actor input), so cy.visit('/') hits whatever site you point it at.
        cy.visit('/');
        cy.log('Visiting the homepage');
        cy.contains('h1', 'Example Domain').should('be.visible');
    });
});
