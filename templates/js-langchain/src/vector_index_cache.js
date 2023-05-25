import { Actor } from 'apify';
import { createHash } from 'crypto';
import { pipeline } from 'node:stream/promises';
import tar from 'tar';

const VECTOR_INDEX_CACHE_STORE_NAME = 'vector-index-cache';

const client = Actor.newClient();

/**
 * Generates vector index cache key as a hash of provided configuration object.
 *
 * @param {Object} config
 * @returns {String}
 */
function getIndexCacheKey(config) {
    const hash = createHash('md5').update(JSON.stringify(config)).digest('hex');

    return `${hash}.tar.gz`;
}

/**
 * Returns an ID of a key-value store with a name VECTOR_INDEX_CACHE_STORE_NAME.
 *
 * @returns {String}
 */
async function getVectorIndexCacheStore() {
    const { id: vectorIndexCacheStoreId } = await client.keyValueStores().getOrCreate(VECTOR_INDEX_CACHE_STORE_NAME);

    return client.keyValueStore(vectorIndexCacheStoreId);
}

/**
 * Caches a vector index from `indexPath` in a VECTOR_INDEX_CACHE_STORE_NAME key-value store a key generated from `config`.
 *
 * @param {Object} config
 * @param {String} indexPath
 */
export async function cacheVectorIndex(config, indexPath) {
    const vectorIndexCacheStore = await getVectorIndexCacheStore();
    const gzipedVectorIndexStream = tar.c({ gzip: true }, [indexPath]);
    await vectorIndexCacheStore.setRecord({
        key: getIndexCacheKey(config),
        value: gzipedVectorIndexStream,
    });
}

/**
 * Fetches a cached vector index from a VECTOR_INDEX_CACHE_STORE_NAME key-value store and extracts it to the current directory.
 *
 * @param {Object} config
 * @returns {Boolean} noting if the vector index was found in the cache
 */
export async function retrieveVectorIndex(config) {
    const vectorIndexCacheStore = await getVectorIndexCacheStore();
    let vectorIndexRecord;

    try {
        vectorIndexRecord = await vectorIndexCacheStore.getRecord(getIndexCacheKey(config), { stream: true });
    } catch (err) {
        if (err.statusCode === 404) return false;

        throw err;
    }

    await pipeline([
        vectorIndexRecord.value,
        tar.x({ strip: 1, C: '.' }),
    ]);
    return true;
}
