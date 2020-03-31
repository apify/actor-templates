const fs = require('fs');
const archiver = require('archiver-promise');
const rimraf = require('rimraf');
const globby = require('globby');
const { TEMPLATES_NAME, BUILD_DIR_NAME, TEMPLATES_DIR_NAME, } = require('./consts');

/**
 * Creates zips of all templates
 */
exports.buildTemplates = async function() {
    if (fs.existsSync(BUILD_DIR_NAME)) rimraf.sync(BUILD_DIR_NAME);

    fs.mkdirSync(BUILD_DIR_NAME);
    process.chdir(TEMPLATES_DIR_NAME);

    for (const templateName of TEMPLATES_NAME) {
        if (fs.lstatSync(templateName).isDirectory()) {
            const zipName = `${templateName}.zip`;
            const archive = archiver(`../${BUILD_DIR_NAME}/${zipName}`);
            const files = await globby([`${templateName}/*`, `${templateName}/**/**`]);

            const promises = files.map((fileName) => {
                fileName = fileName.replace(`${templateName}/`, '');
                return archive.file(`./${templateName}/${fileName}`, { name: fileName });
            });

            console.log(`Creating zip ${zipName}`);
            await Promise.all(promises);
            await archive.finalize();
        }
    }
};