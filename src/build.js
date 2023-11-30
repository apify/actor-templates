const { buildTemplates } = require('./build_templates');

(async () => {
    await buildTemplates();
    console.log('Templates zips were created!');
})();
