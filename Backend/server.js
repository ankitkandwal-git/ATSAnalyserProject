import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import mongoose from "mongoose";

import authRoutes from "./src/routes/authRoutes.js";
import resumeRoutes from "./src/routes/resumeRoutes.js";
import cloudinary from "./src/config/cloudinary.js";

dotenv.config();

// Verify Cloudinary configuration
console.log('[server] Cloudinary Config Status:', {
  cloud_name: process.env.CLOUD_NAME ? '✓ SET' : '✗ MISSING',
  api_key: process.env.CLOUD_API_KEY ? '✓ SET' : '✗ MISSING',
  api_secret: process.env.CLOUD_API_SECRET ? '✓ SET' : '✗ MISSING',
});

const app = express();

const allowedOrigins = [
  "https://ats-analyser-project.vercel.app",
  "http://localhost:3000",
  "http://localhost:5173",
  ...(process.env.FRONTEND_URL 
    ? process.env.FRONTEND_URL.split(',').map(url => url.trim())
    : [])
];

app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin || allowedOrigins.includes(origin)) {
        callback(null, true);
      } else {
        callback(new Error("CORS not allowed"));
      }
    },
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
    credentials: true,
    allowedHeaders: ["Content-Type", "Authorization"],
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

mongoose
  .connect(process.env.MONGO_URI)
  .then(() => {
    console.log("MongoDB Connected Successfully");
  })
  .catch((error) => {
    console.error("MongoDB Connection Error:", error);
  });

app.get("/", (req, res) => {
  res.json({
    success: true,
    message: "ATS Resume Analyzer Backend Running",
  });
});


app.use("/auth", authRoutes);
app.use("/api/resumes", resumeRoutes);

app.use((err, req, res, next) => {
  console.error("Server Error:", err);

  res.status(500).json({
    success: false,
    error: "Internal Server Error",
  });
});


const PORT = process.env.PORT || 5000;

console.log("[startup] CORS Configuration:");
console.log(`  Allowed origins: ${allowedOrigins.join(", ")}`);
console.log(`  Frontend URL from env: ${process.env.FRONTEND_URL || "not set"}`);
console.log(`[startup] Server starting on port ${PORT}`);

app.listen(PORT, () => {
  console.log(`[startup] Server running on port ${PORT}`);
});