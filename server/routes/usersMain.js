const express = require('express');
const router = express.Router();

// Alt route dosyalarını import et
const authRoutes = require('./users/auth');
const profileRoutes = require('./users/profile');
const adminRoutes = require('./users/admin');
const wishlistRoutes = require('./users/wishlist');
const supplierRoutes = require('./users/supplier');

// Ana kullanıcı rotalarını alt modüllere yönlendir

// Eski istemci uyumluluğu için /auth prefix'i de destekle
router.use('/auth', authRoutes);
router.use('/profile', profileRoutes);
router.use('/admin', adminRoutes);
router.use('/wishlist', wishlistRoutes);
router.use('/supplier', supplierRoutes);

// Not: Eskiden burada bulunan tüm bireysel rota işleyicileri (register, login, profile, admin, wishlist vb.)
// kendi modüler dosyalarına (auth.js, profile.js, admin.js, wishlist.js) taşınmıştır.
// Bu dosya artık sadece bu modülleri bir araya getiren bir merkez görevi görmektedir.

module.exports = router;