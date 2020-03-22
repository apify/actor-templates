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

    // calling reduce function and using memo to calculate number of headers
    const pagesHeadingCount = await dataSet.reduce((memo, value)=> {
        memo += value.headingCount;
        return memo;
    }, 0);

    // saving result of reduce to default Key-value store
    await Apify.setValue('pages_heading_count', pagesHeadingCount);
});
