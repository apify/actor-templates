const { buildTemplates } = require('./build_templates');

// run build
(async () => {
    // build templates
    await buildTemplates();
    console.log('Templates zips were created!');
})();
