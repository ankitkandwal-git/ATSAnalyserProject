import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import connectDB from './src/config/db.js';
import authRoutes from './src/routes/authRoutes.js';
import resumeRoutes from './src/routes/resumeRoutes.js';

connectDB();

const app = express();

const frontendOrigins = process.env.FRONTEND_URL
    ? process.env.FRONTEND_URL.split(',').map((origin) => origin.trim().replace(/\/$/, '')).filter(Boolean)
    : '*';

app.use(cors({
    origin: frontendOrigins,
}));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.use((req, res, next) => {
    if (req.originalUrl.startsWith('/api/resumes')) {
        console.log(`[request] ${req.method} ${req.originalUrl}`);
    }

    next();
});

app.use('/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to ATS Analyzer API');
});
const PORT = process.env.PORT || 5000;

app.use((err, req, res, next) => {
    console.error('[server] unhandled error:', err);

    const status = err?.name === 'MulterError'
        ? 400
        : err?.statusCode || 500;

    res.status(status).json({
        success: false,
        error: err?.message || 'Internal Server Error'
    });
});

console.log('[startup] environment check', {
    port: PORT,
    hasMongoUri: Boolean(process.env.MONGO_URI || process.env.MONGO_URL),
    hasGeminiKey: Boolean(process.env.GEMINI_API_KEY),
    frontendUrl: process.env.FRONTEND_URL || '*'
});

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
})