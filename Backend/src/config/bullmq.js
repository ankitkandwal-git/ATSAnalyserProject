import IORedis from 'ioredis';

const redisUrl = process.env.REDIS_URL || 'redis://localhost:6379';

const bullmqRedisConnection = new IORedis(redisUrl, {
	maxRetriesPerRequest: null,
});

bullmqRedisConnection.on('connect', () => {
	console.log('✓ BullMQ Redis connected successfully');
});

bullmqRedisConnection.on('error', (error) => {
	console.error('BullMQ Redis connection error:', error);
});

export default bullmqRedisConnection;
