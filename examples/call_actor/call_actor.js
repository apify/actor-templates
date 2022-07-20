const { Actor } = require('apify');
const { launchPuppeteer } = require('crawlee');

Actor.main(async () => {
    // Launch the web browser.
    const browser = await launchPuppeteer();

    console.log('Obtaining own email address...');
    const apifyClient = Actor.newClient();
    const user = await apifyClient.user().get();

    // Load randomword.com and get a random word
    console.log('Fetching a random word.');
    const page = await browser.newPage();
    await page.goto('https://randomword.com/');
    const randomWord = await page.$eval('#shared_section', (el) => el.outerHTML);

    // Send random word to your email. For that, you can use an actor we already
    // have available on the platform under the name: apify/send-mail.
    // The second parameter to the Apify.call() invocation is the actor's
    // desired input. You can find the required input parameters by checking
    // the actor's documentation page: https://apify.com/apify/send-mail
    console.log(`Sending email to ${user.email}...`);
    await Actor.call('apify/send-mail', {
        to: user.email,
        subject: 'Random Word',
        html: `<h1>Random Word</h1>${randomWord}`,
    });
    console.log('Email sent. Good luck!');

    // Close Browser
    await browser.close();
});
