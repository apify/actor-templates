const fs = require('fs');
const path = require('path');
const archiver = require('archiver-promise');
const rimraf = require('rimraf');
const globby = require('globby');
const { TEMPLATE_NAMES, DIST_DIR_NAME, TEMPLATES_DIR_NAME } = require('./consts');

/**
 * Creates zips of all templates
 */
exports.buildTemplates = async function () {
    const distDir = path.resolve(__dirname, '..', DIST_DIR_NAME, TEMPLATES_DIR_NAME);
    if (fs.existsSync(distDir)) rimraf.sync(distDir);

    fs.mkdirSync(distDir);
    const templatesDir = path.resolve(__dirname, '..', TEMPLATES_DIR_NAME);
    process.chdir(templatesDir);

    for (const templateName of TEMPLATE_NAMES) {
        if (fs.lstatSync(templateName).isDirectory()) {
            const zipName = `${templateName}.zip`;
            const archivePath = path.join(distDir, zipName);
            const archive = archiver(archivePath);
            const files = await globby([
                `${templateName}/*`,
                `${templateName}/**/**`,
                `!${templateName}/node_modules/**`,
                `!${templateName}/.venv/**`,
                `!${templateName}/.DS_Store`,
            ], { dot: true });

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
