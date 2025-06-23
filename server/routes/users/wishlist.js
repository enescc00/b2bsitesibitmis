const express = require('express');
const router = express.Router();
const asyncHandler = require('express-async-handler');
const ErrorHandler = require('../../utils/errorHandler');
const { User } = require('../../models/User');
const { protect } = require('../../middleware/authMiddleware');

// @route   GET /api/users/wishlist
// @desc    Kullanıcının favori listesini getir
// @access  Private
router.get('/', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id).populate({
        path: 'wishlist',
        select: 'name salePrice images category',
        populate: {
            path: 'category',
            select: 'name'
        }
    });
    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
    }

    res.json(user.wishlist);
}));

// @route   POST /api/users/wishlist
// @desc    Ürünü favori listesine ekle (body'de productId)
// @access  Private
router.post('/', protect, asyncHandler(async (req, res, next) => {
    const { productId } = req.body;
    if (!productId) {
        return next(new ErrorHandler('Ürün ID bulunamadı.', 400));
    }
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
    }

    if (user.wishlist.includes(productId)) {
        return next(new ErrorHandler('Bu ürün zaten favorilerinizde.', 400));
    }

    user.wishlist.push(productId);
    await user.save();
    res.json(user.wishlist);
}));

// @route   POST /api/users/wishlist/:productId
// @desc    Ürünü favori listesine ekle (parametre)
// @access  Private
router.post('/:productId', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
    }

    // Eğer ürün zaten favorilerdeyse hata ver
    if (user.wishlist.includes(req.params.productId)) {
        return next(new ErrorHandler('Bu ürün zaten favorilerinizde.', 400));
    }

    user.wishlist.push(req.params.productId);
    await user.save();
    res.json(user.wishlist);
}));

// @route   DELETE /api/users/wishlist/:productId
// @desc    Ürünü favori listesinden kaldır
// @access  Private
router.delete('/:productId', protect, asyncHandler(async (req, res, next) => {
    const user = await User.findById(req.user._id);
    if (!user) {
        return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
    }

    user.wishlist = user.wishlist.filter(id => id.toString() !== req.params.productId);
    await user.save();
    res.json(user.wishlist);
}));

module.exports = router;
