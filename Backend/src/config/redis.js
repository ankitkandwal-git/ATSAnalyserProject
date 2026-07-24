import { createClient } from 'redis';

// Use REDIS_URL from environment. In a deployed environment like Render, this MUST be set.
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
 console.error('REDIS_URL environment variable is not set. Please configure it for Redis client.');
 throw new Error('REDIS_URL environment variable is required for Redis client connection.');
}

const redisClient = createClient({ url: REDIS_URL });

redisClient.on('connect', () => {
    console.log('✓ Redis connected successfully');
});

redisClient.on('error', (error) => {
    console.error('Redis connection error:', error);
});

try {
    // connect() can be awaited during startup; keep behavior unchanged
    await redisClient.connect();
} catch (error) {
    console.error('Redis connection failed during startup:', error);
}

export default redisClient;