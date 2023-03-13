describe('second tests suite', () => {
    it('visit apify store', () => {
        cy.visit('/store');
        cy.log('Visiting Apify Store, clicking on actor');
        cy.contains('.ActorStoreItem-title', 'Web Scraper').should('be.visible').click();
        cy.log('Asserting store actor redirect');
        cy.url().should('eq', 'https://apify.com/apify/web-scraper');
    });
});
