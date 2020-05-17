const { buildTemplates } = require('./build_templates');
const { buildExamples } = require('./build_examples');

// run build
(async () => {
    // build templates
    await buildTemplates();
    console.log('Templates zips were created!');

    // build examples
    // await buildExamples();
    // console.log('Example markdowns were created!');
})();
