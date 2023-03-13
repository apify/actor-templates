describe('first tests suite', () => {
    it('visit Apify main page', () => {
        cy.visit('/');
        cy.log('Visiting Apify main page');
        cy.contains('h1', 'Build reliable web scrapers. Fast.').should('exist');
    });
});
