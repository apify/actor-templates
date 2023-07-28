import { Actor } from 'apify';
import { createHash } from 'crypto';
import { readFile } from 'node:fs/promises';
import tempWrite from 'temp-write';
import tar from 'tar';

const VECTOR_INDEX_CACHE_STORE_NAME = 'vector-index-cache';

/**
 * Generates vector index cache key as a hash of provided configuration object.
 *
 * @param {Object} config
 * @returns {String}
 */
function getIndexCacheKey(config) {
    const hash = createHash('md5').update(JSON.stringify(config)).digest('hex');

    return `${hash}.tar`;
}

/**
 * Caches a vector index from `indexPath` in a VECTOR_INDEX_CACHE_STORE_NAME key-value store a key generated from `config`.
 *
 * @param {Object} config
 * @param {String} indexPath
 */
export async function cacheVectorIndex(config, indexPath) {
    const vectorIndexCacheStore = await Actor.openKeyValueStore(VECTOR_INDEX_CACHE_STORE_NAME);
    const tempFilePath = await tempWrite(tar.c({}, [indexPath]));
    const packedVectorIndex = await readFile(tempFilePath);

    await vectorIndexCacheStore.setValue(getIndexCacheKey(config), packedVectorIndex, { contentType: 'application/tar' });
}

/**
 * Fetches a cached vector index from a VECTOR_INDEX_CACHE_STORE_NAME key-value store and extracts it to the current directory.
 *
 * @param {Object} config
 * @returns {Boolean} noting if the vector index was found in the cache
 */
export async function retrieveVectorIndex(config) {
    const vectorIndexCacheStore = await Actor.openKeyValueStore(VECTOR_INDEX_CACHE_STORE_NAME);

    const vectorIndexRecord = await vectorIndexCacheStore.getValue(getIndexCacheKey(config));
    if (!vectorIndexRecord) return false;

    const tempFilePath = await tempWrite(vectorIndexRecord);
    await tar.x({ file: tempFilePath, strip: 1, C: '.' });

    return true;
}
