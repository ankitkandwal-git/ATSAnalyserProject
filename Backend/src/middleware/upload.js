import multer from 'multer';
import fs from 'fs';
import os from 'os';
import path from 'path';

const uploadDirectory = path.join(os.tmpdir(), 'ats-analyzer-uploads');

fs.mkdirSync(uploadDirectory, { recursive: true });

const storage = multer.diskStorage({
    destination: function(req, file, cb) {
        cb(null, uploadDirectory);
    },
    filename: function(req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(
            null,
            file.fieldname +
            '-' +
            uniqueSuffix +
            path.extname(file.originalname)
        );
    }
});

const allowedMimeTypes = new Set(['application/pdf']);

const fileFilter = (req, file, cb) => {
    if (allowedMimeTypes.has(file.mimetype)) {
        cb(null, true);
        return;
    }

    cb(new Error('Unsupported file type. Please upload a PDF resume.'), false);
};

const upload = multer({
    storage,
    fileFilter,
    limits: {
        fileSize: 10 * 1024 * 1024
    }
});

export default upload;