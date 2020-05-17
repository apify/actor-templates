const templates = require('../src/index');

describe('index', () => {
    test('should fetch template manifest', async () => {
        const manifest = await templates.fetchManifest();
        expect(Array.isArray(manifest.templates)).toBe(true);
        for (const t of manifest.templates) {
            expect(typeof t.name).toBe('string');
            expect(typeof t.value).toBe('string');
            expect(typeof t.archiveUrl).toBe('string');
        }
    });
});
