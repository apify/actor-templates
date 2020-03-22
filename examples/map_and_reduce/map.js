const Apify = require('apify');

Apify.main(async () => {
    // open default dataset
    const dataSet = await Apify.openDataset();

    // setting items to dataSet
    await dataSet.pushData([
            {
                "url": "https://apify.com/",
                "headingCount": 11,
            },
            {
                "url": "https://apify.com/storage",
                "headingCount": 8,
            },
            {
                "url": "https://apify.com/proxy",
                "headingCount": 4,
            }
        ]);

    // calling map function and filtering through mapped items
    const pagesWithMoreThan5headers = (await dataSet.map(item => item.headingCount)).filter(count => count > 5);

    // saving result of map to default Key-value store
    await Apify.setValue('pages_with_more_than_5_headers', pagesWithMoreThan5headers);
});
