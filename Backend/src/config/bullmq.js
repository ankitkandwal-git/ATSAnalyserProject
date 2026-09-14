import dotenv from 'dotenv';
import IORedis from 'ioredis';

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
	console.warn('[bullmq] REDIS_URL uses docker hostname "redis" which is not resolvable on Render. Queue features are disabled until REDIS_URL is updated in Render env vars.');
	REDIS_URL = '';
}

export const isBullmqEnabled = Boolean(REDIS_URL);

let bullmqRedisConnection = null;

if (isBullmqEnabled) {
	bullmqRedisConnection = new IORedis(REDIS_URL, {
		maxRetriesPerRequest: null,
		enableReadyCheck: false,
	});

	bullmqRedisConnection.on('connect', () => {
		console.log('✓ BullMQ Redis connected successfully');
	});

	bullmqRedisConnection.on('error', (error) => {
		console.error('BullMQ Redis connection error:', error);
	});
} else {
	console.warn('[bullmq] Redis connection is disabled. Queue and worker features are unavailable.');
}

export default bullmqRedisConnection;
