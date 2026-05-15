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

app.use('/auth', authRoutes);
app.use('/api/resumes', resumeRoutes);

app.get('/', (req, res) => {
    res.send('Welcome to ATS Analyzer API');
});
const PORT = process.env.PORT || 5000;

app.listen(PORT,() =>{
    console.log(`Server is running on port ${PORT}`);
})