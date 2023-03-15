describe('first tests suite', () => {
    it('visit Apify main page', () => {
        cy.visit('/');
        cy.log('Visiting Apify main page');
        cy.contains('div', 'Apify').should('exist');
    });
});
