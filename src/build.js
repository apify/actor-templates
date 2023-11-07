const { buildTemplates } = require('./build_templates');
const { buildWrappers } = require('./build_wrappers');

// run build
(async () => {
    // build templates
    await buildTemplates();
    console.log('Template zips were created!');
    await buildWrappers();
    console.log('Wrapper zips were created!');
})();
