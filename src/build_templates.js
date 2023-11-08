const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const globby = require('globby');
const { TEMPLATE_IDS, DIST_DIR_NAME, TEMPLATES_DIR_NAME, WRAPPERS_DIR_NAME, WRAPPER_IDS } = require('./consts');

/**
 * Creates zips of all templates and wrappers.
 */
async function buildTemplatedFolder({ dirName, templateIds }) {
    const distDir = path.resolve(__dirname, '..', DIST_DIR_NAME, dirName);
    fs.rmSync(distDir, { force: true, recursive: true });

    fs.mkdirSync(distDir, { recursive: true });
    const templatesDir = path.resolve(__dirname, '..', dirName);

    for (const templateId of templateIds) {
        process.chdir(templatesDir);
        if (fs.lstatSync(templateId).isDirectory()) {
            process.chdir(templateId);

            const zipName = `${templateId}.zip`;
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

exports.buildTemplates = async function () {
    for (const config of [
        { dirName: TEMPLATES_DIR_NAME, templateIds: TEMPLATE_IDS },
        { dirName: WRAPPERS_DIR_NAME, templateIds: WRAPPER_IDS },
    ]) {
        await buildTemplatedFolder(config);
    }
}