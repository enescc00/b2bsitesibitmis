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

    // Adminin giriş yapabilmesi için auth rotalarını serbest bırak
    if (req.path.startsWith('/users/auth')) {
        return next();
    }

    let isAdmin = false;

    // Authorization header varsa token'ı çözümleyelim
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        try {
            const token = req.headers.authorization.split(' ')[1];
            const decoded = jwt.verify(token, process.env.JWT_SECRET);
            const user = await User.findById(decoded.user.id).select('role');
            if (user && user.role === 'admin') {
                isAdmin = true;
            }
        } catch (err) {
            // Token hatalarını yoksay, admin değil kabul et
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
