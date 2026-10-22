/**
 * Renders agent-bases/AGENTS.md into every template.
 *
 * agent-bases/AGENTS.md is the single source of truth. It contains `{{variable}}` placeholders
 * whose values live in agent-bases/languages.json, keyed by template prefix (`js`, `ts`, `python`).
 * Each template gets the rendered AGENTS.md plus a CLAUDE.md that imports it.
 */
import { readdir, readFile, writeFile, unlink, lstat } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';
import prettier from 'prettier';

const baseDir = new URL('../agent-bases/', import.meta.url);
const templatesDir = new URL('../templates/', import.meta.url);
const sourceUrl = new URL('AGENTS.md', baseDir);

const source = await readFile(sourceUrl, 'utf-8');
const languages: Record<string, Record<string, string>> = JSON.parse(
    await readFile(new URL('languages.json', baseDir), 'utf-8'),
);
const prettierOptions = (await prettier.resolveConfig(fileURLToPath(sourceUrl))) ?? {};

const render = async (prefix: string): Promise<string> => {
    const variables = languages[prefix];

    const rendered = source.replace(/\{\{(\w+)\}\}/g, (_, name: string) => {
        if (!(name in variables)) {
            throw new Error(
                `agent-bases/AGENTS.md uses {{${name}}} but languages.json has no "${name}" for "${prefix}"`,
            );
        }

        return variables[name];
    });

    // Placeholder values differ in length per language, so re-format (table alignment) after rendering.
    return prettier.format(rendered, { ...prettierOptions, parser: 'markdown' });
};

const rendered: Record<string, string> = {};
for (const prefix of Object.keys(languages)) {
    rendered[prefix] = await render(prefix);
}

for (const templateId of await readdir(templatesDir)) {
    const prefix = Object.keys(languages).find((candidate) => templateId.startsWith(`${candidate}-`));

    if (!prefix) continue;

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

    await writeFile(new URL(`./${templateId}/AGENTS.md`, templatesDir), rendered[prefix], 'utf-8');
    await writeFile(claudeMdUrl, '@AGENTS.md\n', 'utf-8');
}

console.log('Done');
