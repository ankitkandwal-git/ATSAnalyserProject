import multer from 'multer';
import path from 'path';

const storage = multer.diskStorage({

    destination: function(req, file, cb) {
        cb(null, 'uploads/');
    },

    filename: function(req, file, cb) {

        const uniqueSuffix =
            Date.now() + '-' + Math.round(Math.random() * 1E9);

        cb(
            null,
            file.fieldname +
            '-' +
            uniqueSuffix +
            path.extname(file.originalname)
        );
    }
});

const fileFilter = (req, file, cb) => {

    if (
        file.mimetype === 'application/pdf' ||
        file.mimetype === 'application/msword' ||
        file.mimetype === 'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
    ) {

        cb(null, true);

    } else {

        cb(new Error('Unsupported file type'), false);
    }
};

const upload = multer({
    storage,
    fileFilter
});

export default upload;