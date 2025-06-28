const Setting = require('../models/Setting');
const asyncHandler = require('express-async-handler');

const maintenanceMiddleware = asyncHandler(async (req, res, next) => {
    // Ayarları veritabanından al
    const settings = await Setting.findOne();

    // Kullanıcının admin olup olmadığını kontrol et
    const isAdmin = req.user && req.user.role === 'admin';

    // Bakım modu aktifse ve kullanıcı admin değilse
    if (settings && settings.maintenanceMode && !isAdmin) {
        // Bakım sayfasını veya mesajını gönder
        return res.status(503).json({ 
            success: false, 
            message: settings.maintenanceMessage || 'Sitemiz şu anda bakımda. Lütfen daha sonra tekrar deneyin.' 
        });
    }

    // Bakım modu aktif değilse veya kullanıcı admin ise, devam et
    next();
});

module.exports = maintenanceMiddleware;
