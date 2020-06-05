const { cryptoRandomObjectId } = require('apify-shared/utilities');
const { LOCAL_STORAGE_SUBDIRS, LOCAL_ENV_VARS, ENV_VARS } = require('apify-shared/consts');
const fs = require('fs-extra');
const path = require('path');
const globalCache = require('apify/build/global_cache').default;

const LOCAL_EMULATION_DIR = path.join(__dirname, '..', 'tmp', 'local-emulation-dir');

const DEFAULT_FOLDERS = Object.values(LOCAL_STORAGE_SUBDIRS)
    .concat([
        `${LOCAL_STORAGE_SUBDIRS.keyValueStores}/${LOCAL_ENV_VARS[ENV_VARS.DEFAULT_KEY_VALUE_STORE_ID]}`,
        'live_view',
    ]);

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
        globalCache.clearAll();
        const localStorageDir = path.resolve(LOCAL_EMULATION_DIR, dirName);
        await fs.ensureDir(localStorageDir);
        // prepare structure
        await this._ensureStructure(localStorageDir);
        process.env.APIFY_LOCAL_STORAGE_DIR = localStorageDir;
        this.localStorageDirs.push(localStorageDir);
        return localStorageDir;
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

    async _ensureStructure(localStorageDir) {
        // create first level
        const promises = DEFAULT_FOLDERS.map((folder) => {
            return fs.ensureDir(path.join(localStorageDir, folder));
        });
        return Promise.all(promises);
    }
}

module.exports = {
    LocalStorageDirEmulator,
};
