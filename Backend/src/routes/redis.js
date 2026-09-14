import { Router } from 'express';
import redisClient, { isRedisEnabled } from '../config/redis.js';

const router = Router();

router.get('/test', async (req, res) => {
    if (!isRedisEnabled) {
        return res.status(503).json({
            success: false,
            message: 'Redis is disabled or not configured for this environment.',
        });
    }

    try {
        const reply = await redisClient.ping();
        res.json({
            success: true,
            message: 'Redis is connected',
            reply: reply
        })
    } catch (err) {
        res.json({
            success: false,
            message: 'Redis is not connected',
            error: err.message
        })
    }
});

export default router;