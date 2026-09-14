import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

const FALLBACK_LOCAL_REDIS_URL = 'redis://127.0.0.1:6379';

const rawRedisUrl = process.env.REDIS_URL?.trim();
const isRenderRuntime = Boolean(process.env.RENDER) || Boolean(process.env.RENDER_SERVICE_ID);

const isDockerHostAlias = (url) => {
    try {
        return new URL(url).hostname === 'redis';
    } catch {
        return false;
    }
};

let REDIS_URL = rawRedisUrl;

if (!REDIS_URL && process.env.NODE_ENV !== 'production') {
    REDIS_URL = FALLBACK_LOCAL_REDIS_URL;
}

if (isRenderRuntime && REDIS_URL && isDockerHostAlias(REDIS_URL)) {
    console.warn('[redis] REDIS_URL uses docker hostname "redis" which is not resolvable on Render. Disable Redis features until REDIS_URL is updated in Render env vars.');
    REDIS_URL = '';
}

export const isRedisEnabled = Boolean(REDIS_URL);

if (!isRedisEnabled) {
    console.warn('[redis] REDIS_URL is missing or invalid for this runtime. Continuing without Redis-backed features.');
}

const createNoopRedisClient = () => ({
    isOpen: false,
    on: () => {},
    connect: async () => {},
    ping: async () => 'PONG (redis-disabled)',
    get: async () => null,
    set: async () => 'OK',
    sAdd: async () => 0,
    sMembers: async () => [],
    del: async () => 0,
    sendCommand: () => {
        throw new Error('Redis client is disabled.');
    },
});

const redisClient = isRedisEnabled
    ? createClient({ url: REDIS_URL })
    : createNoopRedisClient();

if (isRedisEnabled) {
    redisClient.on('connect', () => {
        console.log('✓ Redis connected successfully');
    });

    redisClient.on('error', (error) => {
        console.error('Redis connection error:', error);
    });

    // Never block server startup on Redis connection.
    redisClient.connect().catch((error) => {
        console.error('Redis connection failed during startup:', error);
    });
}

export default redisClient;