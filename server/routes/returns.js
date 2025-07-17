const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Return = require('../models/Return');
const Order = require('../models/Order');
const Product = require('../models/Product');

// @route   POST /api/returns
// @desc    Yeni iade talebi oluştur
// @access  Private (Müşteri veya Pazarlamacı)
router.post('/', protect, async (req, res) => {
    const { orderId, products, description } = req.body;

    if (!description || description.trim() === '') {
        return res.status(400).json({ msg: 'İade açıklaması zorunludur.' });
    }

    try {
        const order = await Order.findById(orderId).populate('user');
        if (!order) {
            return res.status(404).json({ msg: 'Sipariş bulunamadı.' });
        }

        // Güvenlik kontrolü: İsteği yapan kullanıcı siparişin sahibi mi VEYA pazarlamacı mı?
        if (order.user._id.toString() !== req.user.id && req.user.role !== 'pazarlamaci' && req.user.role !== 'admin') {
            return res.status(401).json({ msg: 'Bu sipariş için iade talebi oluşturma yetkiniz yok.' });
        }

        const newReturn = new Return({
            customer: order.user._id,
            order: orderId,
            products,
            description,
            createdBy: req.user.id,
            status: 'İade Talebi Oluşturuldu'
        });

        const savedReturn = await newReturn.save();
        res.status(201).json(savedReturn);

    } catch (err) {
        console.error('İade oluşturma hatası:', err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   GET /api/returns
// @desc    Tüm iadeleri veya kullanıcının kendi iadelerini getir
// @access  Private
router.get('/', protect, async (req, res) => {
    try {
        let query = {};
        // Müşteri sadece kendi iadelerini görebilir
        if (req.user.role === 'customer') {
            query.customer = req.user.id;
        }
        // Pazarlamacı, sevkiyat ve admin tüm iadeleri görebilir
        else if (!['admin', 'pazarlamaci', 'sevkiyat', 'muhasebe'].includes(req.user.role)) {
            return res.status(403).json({ msg: 'Bu kaynağa erişim yetkiniz yok.' });
        }

        const returns = await Return.find(query)
            .populate('customer', 'name companyName')
            .populate('order', 'orderNumber')
            .populate('products.product', 'name images stockCode') // Ürün detaylarını ekle
            .sort({ createdAt: -1 });
            
        res.json(returns);

    } catch (err) {
        console.error('İadeler getirilirken hata:', err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   PUT /api/returns/:id/status
// @desc    Bir iadenin durumunu güncelle
// @access  Private (Sevkiyat, Muhasebe, Admin)
router.put('/:id/status', protect, async (req, res) => {
    const { status, notes } = req.body;
    const allowedRoles = ['admin', 'sevkiyat', 'muhasebe'];

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Bu işlemi yapma yetkiniz yok.' });
    }

    try {
        const returnRequest = await Return.findById(req.params.id);
        if (!returnRequest) {
            return res.status(404).json({ msg: 'İade talebi bulunamadı.' });
        }

        // Rol bazlı durum geçiş kontrolü
        const currentStatus = returnRequest.status;
        const userRole = req.user.role;

        const transitions = {
            'sevkiyat': ['İade Teslim Alındı', 'İncelemede'],
            'muhasebe': ['İncelemede', 'Onaylandı', 'Kısmen Onaylandı', 'Reddedildi', 'Tamamlandı'],
            'admin': Object.keys(Return.schema.path('status').enumValues) // Admin her duruma geçebilir
        };

        if (!transitions[userRole] || !transitions[userRole].includes(status)) {
            return res.status(403).json({ msg: `Rolünüz (${userRole}) bu iadeyi '${status}' durumuna getiremez.` });
        }

        returnRequest.status = status;
        returnRequest.history.push({
            status: status,
            updatedBy: req.user.id,
            notes: notes || 'Durum güncellendi.'
        });

        await returnRequest.save();
        res.json(returnRequest);

    } catch (err) {
        console.error('İade durumu güncellenirken hata:', err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   POST /api/returns/:id/process-financials
// @desc    Bir iadeyi finansal olarak işle ve müşteri bakiyesini güncelle
// @access  Private (Muhasebe, Admin)
router.post('/:id/process-financials', protect, async (req, res) => {
    const { productsWithPrices } = req.body; // [{ productId, quantity, priceAtReturn }]
    const allowedRoles = ['admin', 'muhasebe'];

    if (!allowedRoles.includes(req.user.role)) {
        return res.status(403).json({ msg: 'Bu işlemi yapma yetkiniz yok.' });
    }

    try {
        const returnRequest = await Return.findById(req.params.id).populate('customer');
        if (!returnRequest) {
            return res.status(404).json({ msg: 'İade talebi bulunamadı.' });
        }

        if (returnRequest.financial.isProcessed) {
            return res.status(400).json({ msg: 'Bu iade zaten finansal olarak işlenmiş.' });
        }

        let totalRefundAmount = 0;
        for (const item of productsWithPrices) {
            const productInReturn = returnRequest.products.find(p => p.product.toString() === item.productId);
            if (productInReturn) {
                productInReturn.priceAtReturn = item.priceAtReturn;
                totalRefundAmount += item.priceAtReturn * productInReturn.quantity;
            }
        }

        // Müşteri bakiyesini güncelle
        const customer = returnRequest.customer;
        customer.balance -= totalRefundAmount;
        await customer.save();

        // İade kaydını finansal olarak güncelle
        returnRequest.financial.totalRefundAmount = totalRefundAmount;
        returnRequest.financial.isProcessed = true;
        returnRequest.financial.processedBy = req.user.id;
        returnRequest.financial.processedAt = Date.now();
        returnRequest.status = 'Tamamlandı'; // Durumu 'Tamamlandı' olarak ayarla
        returnRequest.history.push({
            status: 'Tamamlandı',
            updatedBy: req.user.id,
            notes: `Finansal işlem tamamlandı. Müşteri hesabından ${totalRefundAmount.toFixed(2)} TL düşüldü.`
        });

        await returnRequest.save();

        res.json({ 
            msg: 'Finansal işlem başarıyla tamamlandı.', 
            returnRequest,
            newBalance: customer.balance 
        });

    } catch (err) {
        console.error('Finansal işlem sırasında hata:', err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   GET /api/returns/:id
// @desc    Tek bir iade talebinin detaylarını getir
// @access  Private
router.get('/:id', protect, async (req, res) => {
    try {
        const returnRequest = await Return.findById(req.params.id)
            .populate('customer', 'name companyName email')
            .populate('order', 'orderNumber')
            .populate('products.product', 'name images stockCode')
            .populate('history.updatedBy', 'name');

        if (!returnRequest) {
            return res.status(404).json({ msg: 'İade talebi bulunamadı.' });
        }

        // Güvenlik: Müşteri sadece kendi iadesini görebilir
        if (req.user.role === 'customer' && returnRequest.customer._id.toString() !== req.user.id) {
             return res.status(403).json({ msg: 'Bu kaynağa erişim yetkiniz yok.' });
        }

        res.json(returnRequest);

    } catch (err) {
        console.error('İade detayı getirilirken hata:', err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

module.exports = router;
