const Apify = require('apify');

Apify.main(async () => {
    // open default dataset
    const dataSet = await Apify.openDataset();

    // calling reduce function and using memo to calculate number of headers
    const pagesHeadingCount = await dataSet.reduce((memo, value) => {
        memo += value.headingCount;
        return memo;
    }, 0);

    // saving result of reduce to default Key-value store
    await Apify.setValue('pages_heading_count', pagesHeadingCount);
});
