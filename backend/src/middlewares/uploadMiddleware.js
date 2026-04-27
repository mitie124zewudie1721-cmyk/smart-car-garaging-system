// src/middlewares/uploadMiddleware.js
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import fs from 'fs';

// Ensure uploads directory exists
const uploadsDir = 'backend/uploads/licenses';
if (!fs.existsSync(uploadsDir)) {
    fs.mkdirSync(uploadsDir, { recursive: true });
}

// Configure storage
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        cb(null, uploadsDir);
    },
    filename: function (req, file, cb) {
        // Generate unique filename: {uuid}-{timestamp}{extension}
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    }
});

// File filter function — checks MIME type AND extension
const fileFilter = (req, file, cb) => {
    const allowedMimeTypes = ['application/pdf', 'image/jpeg', 'image/png', 'image/webp'];
    const allowedExtensions = ['.pdf', '.jpg', '.jpeg', '.png', '.webp'];
    const fileExtension = path.extname(file.originalname).toLowerCase();

    // Reject files with double extensions (e.g. evil.php.jpg)
    const baseName = path.basename(file.originalname, fileExtension);
    if (baseName.includes('.')) {
        return cb(new Error('Invalid filename — double extensions not allowed'), false);
    }

    // Reject executable-looking names
    const dangerousExtensions = ['.php', '.js', '.exe', '.sh', '.bat', '.cmd', '.py', '.rb'];
    if (dangerousExtensions.some(ext => file.originalname.toLowerCase().includes(ext))) {
        return cb(new Error('File type not allowed'), false);
    }

    if (allowedMimeTypes.includes(file.mimetype) && allowedExtensions.includes(fileExtension)) {
        cb(null, true);
    } else {
        cb(new Error('Only PDF, JPG, PNG and WebP formats are accepted'), false);
    }
};

// Configure multer
const upload = multer({
    storage: storage,
    limits: {
        fileSize: 5 * 1024 * 1024, // 5MB in bytes
        files: 1 // Only one file allowed
    },
    fileFilter: fileFilter
});

// Export middleware for single file upload with field name 'license'
export const uploadLicense = upload.single('license');

// Error handling middleware for multer errors
export const handleUploadError = (err, req, res, next) => {
    if (err instanceof multer.MulterError) {
        // Multer-specific errors
        if (err.code === 'LIMIT_FILE_SIZE') {
            return res.status(400).json({
                success: false,
                message: 'File size must not exceed 5MB'
            });
        }
        if (err.code === 'LIMIT_FILE_COUNT') {
            return res.status(400).json({
                success: false,
                message: 'Only one file can be uploaded at a time'
            });
        }
        if (err.code === 'LIMIT_UNEXPECTED_FILE') {
            return res.status(400).json({
                success: false,
                message: 'Unexpected field name. Use "license" as the field name'
            });
        }
        return res.status(400).json({
            success: false,
            message: `Upload error: ${err.message}`
        });
    } else if (err) {
        // Other errors (like file filter errors)
        return res.status(400).json({
            success: false,
            message: err.message || 'File upload failed'
        });
    }
    next();
};

export default { uploadLicense, handleUploadError };

// ── Commission receipt upload ──
const receiptDir = 'backend/uploads/commission-receipts';
if (!fs.existsSync(receiptDir)) {
    fs.mkdirSync(receiptDir, { recursive: true });
}

const receiptStorage = multer.diskStorage({
    destination: (req, file, cb) => cb(null, receiptDir),
    filename: (req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const receiptFilter = (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WEBP images are accepted for receipts'), false);
};

export const uploadReceipt = multer({
    storage: receiptStorage,
    limits: { fileSize: 5 * 1024 * 1024, files: 1 },
    fileFilter: receiptFilter,
}).single('receipt');

// ── Profile avatar upload ──
const avatarDir = 'backend/uploads/avatars';
if (!fs.existsSync(avatarDir)) {
    fs.mkdirSync(avatarDir, { recursive: true });
}

const avatarStorage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, avatarDir),
    filename: (_req, file, cb) => {
        const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
        cb(null, uniqueName);
    },
});

const avatarFilter = (_req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp', 'image/jpg'];
    if (allowed.includes(file.mimetype)) cb(null, true);
    else cb(new Error('Only JPG, PNG, and WEBP images are accepted'), false);
};

export const uploadAvatar = multer({
    storage: avatarStorage,
    limits: { fileSize: 3 * 1024 * 1024, files: 1 },
    fileFilter: avatarFilter,
}).single('avatar');
