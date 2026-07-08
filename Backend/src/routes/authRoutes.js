import express from 'express';
import { register, login } from '../controller/authController.js';
import { authRateLimiter } from '../middleware/rateLimit.js';

const router = express.Router();

router.post('/register', authRateLimiter, register);
router.post('/login', authRateLimiter, login);

export default router;