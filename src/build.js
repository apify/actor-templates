import { buildTemplates } from './build_templates.js';

await buildTemplates();
console.log('Templates zips were created!');

// TODO(vladfrangu): when updating this package to expose the template archives directly, move the scripts outside the src folder (and adjust)
