import express from 'express';
import authMiddleware from '../middleware/authMiddleware.js';
import upload from '../middleware/upload.js';

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
    analyzeResumeController
);

export default router;