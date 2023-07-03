import { injectable } from "inversify";
import redis, { createClient } from "redis";
import AsyncLock from "async-lock";
import { logger } from "../lib/logger";

@injectable()
export class CacheService {
    client: redis.RedisClientType;
    lock: AsyncLock;

    constructor() {
        logger.info(
            `Constructing Cache service to listen at port ${process.env.CACHE_PORT}`
        );
        this.client = createClient({
            socket: {
                port: parseInt(process.env.CACHE_PORT),
            },
        });
        this.client.connect();
        this.client.configSet("maxmemory", "50mb");
        this.client.configSet("maxmemory-policy", "allkeys-lru");
        this.lock = new AsyncLock();
    }

    async set(key: string, value: string, options: any = {}) {
        this.client.set(key, value, options);
    }

    async get(key: string) {
        return await this.client.get(key);
    }

    async del(key: string) {
        return await this.client.del(key);
    }

    /**
     * Get a key, and also put a value there if no key matches
     * Should probably use this in practice, since it solves cache stampede :D
     * @param key the key to be matched against
     * @param f function to return a string value if no key is found
     * @param options options when setting a value for the key
     * @returns a value matching the specified key
     */
    async getWithPopulate(
        key: string,
        f: () => Promise<string>,
        options: any = {}
    ) {
        const res = await this.client.get(key);
        if (res != null) {
            return res;
        }
        return await this.lock.acquire(key, async () => {
            let x = await this.client.get(key);
            if (x != null) {
                return x;
            }
            x = await f();
            await this.client.set(key, x, options);
            return x;
        });
    }
}