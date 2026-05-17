import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';
import fs from 'fs/promises';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const storage = multer.diskStorage({
    destination: async (req, file, cb) => {
        try {
            const tempDir = path.join(__dirname, '../../uploads/temp');
            await fs.mkdir(tempDir, { recursive: true });
            cb(null, tempDir);
        } catch (error) {
            console.error('[upload-middleware] Failed to create temp directory:', error);
            cb(error);
        }
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = `${Date.now()}-${file.originalname}`;
        cb(null, uniqueSuffix);
    },
});

const allowedFormats = new Set([
    'application/pdf',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
]);

const fileFilter = (req, file, cb) => {
    if (allowedFormats.has(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(
        new Error(
            'Unsupported file format. Only PDF and Word documents are allowed.'
        ),
        false
    );
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 5 * 1024 * 1024,
    },
});

export default upload;