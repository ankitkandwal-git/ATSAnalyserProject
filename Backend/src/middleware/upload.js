import multer from 'multer';
import { CloudinaryStorage } from 'multer-storage-cloudinary';
import cloudinary from '../config/cloudinary.js';

const storage = new CloudinaryStorage({
    cloudinary,
    params: async (req, file) => ({
        folder: 'resumes',
        resource_type: 'raw',
        public_id: `${Date.now()}-${file.originalname}`,
    }),
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