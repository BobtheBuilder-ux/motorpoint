import { Router, Request, Response } from 'express';
import multer from 'multer';
import { v2 as cloudinary } from 'cloudinary';
import { asyncHandler, createError } from '../middleware/errorHandler';
import { authenticateToken, AuthenticatedRequest } from '../middleware/auth';

const router = Router();

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

// Configure multer for memory storage
const storage = multer.memoryStorage();
const upload = multer({
  storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Check file type
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed'));
    }
  },
});

// Upload single image
router.post('/image', authenticateToken, upload.single('image'), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  if (!req.file) {
    throw createError('No image file provided', 400);
  }

  try {
    // Upload to Cloudinary
    const result = await new Promise((resolve, reject) => {
      cloudinary.uploader.upload_stream(
        {
          resource_type: 'image',
          folder: 'motortech/cars',
          transformation: [
            { width: 1200, height: 800, crop: 'limit' },
            { quality: 'auto' },
            { format: 'auto' }
          ]
        },
        (error, result) => {
          if (error) {
            reject(error);
          } else {
            resolve(result);
          }
        }
      ).end(req.file!.buffer);
    });

    const uploadResult = result as any;

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
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw createError('Failed to upload image', 500);
  }
}));

// Upload multiple images
router.post('/images', authenticateToken, upload.array('images', 10), asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  if (!req.files || !Array.isArray(req.files) || req.files.length === 0) {
    throw createError('No image files provided', 400);
  }

  try {
    const uploadPromises = req.files.map((file) => {
      return new Promise((resolve, reject) => {
        cloudinary.uploader.upload_stream(
          {
            resource_type: 'image',
            folder: 'motortech/cars',
            transformation: [
              { width: 1200, height: 800, crop: 'limit' },
              { quality: 'auto' },
              { format: 'auto' }
            ]
          },
          (error, result) => {
            if (error) {
              reject(error);
            } else {
              resolve(result);
            }
          }
        ).end(file.buffer);
      });
    });

    const results = await Promise.all(uploadPromises);
    const uploadResults = results as any[];

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
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw createError('Failed to upload images', 500);
  }
}));

// Delete image from Cloudinary
router.delete('/image/:publicId', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { publicId } = req.params;

  if (!publicId) {
    throw createError('Public ID is required', 400);
  }

  try {
    // Delete from Cloudinary
    const result = await cloudinary.uploader.destroy(publicId);

    if (result.result === 'ok') {
      res.status(200).json({
        success: true,
        message: 'Image deleted successfully'
      });
    } else {
      throw createError('Failed to delete image', 400);
    }
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw createError('Failed to delete image', 500);
  }
}));

// Get image transformation URL
router.post('/transform', authenticateToken, asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.user) {
    throw createError('Authentication required', 401);
  }

  const { publicId, transformations } = req.body;

  if (!publicId) {
    throw createError('Public ID is required', 400);
  }

  try {
    // Generate transformation URL
    const transformedUrl = cloudinary.url(publicId, {
      ...transformations,
      secure: true
    });

    res.status(200).json({
      success: true,
      transformedUrl
    });
  } catch (error) {
    console.error('Cloudinary transformation error:', error);
    throw createError('Failed to generate transformed URL', 500);
  }
}));

export { router as uploadRoutes };