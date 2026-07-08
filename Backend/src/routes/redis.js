import { Router } from 'express';
import redisClient from '../config/redis.js';

const router = Router();

router.get('/test', async (req, res) => {
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