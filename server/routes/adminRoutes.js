const express = require('express');
const router = express.Router();
const Order = require('../models/Order');
const User = require('../models/User').User;
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET /api/admin/stats
// @desc    Get dashboard statistics
router.get('/stats', protect, admin, async (req, res) => {
    try {
        const totalUsers = await User.countDocuments();
        const totalOrders = await Order.countDocuments();
        const totalProducts = await Product.countDocuments();
        const salesData = await Order.aggregate([ { $group: { _id: null, totalSales: { $sum: '$totalPrice' } } } ]);
        const totalSales = salesData.length > 0 ? salesData[0].totalSales : 0;
        res.json({ totalUsers, totalOrders, totalProducts, totalSales });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "İstatistikler alınırken sunucu hatası oluştu." });
    }
});

// @route   GET /api/admin/recent-orders
// @desc    Get recent orders for dashboard
router.get('/recent-orders', protect, admin, async (req, res) => {
    try {
        const recentOrders = await Order.find({}).sort({ createdAt: -1 }).limit(5).populate('user', 'name');
        res.json(recentOrders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Son siparişler alınırken sunucu hatası oluştu." });
    }
});

// @route   GET /api/admin/sales-summary
// @desc    Get monthly sales summary
router.get('/sales-summary', protect, admin, async (req, res) => {
    try {
        const salesSummary = await Order.aggregate([
            {
                $match: { status: 'Teslim Edildi' }
            },
            {
                $group: {
                    _id: {
                        year: { $year: "$createdAt" },
                        month: { $month: "$createdAt" }
                    },
                    totalSales: { $sum: "$totalPrice" }
                }
            },
            {
                $sort: { "_id.year": 1, "_id.month": 1 }
            }
        ]);
        res.json(salesSummary);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Satış raporu alınırken sunucu hatası oluştu." });
    }
});

// === YENİ ROTA: EKSİK ÜRÜN LİSTESİ ===
// @route   GET /api/admin/backorders
// @desc    Tüm siparişlerdeki eksik ürünleri (backorder) listeler
router.get('/backorders', protect, admin, async (req, res) => {
    try {
        const backordered = await Order.aggregate([
            // 1. Sadece içinde eksik ürün olan siparişleri filtrele
            { $match: { backorderedItems: { $exists: true, $ne: [] } } },
            // 2. Müşteri bilgilerini eklemek için 'users' koleksiyonu ile birleştir
            {
                $lookup: {
                    from: 'users',
                    localField: 'user',
                    foreignField: '_id',
                    as: 'customerInfo'
                }
            },
            // 3. 'backorderedItems' dizisini açarak her bir eksik ürünü ayrı bir belge yap
            { $unwind: '$backorderedItems' },
            // 4. Sadece gerekli alanları seçerek temiz bir çıktı oluştur
            {
                $project: {
                    orderId: '$_id',
                    orderDate: '$createdAt',
                    customerName: { $arrayElemAt: ['$customerInfo.name', 0] },
                    productName: '$backorderedItems.name',
                    productId: '$backorderedItems.product',
                    quantity: '$backorderedItems.qty',
                    _id: 0 // Her satır için yeni bir ID oluşturulmasını engelle
                }
            },
            // 5. En eski siparişe göre sırala
            { $sort: { orderDate: 1 } }
        ]);

        res.json(backordered);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Eksik ürünler listesi alınırken sunucu hatası oluştu." });
    }
});


// @route   GET /api/admin/salesreps
// @desc    Get all sales representatives
// @access  Private/Admin
router.get('/salesreps', protect, admin, async (req, res) => {
    try {
        const salesReps = await User.find({ role: 'sales_rep' }).select('_id name');
        res.json(salesReps);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Pazarlama temsilcileri alınırken sunucu hatası oluştu." });
    }
});

// @route   PUT /api/admin/users/:id/assign-salesrep
// @desc    Assign a sales representative to a user (customer)
// @access  Private/Admin
router.put('/users/:id/assign-salesrep', protect, admin, async (req, res) => {
    const { salesRepId } = req.body;
    const { id: customerId } = req.params;

    try {
        const customer = await User.findById(customerId);

        if (!customer) {
            return res.status(404).json({ msg: 'Müşteri bulunamadı.' });
        }

        // Atanacak kişinin gerçekten bir pazarlamacı olup olmadığını kontrol et (isteğe bağlı ama güvenli)
        if (salesRepId) {
            const salesRep = await User.findById(salesRepId);
            if (!salesRep || salesRep.role !== 'sales_rep') {
                return res.status(400).json({ msg: 'Geçersiz pazarlama temsilcisi.' });
            }
        }

        customer.salesRepresentative = salesRepId || null; // Eğer boş gelirse null ata
        await customer.save();

        res.json({ msg: 'Pazarlama temsilcisi başarıyla atandı.', user: customer });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Atama işlemi sırasında sunucu hatası oluştu." });
    }
});

// GEÇİCİ ROTA: Bir kullanıcıyı email ile admin yap
// @route   PUT /api/admin/make-admin
// @desc    Bir kullanıcıyı email adresine göre admin yapar
// @access  Public (GEÇİCİ - Sadece geliştirme için)
router.put('/make-admin', async (req, res) => {
    const { email } = req.body;
    if (!email) {
        return res.status(400).json({ msg: 'Lütfen bir email adresi girin.' });
    }
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(404).json({ msg: 'Bu email ile bir kullanıcı bulunamadı.' });
        }
        user.role = 'admin';
        // Admin yapılan kullanıcının hesabı onaylı değilse, onu da onayla
        user.isApproved = true;
        await user.save();
        res.json({ msg: `Kullanıcı ${email} başarıyla admin yapıldı ve hesabı onaylandı.`, user });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: "Kullanıcı admin yapılırken bir hata oluştu." });
    }
});

module.exports = router;