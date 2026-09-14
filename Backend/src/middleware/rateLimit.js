import {rateLimit} from 'express-rate-limit';
import {RedisStore} from 'rate-limit-redis';
import redisClient, { isRedisEnabled } from '../config/redis.js';

const redisStoreConfig = isRedisEnabled
    ? {
        store: new RedisStore({
            sendCommand: (...args) => redisClient.sendCommand(args),
        }),
    }
    : {};

if (!isRedisEnabled) {
    console.warn('[rate-limit] Redis unavailable. Falling back to in-memory rate limiter.');
}

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:10,
    standardHeaders: true,
    legacyHeaders: false,
    ...redisStoreConfig,
    message:{
        success:false,
        message: "Too many requests from this IP, please try again after 15 minutes."
    }
});

export const analyzeRateLimiter = rateLimit({
    windowMs:  60 * 60 * 1000, // 1 hour
    max:10,
    standardHeaders: true,
    legacyHeaders: false,
    ...redisStoreConfig,
    handler:(req,res) =>{
        return res.status(429).json({
            success:false,
            error: "Rate limit exceeded",
            message: "Too many requests from this IP, please try again after 1 hour."
        })
    }
});