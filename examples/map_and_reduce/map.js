const Apify = require('apify');

Apify.main(async () => {
    // open default dataset
    const dataSet = await Apify.openDataset();

    // calling map function and filtering through mapped items
    const moreThan5headers = (await dataSet.map((item) => item.headingCount)).filter((count) => count > 5);

    // saving result of map to default Key-value store
    await Apify.setValue('pages_with_more_than_5_headers', moreThan5headers);
});
