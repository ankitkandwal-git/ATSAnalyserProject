import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';
import { analyzeRateLimiter } from '../middleware/rateLimit.js';

import {
    uploadResume,
    analyzeResumeController
} from '../controller/resumeController.js';

const router = express.Router();

router.post(
    '/upload',
    authMiddleware,
    upload.single('resume'),
    uploadResume
);

router.post(
    '/analyze',
    analyzeRateLimiter,
    (req, res, next) => {
        console.log('[resume-route] POST /api/resumes/analyze hit');
        next();
    },
    analyzeResumeController
);

export default router;