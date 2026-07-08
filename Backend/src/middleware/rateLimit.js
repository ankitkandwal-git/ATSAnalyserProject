import {rateLimit} from 'express-rate-limit';
import {RedisStore} from 'rate-limit-redis';
import redisClient from '../config/redis.js';

export const authRateLimiter = rateLimit({
    windowMs: 15 * 60 * 1000, // 15 minutes
    max:10,
    standardHeaders: true,
    legacyHeaders: false,
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
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
    store: new RedisStore({
        sendCommand: (...args) => redisClient.sendCommand(args),
    }),
    handler:(req,res) =>{
        return res.status(429).json({
            success:false,
            error: "Rate limit exceeded",
            message: "Too many requests from this IP, please try again after 1 hour."
        })
    }
});