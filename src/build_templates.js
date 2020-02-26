const fs = require('fs');
const archiver = require('archiver-promise');
const rimraf = require("rimraf");

/**
 * Creates zips of all templates
 */
(async () => {
    const templatesZipsFld = 'templates_zips';
    const templatesDirPath = `${__dirname}/../templates`;
    const templatesFolders = fs.readdirSync(templatesDirPath);
    if (fs.existsSync(templatesZipsFld)) rimraf.sync(templatesZipsFld);
    fs.mkdirSync(templatesZipsFld);
    process.chdir('./templates');
    for (const templateName of templatesFolders) {
        if (fs.lstatSync(templateName).isDirectory()) {
            const archive = archiver(`../${templatesZipsFld}/${templateName}.zip`);
            await archive.directory(templateName);
            await archive.finalize();
        }
    }
})();
