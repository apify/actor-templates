const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const rimraf = require('rimraf');
const globby = require('globby');
const { TEMPLATE_NAMES, DIST_DIR_NAME, TEMPLATES_DIR_NAME } = require('./consts');

/**
 * Creates zips of all templates
 */
exports.buildTemplates = async function () {
    const distDir = path.resolve(__dirname, '..', DIST_DIR_NAME, TEMPLATES_DIR_NAME);
    if (fs.existsSync(distDir)) rimraf.sync(distDir);

    fs.mkdirSync(distDir, { recursive: true });
    const templatesDir = path.resolve(__dirname, '..', TEMPLATES_DIR_NAME);

    for (const templateName of TEMPLATE_NAMES) {
        process.chdir(templatesDir);
        if (fs.lstatSync(templateName).isDirectory()) {
            process.chdir(templateName);

            const zipName = `${templateName}.zip`;
            const archivePath = path.join(distDir, zipName);

            const files = await globby([
                `./*`,
                `./**/**`,
                `!./node_modules/**`,
                `!./.venv/**`,
                `!./.DS_Store`,
            ], { dot: true });
            files.sort();

            // Reset the timestamp on the template files to have a deterministic zip
            for (const file of files) {
                execSync(`touch -t "200001010000" ${file}`);
            }

            console.log(`Creating zip ${zipName}`);
            execSync(`zip -X ${archivePath} ${files.join(' ')}`);
        }
    }
};
