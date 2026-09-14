import dotenv from 'dotenv';
import { createClient } from 'redis';

dotenv.config();

// Use REDIS_URL from environment. In a deployed environment like Render, this MUST be set.
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (!process.env.REDIS_URL) {
 console.warn('REDIS_URL environment variable is not set. Falling back to redis://127.0.0.1:6379 for local development.');
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