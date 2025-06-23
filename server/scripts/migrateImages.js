const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const path = require('path');
const dotenv = require('dotenv');
const mongoose = require('mongoose');
const Product = require('../models/Product');

// Load environment variables
dotenv.config({ path: path.resolve(__dirname, '../config/config.env') });

// Configure Cloudinary
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET
});

// Connect to MongoDB
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI, {
      useNewUrlParser: true,
      useUnifiedTopology: true,
    });
    console.log('MongoDB Connected...');
  } catch (err) {
    console.error('MongoDB Connection Error:', err.message);
    process.exit(1);
  }
};

const migrateImages = async () => {
  await connectDB();

  const uploadsDir = path.resolve(__dirname, '../uploads');
  if (!fs.existsSync(uploadsDir)) {
    console.log('"uploads" directory not found. No images to migrate.');
    process.exit(0);
  }

  const files = fs.readdirSync(uploadsDir);

  if (files.length === 0) {
    console.log('No images found in the "uploads" directory.');
    process.exit(0);
  }

  console.log(`Found ${files.length} images to migrate.`);

  for (const file of files) {
    const localPath = path.join(uploadsDir, file);
    const legacyUrl = `/uploads/${file}`;

    try {
      // Find products that use the old local URL
      const productsToUpdate = await Product.find({ images: legacyUrl });

      if (productsToUpdate.length > 0) {
        console.log(`Migrating ${file} used by ${productsToUpdate.length} product(s)...`);

        // Upload to Cloudinary
        const result = await cloudinary.uploader.upload(localPath, {
          folder: 'b2b-sitesi/migrated',
          public_id: path.parse(file).name,
          format: 'webp',
          transformation: [{ width: 1000, height: 1000, crop: 'limit' }]
        });

        const newUrl = result.secure_url;

        // Update all found products
        for (const product of productsToUpdate) {
          product.images = product.images.map(img => (img === legacyUrl ? newUrl : img));
          await product.save();
          console.log(`  - Updated product: ${product.name} (ID: ${product._id})`);
        }

        console.log(`  -> Successfully migrated ${file} to ${newUrl}`);
      } else {
        console.log(`Skipping ${file}, not used by any product.`);
      }
    } catch (error) {
      console.error(`Failed to migrate ${file}. Error: ${error.message}`);
    }
  }

  console.log('\nImage migration finished.');
  process.exit(0);
};

migrateImages();
