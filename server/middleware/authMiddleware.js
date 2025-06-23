const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');
const { User } = require('../models/User');
const ErrorHandler = require('../utils/errorHandler');

// Kullanıcının giriş yapıp yapmadığını kontrol eden middleware
const protect = asyncHandler(async (req, res, next) => {
    let token;

    // Token'ı Authorization header'ından al (Bearer TOKEN formatında)
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            // 'Bearer ' kısmını atıp sadece token'ı al
            token = req.headers.authorization.split(' ')[1];

            // Token'ı doğrula
            const decoded = jwt.verify(token, process.env.JWT_SECRET);

            // Token'dan gelen kullanıcı ID'si ile kullanıcıyı bul ve req objesine ekle
            // şifreyi dışarıda bırak
            req.user = await User.findById(decoded.user.id).select('-password');

            next(); // Sonraki işleme geç
        } catch (error) {
            console.error(error);
            res.status(401);
            throw new Error('Yetkiniz yok, token doğrulanamadı.');
        }
    }

    if (!token) {
        res.status(401);
        throw new Error('Yetkiniz yok, token bulunamadı.');
    }
});


// Kullanıcının admin olup olmadığını kontrol eden middleware
const admin = (req, res, next) => {
    if (req.user && req.user.role === 'admin') {
        next(); // Kullanıcı admin ise sonraki işleme geç
    } else {
        res.status(403); // 403 Forbidden - Yasak
        throw new Error('Bu işlemi yapmak için admin yetkiniz yok.');
    }
};

// Kullanıcının satış temsilcisi (veya admin) olup olmadığını kontrol eden middleware
const salesrep = (req, res, next) => {
    if (req.user && (req.user.role === 'sales_rep' || req.user.role === 'admin')) {
        return next();
    }
    return next(new ErrorHandler('Bu alana erişim için yetkiniz bulunmamaktadır.', 403));
};

module.exports = { protect, admin, salesrep };