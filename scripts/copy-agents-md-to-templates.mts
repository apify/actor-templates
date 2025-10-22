import { readdir, readFile, writeFile } from 'node:fs/promises';
import { join } from 'node:path';

const baseDir = new URL('../bases/', import.meta.url);
const templatesDir = new URL('../templates/', import.meta.url);

const baseFiles = await Promise.all(
    (await readdir(baseDir)).map(async (file) => {
        const content = await readFile(new URL(file, baseDir), 'utf-8');

        return {
            file,
            content,
            templateMatches(templateName: string) {
                return templateName.startsWith(file.replace('.AGENTS.md', ''));
            },
        };
    }),
);

const templateDirectoryElements = await readdir(templatesDir);

for (const templateId of templateDirectoryElements) {
    const templateFile = baseFiles.find((file) => file.templateMatches(templateId));

    if (templateFile) {
        await writeFile(new URL(`./${templateId}/AGENTS.md`, templatesDir), templateFile.content, 'utf-8');
    }
}

console.log('Done');
