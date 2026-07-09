import {Queue} from 'bullmq';
import bullmqRedisConnection from '../config/bullmq.js';

export const resumeQueue = new Queue(
    "resume-analysis",{
        connection: bullmqRedisConnection
    }
)