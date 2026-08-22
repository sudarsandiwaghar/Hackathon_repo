const multer = require('multer');
const cloudinary = require('../config/cloudinary');

// Use memory storage — files stored in buffer, then uploaded to Cloudinary via SDK
const storage = multer.memoryStorage();

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB max
  },
  fileFilter: (req, file, cb) => {
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp'];
    if (allowedTypes.includes(file.mimetype)) {
      cb(null, true);
    } else {
      cb(
        new Error('Invalid file type. Only JPG, PNG, and WebP are allowed.'),
        false
      );
    }
  },
});

/**
 * Upload a buffer to Cloudinary and return the secure URL.
 * @param {Buffer} buffer - File buffer from multer
 * @param {string} folder - Cloudinary folder path
 * @returns {Promise<string>} Cloudinary secure URL
 */
const uploadToCloudinary = (buffer, folder = 'dayflow/employees') => {
  return new Promise((resolve, reject) => {
    const stream = cloudinary.uploader.upload_stream(
      {
        folder,
        allowed_formats: ['jpg', 'jpeg', 'png', 'webp'],
        transformation: [
          { width: 400, height: 400, crop: 'fill', gravity: 'face' },
        ],
      },
      (error, result) => {
        if (error) reject(error);
        else resolve(result.secure_url);
      }
    );

    stream.end(buffer);
  });
};

module.exports = { upload, uploadToCloudinary };
