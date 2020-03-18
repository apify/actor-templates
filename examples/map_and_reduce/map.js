const Apify = require('apify');

Apify.main(async () => {
    // open dataset
    const dataSet = await Apify.openDataset();
    // setting items to dataSet
    await dataSet.pushData(datasetItems); // <-- insert example dataset items

    // calling map function and filtering through mapped items
    const pagesWithMoreThan5headers = (await dataSet.map(item => item.headingCount)).filter(count => count > 5);
});