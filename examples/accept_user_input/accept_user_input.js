const { Actor } = require('apify');

Actor.main(async () => {
    const input = await Actor.getInput();
    console.log(input);
});
