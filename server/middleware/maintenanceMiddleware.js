const Setting = require('../models/Setting');
const User = require('../models/User');
const jwt = require('jsonwebtoken');
const asyncHandler = require('express-async-handler');

const maintenanceMiddleware = asyncHandler(async (req, res, next) => {
    // Ayarları veritabanından al
    const settings = await Setting.findOne();

        // Eğer bakım modu aktif değilse hızlıca devam et
    if (!settings || !settings.maintenanceMode) {
        return next();
    }

        // Bakım ayarları ve durum Endpointlerini serbest bırak (PUT/GET)
    if (req.path.startsWith('/settings')) {
        return next();
    }

    // Bakım durumunu kontrol eden public endpointi serbest bırak
    if (req.path === '/settings/status') {
        return next();
    }

    // Adminin giriş yapabilmesi için login ve auth rotalarını serbest bırak
    if (req.path.startsWith('/users/login') || req.path.startsWith('/users/auth')) {
        return next();
    }

    let isAdmin = false;

    // 1) Authorization header
    let token = null;
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    } else if (req.cookies && req.cookies.token) {
        // 2) HTTP-only cookie fallback (token)
        token = req.cookies.token;
    }

    if (token) {
        try {
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.id || decoded.user?.id).select('role');
            if (user && user.role === 'admin') {
                isAdmin = true;
            }
        } catch (err) {
            // Token hatası: admin değil kabul et
        }
    }

    if (!isAdmin) {
        return res.status(503).json({
            success: false,
            message: settings.maintenanceMessage || 'Sitemiz şu anda bakımda. Lütfen daha sonra tekrar deneyin.'
        });
    }
    next();
});

module.exports = maintenanceMiddleware;
