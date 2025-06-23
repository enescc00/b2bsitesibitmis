const cloudinary = require('cloudinary').v2;
const { CloudinaryStorage } = require('multer-storage-cloudinary');
const multer = require('multer');

cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

const storage = new CloudinaryStorage({
  cloudinary: cloudinary,
  params: {
    folder: 'b2b-sitesi',
    format: async (req, file) => 'webp', // Convert images to WebP format
    public_id: (req, file) => `${file.fieldname}-${Date.now()}`,
    transformation: [{ width: 1000, height: 1000, crop: 'limit' }] // Resize images
  },
});

const upload = multer({ storage: storage });

module.exports = upload;
