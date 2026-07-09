import {createClient} from 'redis';

const redisClient = createClient({
    url : process.env.REDIS_URL || 'redis://localhost:6379'
});

redisClient.on('connect', () =>{
    console.log('✓ Redis connected successfully');
})

redisClient.on('error', (error) => {
    console.error('Redis connection error:', error);
});

try {
    await redisClient.connect();
} catch (error) {
    console.error('Redis connection failed during startup:', error);
}

export default redisClient;