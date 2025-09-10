"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.uploadRoutes = void 0;
const express_1 = require("express");
const multer_1 = __importDefault(require("multer"));
const cloudinary_1 = require("cloudinary");
const errorHandler_1 = require("../middleware/errorHandler");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
exports.uploadRoutes = router;
cloudinary_1.v2.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});
const storage = multer_1.default.memoryStorage();
const upload = (0, multer_1.default)({
    storage,
    limits: {
        fileSize: 10 * 1024 * 1024,
    },
    fileFilter: (req, file, cb) => {
        if (file.mimetype.startsWith('image/')) {
            cb(null, true);
        }
        else {
            cb(new Error('Only image files are allowed'));
        }
    },
});
router.post('/image', auth_1.authenticateToken, upload.single('image'), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    if (!req.file) {
        throw (0, errorHandler_1.createError)('No image file provided', 400);
    }
    try {
        const result = await new Promise((resolve, reject) => {
            cloudinary_1.v2.uploader.upload_stream({
                resource_type: 'image',
                folder: 'motortech/cars',
                transformation: [
                    { width: 1200, height: 800, crop: 'limit' },
                    { quality: 'auto' },
                    { format: 'auto' }
                ]
            }, (error, result) => {
                if (error) {
                    reject(error);
                }
                else {
                    resolve(result);
                }
            }).end(req.file.buffer);
        });
        const uploadResult = result;
        res.status(200).json({
            success: true,
            message: 'Image uploaded successfully',
            image: {
                url: uploadResult.secure_url,
                publicId: uploadResult.public_id,
                width: uploadResult.width,
                height: uploadResult.height
            }
        });
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        throw (0, errorHandler_1.createError)('Failed to upload image', 500);
    }
}));
router.post('/images', auth_1.authenticateToken, upload.array('images', 10), (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
        throw (0, errorHandler_1.createError)('No image files provided', 400);
    }
    try {
        const uploadPromises = req.files.map((file) => {
            return new Promise((resolve, reject) => {
                cloudinary_1.v2.uploader.upload_stream({
                    resource_type: 'image',
                    folder: 'motortech/cars',
                    transformation: [
                        { width: 1200, height: 800, crop: 'limit' },
                        { quality: 'auto' },
                        { format: 'auto' }
                    ]
                }, (error, result) => {
                    if (error) {
                        reject(error);
                    }
                    else {
                        resolve(result);
                    }
                }).end(file.buffer);
            });
        });
        const results = await Promise.all(uploadPromises);
        const uploadResults = results;
        const images = uploadResults.map(result => ({
            url: result.secure_url,
            publicId: result.public_id,
            width: result.width,
            height: result.height
        }));
        res.status(200).json({
            success: true,
            message: `${images.length} images uploaded successfully`,
            images
        });
    }
    catch (error) {
        console.error('Cloudinary upload error:', error);
        throw (0, errorHandler_1.createError)('Failed to upload images', 500);
    }
}));
router.delete('/image/:publicId', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { publicId } = req.params;
    if (!publicId) {
        throw (0, errorHandler_1.createError)('Public ID is required', 400);
    }
    try {
        const result = await cloudinary_1.v2.uploader.destroy(publicId);
        if (result.result === 'ok') {
            res.status(200).json({
                success: true,
                message: 'Image deleted successfully'
            });
        }
        else {
            throw (0, errorHandler_1.createError)('Failed to delete image', 400);
        }
    }
    catch (error) {
        console.error('Cloudinary delete error:', error);
        throw (0, errorHandler_1.createError)('Failed to delete image', 500);
    }
}));
router.post('/transform', auth_1.authenticateToken, (0, errorHandler_1.asyncHandler)(async (req, res) => {
    if (!req.user) {
        throw (0, errorHandler_1.createError)('Authentication required', 401);
    }
    const { publicId, transformations } = req.body;
    if (!publicId) {
        throw (0, errorHandler_1.createError)('Public ID is required', 400);
    }
    try {
        const transformedUrl = cloudinary_1.v2.url(publicId, {
            ...transformations,
            secure: true
        });
        res.status(200).json({
            success: true,
            transformedUrl
        });
    }
    catch (error) {
        console.error('Cloudinary transformation error:', error);
        throw (0, errorHandler_1.createError)('Failed to generate transformed URL', 500);
    }
}));
//# sourceMappingURL=upload.js.map