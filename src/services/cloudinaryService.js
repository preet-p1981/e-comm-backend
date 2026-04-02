import { v2 as cloudinary } from 'cloudinary';
import { env } from '../config/env.js';

cloudinary.config({
  cloud_name: env.cloudinaryCloudName,
  api_key: env.cloudinaryApiKey,
  api_secret: env.cloudinaryApiSecret
});

export const uploadBufferToCloudinary = (buffer, folder = 'ecommerce/products') => new Promise((resolve, reject) => {
  const stream = cloudinary.uploader.upload_stream({ folder, resource_type: 'image' }, (error, result) => {
    if (error) return reject(error);
    return resolve(result);
  });
  stream.end(buffer);
});

export const destroyCloudinaryAsset = (publicId) => cloudinary.uploader.destroy(publicId);
