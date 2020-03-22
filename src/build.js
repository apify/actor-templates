const { buildTemplates } = require('./build_templates');
const { buildExamples } = require('./build_examples');

(async () => {
    // build templates
    await buildTemplates();

    // build examples
    await buildExamples();
})();


