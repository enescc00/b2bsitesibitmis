const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const SupplierOrder = require('../models/SupplierOrder');
const { User } = require('../models/User');
const upload = require('../config/cloudinary');

// Middleware to ensure the user is a supplier
const isSupplier = (req, res, next) => {
    if (req.user && req.user.role === 'supplier') {
        next();
    } else {
        res.status(403).json({ msg: 'Erişim reddedildi. Bu işlem sadece tedarikçilere özeldir.' });
    }
};

// @route   GET /api/supplier/dashboard
// @desc    Get supplier dashboard statistics
// @access  Private/Supplier
router.get('/dashboard', protect, isSupplier, async (req, res) => {
    try {
        const supplierId = req.user._id;

        const totalProducts = await Product.countDocuments({ supplier: supplierId });
        const activeOrders = await SupplierOrder.countDocuments({ supplier: supplierId, status: { $in: ['Onay Bekliyor', 'Hazırlanıyor'] } });
        
        const orders = await SupplierOrder.find({ supplier: supplierId });
        const totalRevenue = orders.reduce((acc, order) => acc + order.totalPrice, 0);

        res.json({
            totalProducts,
            activeOrders,
            totalRevenue
        });
    } catch (error) {
        console.error('Tedarikçi dashboard verileri alınırken hata:', error);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// @route   GET /api/supplier/products
// @desc    Get all products for the supplier view (as requested)
// @access  Private/Supplier
router.get('/products', protect, isSupplier, async (req, res) => {
    try {
        // User wants suppliers to see all products, not just their own.
        const products = await Product.find({}).populate('supplier', 'name');
        res.json(products);
    } catch (err) {
        console.error('Tedarikçi için ürünler alınırken hata:', err);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// @route   POST /api/supplier/products
// @desc    Create a new product as a supplier
// @access  Private/Supplier
router.post('/products', protect, isSupplier, upload.array('images', 10), async (req, res) => {
    const { name, description, category, salePrice, stock } = req.body;
    
    if (!name || !salePrice || !stock) {
        return res.status(400).json({ msg: 'Lütfen tüm zorunlu alanları doldurun: İsim, Satış Fiyatı, Stok.' });
    }

    try {
        const images = req.files ? req.files.map(file => file.path) : [];

        const product = new Product({
            name,
            images,
            description,
            category, // Assuming category ID is sent from frontend
            salePrice,
            stock,
            supplier: req.user._id, // Assign product to the logged-in supplier
            isActive: true, // Products added by suppliers are active by default
        });

        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (err) {
        console.error('Tedarikçi ürün oluştururken hata:', err);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});


// @route   GET /api/supplier/orders
// @desc    Get all orders for the supplier
// @access  Private/Supplier
router.get('/orders', protect, isSupplier, async (req, res) => {
    try {
        const ordersData = await SupplierOrder.find({ supplier: req.user._id })
            .populate('parentOrder', 'orderId') // Correct field name
            .sort({ createdAt: -1 })
            .lean(); // Use lean for plain JS objects

        // Adapt data for the frontend which expects 'mainOrder'
        const orders = ordersData.map(order => {
            return {
                ...order,
                mainOrder: order.parentOrder
            };
        });

        res.json(orders);
    } catch (err) {
        console.error('Tedarikçi siparişleri alınırken hata:', err);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// @route   GET /api/supplier/account
// @desc    Get supplier's own account details (for 'Cari')
// @access  Private/Supplier
router.get('/account', protect, isSupplier, async (req, res) => {
    try {
        // The user object is already attached by 'protect' middleware
        // We just need to send the relevant fields
        const user = await User.findById(req.user._id).select('name email companyTitle currentAccountBalance');
        if (!user) {
            return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
        }
        res.json(user);
    } catch (error) {
        console.error('Tedarikçi cari bilgileri alınırken hata:', error);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

module.exports = router;
