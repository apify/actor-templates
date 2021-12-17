const templates = require('../src/index');

describe('index', () => {
    console.log(AbortController)
    test('should fetch template manifest', async () => {
        const manifest = await templates.fetchManifest();
        expect(Array.isArray(manifest.templates)).toBe(true);
        for (const t of manifest.templates) {
            expect(typeof t.name).toBe('string');
            expect(typeof t.description).toBe('string');
            expect(typeof t.archiveUrl).toBe('string');
        }
    });
});
