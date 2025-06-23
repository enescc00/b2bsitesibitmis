const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorHandler = require('../../utils/errorHandler');
const { User } = require('../../models/User');
const { protect, admin } = require('../../middleware/authMiddleware');

// @route   GET /api/users/admin/salesreps
// @desc    Tüm satış temsilcilerini getir
// @access  Private/Admin
router.get('/salesreps', protect, admin, asyncHandler(async (req, res) => {
    const salesReps = await User.find({ role: 'sales_rep' }).select('id name');
    res.json(salesReps);
}));

// @route   GET /api/users/admin/:id
// @desc    Belirtilen kullanıcıyı getir
// @access  Private/Admin
router.get('/:id', protect, admin, asyncHandler(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler('Geçersiz Kullanıcı IDsi.', 404));
    }

    const userToFetch = await User.findById(req.params.id).select('-password');
    if (!userToFetch) {
        return next(new ErrorHandler('Kullanıcı bulunamadı', 404));
    }

    const requester = req.user;
    const isAdminCheck = requester.role === 'admin';
    const isMyCustomer = requester.role === 'sales_rep' && userToFetch.salesRepresentative?.toString() === requester._id.toString();

    if (isAdminCheck || isMyCustomer) {
        return res.json(userToFetch);
    } else {
        return next(new ErrorHandler('Bu kullanıcı bilgilerini görüntüleme yetkiniz yok.', 403));
    }
}));

// @route   PUT /api/users/admin/:id
// @desc    Admin tarafından bir kullanıcıyı günceller
// @access  Private/Admin
router.put('/:id', protect, admin, [
    body('name').optional().not().isEmpty().trim().escape(),
    body('email').optional().isEmail().normalizeEmail(),
    body('role').optional().isIn(['user', 'customer', 'supplier', 'sales_rep', 'admin']),
    body('isApproved').optional().isBoolean(),
    body('salesRepresentative').optional().isMongoId(),
    body('address.province').optional().not().isEmpty().trim().escape(),
    body('address.district').optional().not().isEmpty().trim().escape(),
    body('address.fullAddress').optional().not().isEmpty().trim().escape(),
    body('address.addressTitle').optional().not().isEmpty().trim().escape()
], asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        const firstError = errors.array({ onlyFirstError: true })[0];
        return next(new ErrorHandler(firstError.msg, 400));
    }

    const { name, email, role, isApproved, address, companyTitle, currentAccountBalance } = req.body;
    const updates = {};
    // findByIdAndUpdate options
    let options = { new: true };

    if (name) updates.name = name;
    if (email) updates.email = email;
    if (role) updates.role = role;
    if (isApproved !== undefined) updates.isApproved = isApproved;
    if (companyTitle) updates.companyTitle = companyTitle;
    if (currentAccountBalance !== undefined) {
        updates.currentAccountBalance = currentAccountBalance;
    }

    if (address) {
        const addressUpdates = {};
        if (address.province) addressUpdates.province = address.province;
        if (address.district) addressUpdates.district = address.district;
        if (address.fullAddress) addressUpdates.fullAddress = address.fullAddress;
        if (address.addressTitle) addressUpdates.addressTitle = address.addressTitle;

        if (Object.keys(addressUpdates).length > 0) {
            if (address._id) {
                // Use positional array operator with arrayFilters to update matching address
                updates.$set = {};
                Object.entries(addressUpdates).forEach(([key, val]) => {
                    updates.$set[`addresses.$[addr].${key}`] = val;
                });
                options.arrayFilters = [{ 'addr._id': address._id }];
            } else {
                updates.$push = { addresses: addressUpdates };
            }
        }
    }

    const user = await User.findByIdAndUpdate(
        req.params.id,
        updates,
        options
    ).select('-password');

    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
    }

    res.json(user);
}));

// @route   DELETE /api/users/admin/:id
// @desc    Admin tarafından bir kullanıcıyı siler
// @access  Private/Admin
router.delete('/:id', protect, admin, asyncHandler(async (req, res, next) => {
    if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
        return next(new ErrorHandler('Geçersiz Kullanıcı IDsi.', 404));
    }

    const user = await User.findById(req.params.id);
    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
    }

    await User.findByIdAndDelete(req.params.id);
    res.json({ msg: 'Kullanıcı başarıyla silindi.' });
}));

// @route   GET /api/users/admin
// @desc    Tüm kullanıcıları getir (admin için)
// @access  Private/Admin
router.get('/', protect, admin, asyncHandler(async (req, res, next) => {
    const { keyword, page = 1, limit = 10 } = req.query;
    const query = {};

    if (keyword) {
        query.$or = [
            { name: { $regex: keyword, $options: 'i' } },
            { email: { $regex: keyword, $options: 'i' } }
        ];
    }

    try {
        const users = await User.find(query)
            .select('-password')
            .skip((page - 1) * limit)
            .limit(limit);

        const count = await User.countDocuments(query);
        
        res.json({
            users,
            totalPages: Math.ceil(count / limit),
            currentPage: page
        });
    } catch (err) {
        next(new ErrorHandler('Kullanıcılar getirilemedi.', 500));
    }
}));

// @route   PUT /api/users/admin/:id/approve
// @desc    Admin tarafından bir kullanıcıyı onaylar
// @access  Private/Admin
router.put('/:id/approve', protect, admin, asyncHandler(async (req, res, next) => {
    try {
        console.log('Onaylama isteği alındı. Kullanıcı ID:', req.params.id);
        
        // Kullanıcı ID'sini doğrula
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            console.error('Geçersiz Kullanıcı ID formatı:', req.params.id);
            return next(new ErrorHandler('Geçersiz Kullanıcı IDsi.', 400));
        }

        // Kullanıcıyı bul
        const user = await User.findByIdAndUpdate(
            req.params.id,
            { isApproved: true, approvedAt: Date.now(), salesRepresentative: req.body.salesRepresentative },
            { new: true }
        ).select('-password');

        if (!user) {
            console.error('Kullanıcı bulunamadı. ID:', req.params.id);
            return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
        }

        console.log('Kullanıcı başarıyla onaylandı. ID:', user._id);
        
        // Başarılı yanıt döndür
        res.json({ 
            success: true, 
            msg: 'Kullanıcı başarıyla onaylandı.', 
            user: {
                _id: user._id,
                name: user.name,
                email: user.email,
                isApproved: user.isApproved,
                approvedAt: user.approvedAt
            }
        });
    } catch (error) {
        console.error('Onaylama işleminde hata:', error);
        next(new ErrorHandler('Kullanıcı onaylanırken bir hata oluştu.', 500));
    }
}));

module.exports = router;
