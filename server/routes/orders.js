const express = require('express');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');
const Order = require('../models/Order');
const Product = require('../models/Product');
const { User } = require('../models/User');

// === YENİ ROTALAR BAŞLANGIÇ ===

// @route   GET /api/orders
// @desc    Get all orders (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        // Müşteri bilgilerini de siparişe eklemek için populate kullanıyoruz
        const orders = await Order.find({}).populate('user', 'id name').sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   PUT /api/orders/:id/status
// @desc    Update order status (Admin only)
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id);

        if (order) {
            order.status = req.body.status;
            // Eğer "Teslim Edildi" olarak işaretlenirse, teslim tarihini de ayarla
            if (req.body.status === 'Teslim Edildi') {
                order.isDelivered = true;
                order.deliveredAt = Date.now();
            }
            const updatedOrder = await order.save();
            res.json(updatedOrder);
        } else {
            res.status(404).json({ msg: 'Sipariş bulunamadı' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// === YENİ ROTALAR BİTİŞ ===


// GET /api/orders/myorders - Mevcut Rota
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


// POST /api/orders - Mevcut Rota
router.post('/', protect, async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ msg: 'Sepet boş.' });
  } else {
    try {
      const order = new Order({
        orderItems: orderItems,
        user: req.user._id,
        shippingAddress,
        paymentMethod,
        totalPrice,
      });

      const createdOrder = await order.save();
      
      for (const item of order.orderItems) {
        const product = await Product.findById(item.product);
        if (product) {
          product.stock = product.stock - item.qty;
          await product.save();
        }
      }

      if (createdOrder.paymentMethod === 'Cari Hesap') {
          const user = await User.findById(req.user.id);
          if (user) {
              user.currentAccountBalance = (user.currentAccountBalance || 0) + createdOrder.totalPrice;
              await user.save();
          }
      }

      res.status(201).json(createdOrder);

    } catch(error) {
        console.error(error);
        res.status(500).json({ msg: 'Sipariş oluşturulurken bir hata oluştu.'});
    }
  }
});

module.exports = router;