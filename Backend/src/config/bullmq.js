import IORedis from 'ioredis';

// Use REDIS_URL from environment. In a deployed environment like Render, this MUST be set.
const REDIS_URL = process.env.REDIS_URL;

if (!REDIS_URL) {
 console.error('REDIS_URL environment variable is not set. Please configure it for BullMQ.');
 throw new Error('REDIS_URL environment variable is required for BullMQ connection.');
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
