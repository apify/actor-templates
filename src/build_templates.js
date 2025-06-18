import { execSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import { globby } from 'globby';

import { DIST_DIR_NAME, TEMPLATE_IDS, TEMPLATES_DIR_NAME, WRAPPER_IDS, WRAPPERS_DIR_NAME } from './consts.js';

/**
 * Creates zips of all templates and wrappers.
 */
async function buildTemplatedFolder({ dirName, templateIds }) {
    const distDir = path.resolve(import.meta.dirname, '..', DIST_DIR_NAME, dirName);
    fs.rmSync(distDir, { force: true, recursive: true });

    fs.mkdirSync(distDir, { recursive: true });
    const templatesDir = path.resolve(import.meta.dirname, '..', dirName);

    for (const templateId of templateIds) {
        process.chdir(templatesDir);
        if (fs.lstatSync(templateId).isDirectory()) {
            process.chdir(templateId);

            const zipName = `${templateId}.zip`;
            const archivePath = path.join(distDir, zipName);

            const files = await globby([`./*`, `./**/**`, `!./node_modules/**`, `!./.venv/**`, `!./.DS_Store`], {
                dot: true,
            });
            files.sort();

            // Reset the timestamp on the template files to have a deterministic zip
            for (const file of files) {
                execSync(`touch -t "200001010000" ${file}`);
            }

            console.log(`Creating zip ${zipName}`);
            execSync(`zip -X ${archivePath} ${files.join(' ')}`);
        }
    }
}

export async function buildTemplates() {
    for (const config of [
        { dirName: TEMPLATES_DIR_NAME, templateIds: TEMPLATE_IDS },
        { dirName: WRAPPERS_DIR_NAME, templateIds: WRAPPER_IDS },
    ]) {
        await buildTemplatedFolder(config);
    }
}
