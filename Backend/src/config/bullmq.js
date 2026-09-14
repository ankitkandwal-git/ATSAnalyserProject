import dotenv from 'dotenv';
import IORedis from 'ioredis';

dotenv.config();

// Use REDIS_URL from environment. In a deployed environment like Render, this MUST be set.
const REDIS_URL = process.env.REDIS_URL || 'redis://127.0.0.1:6379';

if (!process.env.REDIS_URL) {
 console.warn('REDIS_URL environment variable is not set. Falling back to redis://127.0.0.1:6379 for local development.');
}

const bullmqRedisConnection = new IORedis(REDIS_URL, {
	maxRetriesPerRequest: null,
});

bullmqRedisConnection.on('connect', () => {
	console.log('✓ BullMQ Redis connected successfully');
});

bullmqRedisConnection.on('error', (error) => {
	console.error('BullMQ Redis connection error:', error);
});

export default bullmqRedisConnection;
