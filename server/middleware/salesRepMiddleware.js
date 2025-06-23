const asyncHandler = require('express-async-handler');

const isSalesRep = asyncHandler(async (req, res, next) => {
    // Bu middleware'in her zaman 'protect' middleware'inden sonra çalışacağını varsayıyoruz.
    if (req.user && (req.user.role === 'sales_rep' || req.user.role === 'admin')) {
        // Eğer kullanıcı satış temsilcisi veya admin ise, devam et.
        // Adminlerin de bu rotalara erişebilmesi test ve yönetim kolaylığı sağlar.
        next();
    } else {
        res.status(403); // Forbidden
        throw new Error('Erişim reddedildi. Bu işlem için yetkiniz yok.');
    }
});

module.exports = { isSalesRep };