describe('second tests suite', () => {
    it('visit apify store', () => {
        cy.visit('https://apify.com/store');
        cy.log('Visiting Apify Store');
        cy.contains('h5', 'Web Scraper').should('exist');
    // todo test more?
    });
});
