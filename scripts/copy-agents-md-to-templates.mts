import { readdir, readFile, writeFile, unlink, lstat } from 'node:fs/promises';

const baseDir = new URL('../agent-bases/', import.meta.url);
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
        // Remove any pre-existing CLAUDE.md first. Older versions of this script
        // created it as a symlink to AGENTS.md, so writing through the path would
        // follow the link and clobber AGENTS.md.
        const claudeMdUrl = new URL(`./${templateId}/CLAUDE.md`, templatesDir);
        try {
            await lstat(claudeMdUrl);
            await unlink(claudeMdUrl);
        } catch {
            // File doesn't exist, nothing to remove
        }

        await writeFile(new URL(`./${templateId}/AGENTS.md`, templatesDir), templateFile.content, 'utf-8');
        await writeFile(claudeMdUrl, '@AGENTS.md\n', 'utf-8');
    }
}

console.log('Done');
