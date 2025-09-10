import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  width: number;
  height: number;
  format: string;
  resource_type: string;
}

export async function uploadToCloudinary(
  file: Buffer | string,
  options?: {
    folder?: string;
    public_id?: string;
    transformation?: Record<string, unknown>;
  }
): Promise<CloudinaryUploadResult> {
  try {
    // Convert Buffer to base64 data URL if needed
    const fileToUpload = Buffer.isBuffer(file) 
      ? `data:image/jpeg;base64,${file.toString('base64')}`
      : file;

    const result: CloudinaryUploadResult = await cloudinary.uploader.upload(fileToUpload, {
      folder: options?.folder || 'motortech',
      public_id: options?.public_id,
      transformation: options?.transformation,
      resource_type: 'auto',
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      width: result.width,
      height: result.height,
      format: result.format,
      resource_type: result.resource_type,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload image to Cloudinary');
  }
}

export async function deleteFromCloudinary(publicId: string): Promise<void> {
  try {
    await cloudinary.uploader.destroy(publicId);
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    throw new Error('Failed to delete image from Cloudinary');
  }
}

export async function getCloudinarySignature(
  paramsToSign: Record<string, string | number>
): Promise<string> {
  return cloudinary.utils.api_sign_request(paramsToSign, process.env.CLOUDINARY_API_SECRET!);
}

export { cloudinary };