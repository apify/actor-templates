import { fetchManifest } from '../src/index.js';
import localManifest from '../templates/manifest.json';

// This needs to match the valid programming languages of the CLI
// create command available in apify-cli/src/lib/create-utils.js
// Before extending categories, think carefully about the impact
// on CLI and Console frontend.
const VALID_CATEGORIES = ['javascript', 'typescript', 'python'];

describe('index', () => {
    test('template manifest should be valid', async () => {
        const manifest = await fetchManifest();
        expect(Array.isArray(manifest.templates)).toBe(true);
        for (const t of manifest.templates) {
            expect(typeof t.name).toBe('string');
            expect(typeof t.description).toBe('string');
            expect(typeof t.archiveUrl).toBe('string');
        }
    });

    test('manifest entries should have valid categories', async () => {
        for (const t of localManifest.templates) {
            expect(VALID_CATEGORIES).toContain(t.category);
        }
    });

    test('should fetch template manifest from GitHub', async () => {
        // This fetches the remote === old manifest from GitHub.
        // It does not test your local changes.
        const manifest = await fetchManifest();
        expect(Array.isArray(manifest.templates)).toBe(true);
        for (const t of manifest.templates) {
            expect(typeof t.name).toBe('string');
            expect(typeof t.description).toBe('string');
            expect(typeof t.archiveUrl).toBe('string');
        }
    });
});
