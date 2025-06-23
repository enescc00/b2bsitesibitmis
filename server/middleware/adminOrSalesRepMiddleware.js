const asyncHandler = require('express-async-handler');

/**
 * adminOrSalesRep Middleware
 * Bu middleware, bir kullanıcının 'admin' veya 'sales_rep' rollerinden birine sahip olup olmadığını kontrol eder.
 * Her zaman 'protect' middleware'inden sonra kullanılmalıdır.
 */
const adminOrSalesRep = asyncHandler(async (req, res, next) => {
    // 'protect' middleware'i sayesinde req.user objesinin var olduğunu varsayıyoruz.
    if (req.user && (req.user.role === 'admin' || req.user.role === 'sales_rep')) {
        // Eğer kullanıcı admin veya satış temsilcisi ise, sonraki adıma geç.
        next();
    } else {
        res.status(403); // 403 Forbidden - Yasak
        throw new Error('Bu işlemi yapmak için yetkiniz yok.');
    }
});

module.exports = { adminOrSalesRep };