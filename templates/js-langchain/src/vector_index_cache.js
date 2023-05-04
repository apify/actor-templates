import { Actor } from 'apify';
import { createHash } from 'crypto';
import { pipeline } from 'node:stream/promises';
import tar from 'tar';

const client = Actor.newClient();

function getIndexCacheKey(config) {
    const hash = createHash('md5').update(JSON.stringify(config)).digest('hex');

    return `${hash}.tar.gz`;
}

async function getVectorIndexCacheStore() {
    const { id: vectorIndexCacheStoreId } = await client.keyValueStores().getOrCreate('vector-index-cache');

    return client.keyValueStore(vectorIndexCacheStoreId);
}

export async function cacheVectorIndex(config, indexPath) {
    const vectorIndexCacheStore = await getVectorIndexCacheStore();
    const gzipedVectorIndexStream = tar.c({ gzip: true }, [indexPath]);
    await vectorIndexCacheStore.setRecord(getIndexCacheKey(config), gzipedVectorIndexStream);
}

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
