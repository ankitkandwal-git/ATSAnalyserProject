import {Queue} from 'bullmq';
import bullmqRedisConnection, { isBullmqEnabled } from '../config/bullmq.js';

export const isResumeQueueEnabled = Boolean(isBullmqEnabled && bullmqRedisConnection);

export const resumeQueue = isResumeQueueEnabled
    ? new Queue(
        "resume-analysis", {
            connection: bullmqRedisConnection
        }
    )
    : null;