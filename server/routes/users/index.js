const express = require('express');
const router = express.Router();

// Auth routes
const authRoutes = require('./auth');
router.use('/auth', authRoutes);

// Profile routes
const profileRoutes = require('./profile');
router.use('/profile', profileRoutes);

// Admin routes
const adminRoutes = require('./admin');
router.use('/admin', adminRoutes);

// Wishlist routes
const wishlistRoutes = require('./wishlist');
router.use('/wishlist', wishlistRoutes);

module.exports = router;
