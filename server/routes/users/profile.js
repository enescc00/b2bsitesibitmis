const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorHandler = require('../../utils/errorHandler');
const { User } = require('../../models/User');
const bcrypt = require('bcryptjs');
const { protect } = require('../../middleware/authMiddleware');

// @route   GET /api/users/profile
// @desc    Giriş yapmış kullanıcının kendi profilini getirir
// @access  Private
router.get('/', protect, (req, res) => {
    res.json(req.user);
});

// @route   GET /api/users/statement
// @desc    Giriş yapmış kullanıcının cari hesap ekstresini getirir
// @access  Private
router.get('/statement', protect, asyncHandler(async (req, res) => {
    const userId = req.user._id;
    const Order = require('../../models/Order');
    const CashboxTransaction = require('../../models/CashboxTransaction');

    const debtOrders = await Order.find({ user: userId, paymentMethod: 'Cari Hesap' })
        .select('orderItems totalPrice createdAt');

    const debtTransactions = debtOrders.map(o => ({
        date: o.createdAt,
        description: o.orderItems.map(i => `${i.qty}x ${i.name}`).join(', '),
        amount: -Math.abs(o.totalPrice) // borç negatif
    }));

    const paymentTransactions = await CashboxTransaction.find({ customer: userId, type: 'income' })
        .select('amount date description');

    const incomeTransactions = paymentTransactions.map(t => ({
        date: t.date,
        description: t.description || 'Ödeme',
        amount: Math.abs(t.amount)
    }));

    const all = [...debtTransactions, ...incomeTransactions].sort((a,b)=> new Date(a.date)-new Date(b.date));
    let balance = 0;
    const statement = all.map(entry => {
        balance += entry.amount;
        return { ...entry, balance };
    });

    res.json(statement);

}));

// @route   PUT /api/users/profile
// @desc    Kullanıcı kendi profilini günceller
// @access  Private
router.put('/', protect, [
    body('name').optional().not().isEmpty().trim().escape(),
    body('address.province').optional().not().isEmpty().trim().escape(),
    body('address.district').optional().not().isEmpty().trim().escape(),
    body('address.fullAddress').optional().not().isEmpty().trim().escape(),
    body('address.addressTitle').optional().not().isEmpty().trim().escape()
], asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return next(new ErrorHandler(errors.array(), 400));
    }

    const { name, address } = req.body;
    const updates = {};

    if (name) updates.name = name;
    if (address) {
        const addressUpdates = {};
        if (address.province) addressUpdates.province = address.province;
        if (address.district) addressUpdates.district = address.district;
        if (address.fullAddress) addressUpdates.fullAddress = address.fullAddress;
        if (address.addressTitle) addressUpdates.addressTitle = address.addressTitle;

        if (Object.keys(addressUpdates).length > 0) {
            if (address._id) {
                const updatedAddress = await User.updateOne(
                    { _id: req.user._id, 'addresses._id': address._id },
                    { $set: { 'addresses.$': { ...addressUpdates } } }
                );
                if (updatedAddress.modifiedCount === 0) {
                    return next(new ErrorHandler('Adres bulunamadı.', 404));
                }
            } else {
                updates.$push = { addresses: addressUpdates };
            }
        }
    }

    if (Object.keys(updates).length > 0) {
        const updatedUser = await User.findByIdAndUpdate(
            req.user._id,
            updates,
            { new: true }
        );
        res.json(updatedUser);
    } else {
        res.json(req.user);
    }
}));

// @route   PUT /api/users/profile/password
// @desc    Kullanıcı kendi şifresini günceller
// @access  Private
router.put('/password', protect, asyncHandler(async (req, res, next) => {
    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
        return next(new ErrorHandler('Mevcut ve yeni şifre gerekli.', 400));
    }

    const user = await User.findById(req.user._id).select('+password');
    const isMatch = await bcrypt.compare(currentPassword, user.password);
    if (!isMatch) {
        return next(new ErrorHandler('Mevcut şifre yanlış.', 401));
    }

    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);
    user.password = hashedPassword;
    await user.save();
    
    res.json({ msg: 'Şifre başarıyla güncellendi.' });
}));

module.exports = router;
