const { cryptoRandomObjectId } = require('@apify/utilities');
const { StorageManager, Configuration } = require('crawlee');
const { MemoryStorage } = require('@crawlee/memory-storage');
const fs = require('fs-extra');
const path = require('node:path');

const LOCAL_EMULATION_DIR = path.join(__dirname, '..', 'tmp', 'local-emulation-dir');

/**
 * Emulates storage for testing purposes.
 * Creates an unique folder with default structure.
 * This class should be used in all tests that are using the storage.
 *
 * Basic usage: Create and initialize `LocalStorageDirEmulator` in beforeAll hook,
 * call `clean()` in afterEach hook and finally call `destroy()` in afterAll hook.
 */
class LocalStorageDirEmulator {
    constructor() {
        this.localStorageDirs = [];
    }

    async init(dirName = cryptoRandomObjectId(10)) {
        StorageManager.clearCache();
        const localStorageDir = path.resolve(LOCAL_EMULATION_DIR, dirName);
        this.localStorageDirs.push(localStorageDir);
        await fs.ensureDir(localStorageDir);

        const storage = new MemoryStorage({ localDataDirectory: localStorageDir });
        Configuration.getGlobalConfig().useStorageClient(storage);
        // console.debug(`Created local storage emulation in folder ${localStorageDir}`);
    }

    /**
     * Removes the folder itself
     * @return {Promise}
     */
    async destroy() {
        delete process.env.APIFY_LOCAL_STORAGE_DIR;
        const promises = this.localStorageDirs.map((dir) => {
            return fs.remove(dir);
        });
        return Promise.all(promises);
    }
}

module.exports = {
    LocalStorageDirEmulator,
};
