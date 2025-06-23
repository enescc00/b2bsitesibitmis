const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect } = require('../middleware/authMiddleware');
const { isSalesRep } = require('../middleware/salesRepMiddleware');
const { User } = require('../models/User');
const Order = require('../models/Order');
const CashboxTransaction = require('../models/CashboxTransaction');
const Product = require('../models/Product');
const { getAssignedCustomers } = require('../controllers/salesrep/customerController');

// Bu dosyadaki tüm rotalar önce giriş yapmış olmayı, sonra da satış temsilcisi veya admin olmayı gerektirir.
router.use(protect, isSalesRep);

// @route   GET /api/salesrep/customers
// @desc    Satış temsilcisine atanmış tüm müşterileri getir (isteğe bağlı keyword filtre)
router.get('/customers', getAssignedCustomers);

// @route   GET /api/salesrep/orders
// @desc    Satış temsilcisinin oluşturduğu/ait olduğu siparişleri getirir
// === Orders List ===
router.get('/orders', async (req, res) => {
    try {
        const salesRepId = req.user._id;
        const { status, start, end } = req.query;

        // siparişler: ya satış temsilcisinin oluşturduğu ya da kendi müşterilerinin siparişleri
        const customerIds = await User.find({ salesRepresentative: salesRepId }).distinct('_id');

        const baseCriteria = {
            $or: [
                { createdBy: salesRepId },
                { user: { $in: customerIds } }
            ]
        };

        const filter = { ...baseCriteria };
        if (status) filter.status = status;
        if (start || end) {
            filter.createdAt = {};
            if (start) filter.createdAt.$gte = new Date(start);
            if (end) {
                const endDate = new Date(end);
                endDate.setHours(23, 59, 59, 999);
                filter.createdAt.$lte = endDate;
            }
        }

        const orders = await Order.find(filter)
            .populate('user', 'name companyTitle')
            .sort({ createdAt: -1 });

        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Siparişler getirilirken sunucu hatası oluştu.' });
    }
});

// === Order Detail ===
router.get('/orders/:id', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id)
            .populate('user', 'name companyTitle email phone')
            .populate('orderItems.product', 'name sku');
        if (!order) return res.status(404).json({ msg: 'Sipariş bulunamadı.' });
        const customerBelongs = await User.exists({ _id: order.user, salesRepresentative: req.user._id });
        if (order.createdBy?.toString() !== req.user._id.toString() && !customerBelongs) {
            return res.status(403).json({ msg: 'Bu siparişi görüntüleme yetkiniz yok.' });
        }
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sipariş getirilemedi.' });
    }
});

// === Update Order Status ===
router.patch('/orders/:id/status', async (req, res) => {
    try {
        const { status } = req.body;
        const allowedStatuses = ['Onay Bekliyor','Beklemede','Hazırlanıyor','Kargoya Verildi','Teslim Edildi','İptal Edildi','Kısmi Tamamlandı'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Geçersiz durum.' });
        }
        const order = await Order.findById(req.params.id);
        if (!order) return res.status(404).json({ msg: 'Sipariş bulunamadı.' });
        if (order.createdBy?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Bu siparişi güncelleme yetkiniz yok.' });
        }
        order.status = status;
        await order.save();
        res.json({ msg: 'Sipariş durumu güncellendi.', order });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Durum güncellenemedi.' });
    }
});

// @route   GET /api/salesrep/dashboard-stats
// @desc    Giriş yapmış satış temsilcisi için gösterge paneli istatistiklerini getirir
router.get('/dashboard-stats', async (req, res) => {
    try {
        const salesRepId = new mongoose.Types.ObjectId(req.user._id);
        const { period } = req.query; // 'daily', 'monthly', 'yearly'

        let startDate, endDate = new Date();
        const now = new Date();
        now.setHours(23, 59, 59, 999);

        if (period === 'daily') {
            startDate = new Date(now);
            startDate.setHours(0, 0, 0, 0);
        } else if (period === 'yearly') {
            startDate = new Date(now.getFullYear(), 0, 1);
        } else { // monthly (default)
            startDate = new Date(now.getFullYear(), now.getMonth(), 1);
        }

        const dateMatch = { date: { $gte: startDate, $lte: endDate } };
        const orderDateMatch = { createdAt: { $gte: startDate, $lte: endDate } };

        // Genel istatistikler
        const totalCustomers = await User.countDocuments({ salesRepresentative: salesRepId });
        const cashboxBalance = await CashboxTransaction.aggregate([
            { $match: { salesRep: salesRepId } },
            { $group: { _id: null, balance: { $sum: { $cond: [{ $eq: ['$type', 'income'] }, '$amount', { $multiply: ['$amount', -1] }] } } } }
        ]);

        // Periyoda özel istatistikler
        const periodOrdersStats = await Order.aggregate([
            { $match: { createdBy: salesRepId, ...orderDateMatch } },
            { $group: { _id: null, totalSales: { $sum: '$totalPrice' }, orderCount: { $sum: 1 } } }
        ]);

        const periodCollections = await CashboxTransaction.aggregate([
            { $match: { salesRep: salesRepId, type: 'income', ...dateMatch } },
            { $group: { _id: null, total: { $sum: '$amount' } } }
        ]);

        const paymentMethodStats = await CashboxTransaction.aggregate([
            { $match: { salesRep: salesRepId, type: 'income', ...dateMatch } },
            { $group: { _id: '$paymentMethod', total: { $sum: '$amount' } } }
        ]);

                const recentTransactions = await CashboxTransaction.find({ salesRep: salesRepId }).populate('customer', 'name').sort({ date: -1 }).limit(5);

        // Son 15 günlük satışlar (Bar Chart için)
        const last15Days = new Date();
        last15Days.setDate(last15Days.getDate() - 14);
        last15Days.setHours(0, 0, 0, 0);

        const dailySalesData = await Order.aggregate([
            { $match: { createdBy: salesRepId, createdAt: { $gte: last15Days } } },
            {
                $group: {
                    _id: { $dateToString: { format: "%Y-%m-%d", date: "$createdAt" } },
                    totalSales: { $sum: '$totalPrice' }
                }
            },
            { $sort: { _id: 1 } }
        ]);

        // Aylık bazda ödeme türü dökümü (Stacked Bar Chart için)
        const startOfYear = new Date(new Date().getFullYear(), 0, 1);
        const monthlyPaymentData = await CashboxTransaction.aggregate([
            {
                $match: {
                    salesRep: salesRepId,
                    type: 'income',
                    date: { $gte: startOfYear }
                }
            },
            {
                $group: {
                    _id: {
                        month: { $month: "$date" },
                        paymentMethod: "$paymentMethod"
                    },
                    total: { $sum: "$amount" }
                }
            },
            {
                $project: {
                    _id: 0,
                    month: "$_id.month",
                    paymentMethod: "$_id.paymentMethod",
                    total: "$total"
                }
            }
        ]);
        
        res.json({
            totalCustomers,
            cashboxBalance: cashboxBalance.length > 0 ? cashboxBalance[0].balance : 0,
            periodSales: periodOrdersStats.length > 0 ? periodOrdersStats[0].totalSales : 0,
            periodOrderCount: periodOrdersStats.length > 0 ? periodOrdersStats[0].orderCount : 0,
            periodCollections: periodCollections.length > 0 ? periodCollections[0].total : 0,
            paymentMethodStats,
            recentTransactions,
            dailySalesData,
            monthlyPaymentData
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'İstatistikler getirilirken sunucu hatası oluştu.' });
    }
});

// @route   GET /api/salesrep/customers/:id
// @desc    Satış temsilcisinin belirli bir müşterisini getirir
router.get('/customers/:id', async (req, res) => {
    try {
        const customer = await User.findById(req.params.id).select('-password');
        if (!customer) return res.status(404).json({ msg: 'Müşteri bulunamadı.' });
        if (customer.salesRepresentative?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Bu müşteri üzerinde görüntüleme yetkiniz yok.' });
        }
        res.json(customer);
    } catch (error) {
        res.status(500).json({ msg: 'Müşteri getirilirken sunucu hatası oluştu.' });
    }
});

// @route   GET /api/salesrep/customers/:id/statement
// @desc    Seçili müşterinin cari ekstresini getirir (sipariş borçları + tahsilatlar)
router.get('/customers/:id/statement', async (req, res) => {
    try {
        const customerId = req.params.id;
        const customer = await User.findById(customerId);
        if (!customer) return res.status(404).json({ msg: 'Müşteri bulunamadı.' });
        if (customer.salesRepresentative?.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Bu müşteri üzerinde görüntüleme yetkiniz yok.' });
        }

        // Siparişlerden borç kayıtları (Cari Hesap ödemeli)
        const orders = await Order.find({ user: customerId, paymentMethod: 'Cari Hesap' }).select('totalPrice createdAt');
        const debts = orders.map(o => ({
            date: o.createdAt,
            description: 'Sipariş',
            amount: -Math.abs(o.totalPrice) // borç negatif
        }));

        // Tahsilat (inkomlar) kasadan
        const payments = await CashboxTransaction.find({ customer: customerId, type: 'income' }).select('amount date description');
        const incomes = payments.map(p => ({
            date: p.date,
            description: p.description || 'Ödeme',
            amount: Math.abs(p.amount) // alacak pozitif
        }));

        const all = [...debts, ...incomes].sort((a,b)=> new Date(a.date)-new Date(b.date));

        // Running balance
        let balance = 0;
        const statement = all.map(entry => {
            balance += entry.amount; // payments positive reduce negative balance
            return { ...entry, balance };
        });

        res.json(statement);
    } catch (error) {
        res.status(500).json({ msg: 'Cari ekstre getirilirken sunucu hatası oluştu.' });
    }
});

// @route   GET /api/salesrep/my-customers
// @desc    Giriş yapmış satış temsilcisinin müşterilerini listeler
router.get('/my-customers', async (req, res) => {
    try {
        const customers = await User.find({ salesRepresentative: req.user._id }).select('-password');
        res.json(customers);
    } catch (error) {
        res.status(500).json({ msg: 'Müşteriler getirilirken sunucu hatası oluştu.' });
    }
});

// @route   GET /api/salesrep/pending-orders
// @desc    Pazarlamacının müşterilerinden gelen ve onay bekleyen siparişleri listeler
router.get('/pending-orders', async (req, res) => {
    try {
        const customers = await User.find({ salesRepresentative: req.user._id }).select('_id');
        const customerIds = customers.map(c => c._id);
        const pendingOrders = await Order.find({ user: { $in: customerIds }, status: 'Onay Bekliyor' }).populate('user', 'name companyTitle').sort({ createdAt: -1 });
        res.json(pendingOrders);
    } catch (error) {
        res.status(500).json({ msg: 'Onay bekleyen siparişler getirilirken hata oluştu.' });
    }
});

// @route   PUT /api/salesrep/orders/:id/approve
// @desc    Bir siparişi onaylar, stok ve cariyi günceller
router.put('/orders/:id/approve', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');
        if (!order) return res.status(404).json({ msg: 'Sipariş bulunamadı.' });
        if (order.user.salesRepresentative?.toString() !== req.user._id.toString()) return res.status(403).json({ msg: 'Bu siparişi onaylama yetkiniz yok.' });
        if (order.status !== 'Onay Bekliyor') return res.status(400).json({ msg: 'Bu sipariş zaten işleme alınmış.'});
        
        order.status = 'Beklemede';

        for (const item of order.orderItems) {
            const product = await Product.findById(item.product);
            if (product) { product.stock -= item.qty; await product.save(); }
        }
        
        if (order.paymentMethod === 'Cari Hesap') {
            const customer = order.user;
            customer.currentAccountBalance = (customer.currentAccountBalance || 0) + order.totalPrice;
            await customer.save();
        }
        await order.save();
        res.json({ msg: 'Sipariş başarıyla onaylandı.' });
    } catch (error) {
        res.status(500).json({ msg: 'Sipariş onaylanırken sunucu hatası oluştu.' });
    }
});

// @route   PUT /api/salesrep/orders/:id/reject
// @desc    Bir siparişi reddeder (iptal eder)
router.put('/orders/:id/reject', async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user');
        if (!order) return res.status(404).json({ msg: 'Sipariş bulunamadı.' });
        if (order.user.salesRepresentative?.toString() !== req.user._id.toString()) return res.status(403).json({ msg: 'Bu siparişi reddetme yetkiniz yok.' });
        if(order.status !== 'Onay Bekliyor') return res.status(400).json({ msg: 'Bu sipariş zaten işleme alınmış.'});
        
        order.status = 'İptal Edildi';
        await order.save();
        res.json({ msg: 'Sipariş reddedildi.' });
    } catch (error) {
        res.status(500).json({ msg: 'Sipariş reddedilirken sunucu hatası oluştu.' });
    }
});


// @route   POST /api/salesrep/orders
// @desc    Satış temsilcisinin bir müşteri adına sipariş oluşturması
router.post('/orders', async (req, res) => {
    const { customerId, orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;
    try {
        const customer = await User.findById(customerId);
        if (!customer || customer.salesRepresentative.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Bu müşteri üzerinde işlem yapma yetkiniz yok.' });
        }
        
        const order = new Order({
            orderItems, user: customerId, shippingAddress, paymentMethod, totalPrice,
            createdBy: req.user._id, 
            status: 'Beklemede', // Pazarlamacı siparişi direkt onaylı (Beklemede) başlatır
            originalTotalPrice: totalPrice
        });
        
        const createdOrder = await order.save();
        
        for (const item of createdOrder.orderItems) {
            const product = await Product.findById(item.product);
            if (product) { product.stock -= item.qty; await product.save(); }
        }
        
        if (paymentMethod === 'Cari Hesap') {
            customer.currentAccountBalance = (customer.currentAccountBalance || 0) + totalPrice;
            await customer.save();
        }
        
        res.status(201).json(createdOrder);

    } catch (error) {
        res.status(500).json({ msg: 'Sipariş oluşturulurken sunucu hatası oluştu.' });
    }
});

// @route   POST /api/salesrep/process-payment
// @desc    Satış temsilcisinin bir müşteri için tahsilat girmesi
router.post('/process-payment', async (req, res) => {
    const { customerId, amount, description, paymentMethod, dueDate } = req.body;
    try {
        const customer = await User.findById(customerId);
        if (!customer || customer.salesRepresentative.toString() !== req.user._id.toString()) {
            return res.status(403).json({ msg: 'Bu müşteri üzerinde işlem yapma yetkiniz yok.' });
        }
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) return res.status(400).json({ msg: 'Geçerli bir tutar girin.' });
        
        customer.currentAccountBalance -= numericAmount;
        await customer.save();

        const transaction = new CashboxTransaction({
            salesRep: req.user._id,
            type: 'income',
            customer: customerId,
            amount: numericAmount,
            paymentMethod: paymentMethod,
            dueDate: (paymentMethod === 'Çek' || paymentMethod === 'Senet') ? dueDate : null,
            description: description || `${customer.name} - ${paymentMethod} Tahsilatı`
        });
        await transaction.save();

        res.json({ msg: 'Tahsilat başarıyla işlendi.' });
    } catch (error) {
        res.status(500).json({ msg: 'Tahsilat işlenirken sunucu hatası oluştu.' });
    }
});

// @route   POST /api/salesrep/log-expense
// @desc    Satış temsilcisinin kendi kasasına masraf girmesi
router.post('/log-expense', async (req, res) => {
    const { amount, description } = req.body;
    try {
        const numericAmount = Number(amount);
        if (isNaN(numericAmount) || numericAmount <= 0) {
            return res.status(400).json({ msg: 'Geçerli bir tutar girin.' });
        }
        const transaction = new CashboxTransaction({
            salesRep: req.user._id,
            type: 'expense',
            amount: numericAmount,
            paymentMethod: 'Nakit',
            description: description || 'Genel Gider'
        });
        await transaction.save();
        res.status(201).json({ msg: 'Masraf başarıyla kasaya işlendi.' });
    } catch (error) {
        res.status(500).json({ msg: 'Masraf işlenirken sunucu hatası oluştu.' });
    }
});

// @route   GET /api/salesrep/my-cashbox
// @desc    Satış temsilcisinin kasa hareketlerini listeler
router.get('/my-cashbox', async (req, res) => {
    try {
        const transactions = await CashboxTransaction.find({ salesRep: req.user._id })
            .populate('customer', 'name')
            .sort({ date: -1 });
        res.json(transactions);
    } catch (error) {
        res.status(500).json({ msg: 'Kasa hareketleri getirilirken sunucu hatası oluştu.' });
    }
});

module.exports = router;