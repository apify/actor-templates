const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');
const globby = require('globby');
const { DIST_DIR_NAME, WRAPPERS_DIR_NAME } = require('./consts');

/**
 * Creates zips of all wrappers
 */
exports.buildWrappers = async function () {
    const distDir = path.resolve(__dirname, '..', DIST_DIR_NAME, WRAPPERS_DIR_NAME);
    fs.rmSync(distDir, { force: true, recursive: true });

    fs.mkdirSync(distDir, { recursive: true });
    const wrappersDir = path.resolve(__dirname, '..', WRAPPERS_DIR_NAME);

    const wrappers = fs.readdirSync(wrappersDir);

    for (const wrapperName of wrappers) {
        process.chdir(wrappersDir);
        if (fs.lstatSync(wrapperName).isDirectory()) {
            process.chdir(wrapperName);

            const zipName = `${wrapperName}.zip`;
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
