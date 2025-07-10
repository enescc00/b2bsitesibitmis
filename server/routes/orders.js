const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const Order = require('../models/Order');
const Product = require('../models/Product');
const SupplierOrder = require('../models/SupplierOrder');
const { User } = require('../models/User');
const { sendOrderStatusUpdateEmail } = require('../services/emailService');

// @route   GET /api/orders (Tüm siparişleri listele - Admin, Sayfalama ve Tarih Filtresi ile)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    
    let filter = {};

    if (req.query.startDate && req.query.endDate) {
        filter.createdAt = {
            $gte: new Date(req.query.startDate),
            $lte: new Date(new Date(req.query.endDate).setHours(23, 59, 59, 999)) // Bitiş gününü tam olarak dahil et
        };
    }

    try {
        const count = await Order.countDocuments(filter);
        const orders = await Order.find(filter)
            .populate('user', 'id name')
            .sort({ createdAt: -1 })
            .limit(pageSize)
            .skip(pageSize * (page - 1));
            
        res.json({ orders, page, pages: Math.ceil(count / pageSize) });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   PUT /api/orders/:id/backordered/:productId/cancel  (Eksik ürünü iptal et - Müşteri)
// @access  Private
router.put('/:id/backordered/:productId/cancel', protect, async (req, res) => {
    try {
        const order = await Order.findOne({ _id: req.params.id, user: req.user._id });
        if (!order) return res.status(404).json({ msg: 'Sipariş bulunamadı' });

        const index = order.backorderedItems.findIndex(i => i.product.toString() === req.params.productId);
        if (index === -1) return res.status(404).json({ msg: 'Ürün eksik listesinde bulunamadı' });

        order.backorderedItems.splice(index, 1);

        // Sipariş durumu güncelle
        if (order.backorderedItems.length === 0 && order.status === 'Kısmi Tamamlandı') {
            order.status = 'Hazırlanıyor';
        }

        await order.save();
        return res.json(order);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// @route   GET /api/orders/myorders (Kullanıcının kendi siparişleri)
// @access  Private
router.get('/myorders', protect, async (req, res) => {
    try {
        const orders = await Order.find({ user: req.user._id }).sort({ createdAt: -1 });
        res.json(orders);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   GET /api/orders/:id (Tek siparişi getir - Admin)
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const order = await Order.findById(req.params.id).populate('user', 'name email companyTitle');
        if (order) {
            res.json(order);
        } else {
            res.status(404).json({ msg: 'Sipariş bulunamadı' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


// @route   PATCH /api/orders/:id/status  (Sipariş durumunu güncelle - Admin)
// @access  Private/Admin
router.patch('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status, packagesCount, trackingNumber } = req.body;
        const allowedStatuses = ['Onay Bekliyor','Beklemede','Hazırlanıyor','Kargoya Verildi','Teslim Edildi','İptal Edildi','Kısmi Tamamlandı'];
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Geçersiz durum.' });
        }
        
        const order = await Order.findById(req.params.id).populate('user', 'email name');
        if (!order) return res.status(404).json({ msg: 'Sipariş bulunamadı' });
        
        // Sipariş durumu değişti mi kontrol et
        const statusChanged = order.status !== status;
        const previousStatus = order.status;
        
        // Yeni durum ata
        order.status = status;
        
        if (status === 'Kargoya Verildi') {
            if (!packagesCount || packagesCount < 1) {
                return res.status(400).json({ msg: 'Kargo koli adedi gereklidir.' });
            }
            order.packagesCount = packagesCount;
            order.shippedAt = Date.now();
            
            // Takip numarası varsa ekle
            if (trackingNumber) {
                order.trackingNumber = trackingNumber;
            }
        }
        
        // Sipariş kaydedilir
        const updatedOrder = await order.save();
        
        // Durum değişikliğinde e-posta gönder (özellikle kargoya verildi veya teslim edildi durumlarında)
        if (statusChanged && order.user && order.user.email) {
            try {
                // E-posta göndermenin önemli olduğu durumlar
                const importantStatuses = ['Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi'];
                
                if (importantStatuses.includes(status)) {
                    await sendOrderStatusUpdateEmail({
                        order: updatedOrder,
                        user: order.user,
                        previousStatus,
                        newStatus: status
                    });
                    console.log(`${order.user.email} adresine ${status} durumu hakkında bildirim e-postası gönderildi.`);
                }
            } catch (emailError) {
                console.error(`Sipariş durumu e-postası gönderilirken hata: ${emailError.message}`);
                // E-posta gönderiminde hata oluşsa da işleme devam et
            }
        }
        
        res.json(order);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// @route   PUT /api/orders/:id (Sipariş içeriğini düzenle - Admin)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    const { orderItems, backorderedItems } = req.body;

    try {
        const order = await Order.findById(req.params.id);
        if (!order) {
            return res.status(404).json({ msg: 'Sipariş bulunamadı' });
        }

        const user = await User.findById(order.user);
        if (!user) {
            return res.status(404).json({ msg: 'Siparişe ait müşteri bulunamadı.' });
        }

        const previousTotalPrice = order.totalPrice;
        
        // Yeni toplam fiyatı, güncellenmiş orderItems listesinden hesapla
        const newTotalPrice = orderItems.reduce((acc, item) => acc + item.price * item.qty, 0);

        // Cari hesabı güncelle (eğer sipariş Cari ise)
        if (order.paymentMethod === 'Cari Hesap') {
            const priceDifference = previousTotalPrice - newTotalPrice;
            user.currentAccountBalance -= priceDifference;
            await user.save();
        }

        // Siparişi güncelle
        order.orderItems = orderItems;
        order.backorderedItems = backorderedItems || order.backorderedItems;
        order.totalPrice = newTotalPrice;
        
        // Sipariş durumunu ayarla
        if (order.backorderedItems && order.backorderedItems.length > 0) {
            order.status = 'Kısmi Tamamlandı';
        } else if (order.status === 'Kısmi Tamamlandı') {
            // Eğer tüm eksik ürünler tamamlandıysa durumu eski haline getir.
            order.status = 'Hazırlanıyor';
        }

        const updatedOrder = await order.save();
        res.json(updatedOrder);

    } catch (error) {
        console.error("Sipariş güncellenirken hata:", error);
        res.status(500).json({ msg: 'Sipariş güncellenirken sunucu hatası oluştu.' });
    }
});


// @route   PUT /api/orders/:id/status (Sipariş durumunu güncelle - Admin)
// @access  Private/Admin
router.put('/:id/status', protect, admin, async (req, res) => {
    try {
        const { status, trackingNumber } = req.body;
        const allowedStatuses = ['Onay Bekliyor','Beklemede','Hazırlanıyor','Kargoya Verildi','Teslim Edildi','İptal Edildi','Kısmi Tamamlandı'];
        
        if (!allowedStatuses.includes(status)) {
            return res.status(400).json({ msg: 'Geçersiz durum.' });
        }
        
        const order = await Order.findById(req.params.id).populate('user', 'email name');
        
        if (!order) {
            return res.status(404).json({ msg: 'Sipariş bulunamadı' });
        }
        
        // Sipariş durumu değişti mi kontrol et
        const statusChanged = order.status !== status;
        const previousStatus = order.status;
        
        // Yeni durum ata
        order.status = status;
        
        // Kargoya verildi durumunda takip numarası ekle
        if (status === 'Kargoya Verildi' && trackingNumber) {
            order.trackingNumber = trackingNumber;
            order.shippedAt = Date.now();
        }
        
        const updatedOrder = await order.save();
        
        // Durum değişikliğinde e-posta gönder (özellikle kargoya verildi veya teslim edildi durumlarında)
        if (statusChanged && order.user && order.user.email) {
            try {
                // E-posta göndermenin önemli olduğu durumlar
                const importantStatuses = ['Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi'];
                
                if (importantStatuses.includes(status)) {
                    await sendOrderStatusUpdateEmail({
                        order: updatedOrder,
                        user: order.user,
                        previousStatus,
                        newStatus: status
                    });
                    console.log(`${order.user.email} adresine ${status} durumu hakkında bildirim e-postası gönderildi.`);
                }
            } catch (emailError) {
                console.error(`Sipariş durumu e-postası gönderilirken hata: ${emailError.message}`);
                // E-posta gönderiminde hata oluşsa da işleme devam et
            }
        }
        
        res.json(updatedOrder);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   POST /api/orders (Yeni sipariş oluştur - Müşteri tarafından)
// @access  Private
router.post('/', protect, async (req, res) => {
  const { orderItems, shippingAddress, paymentMethod, totalPrice } = req.body;

  if (orderItems && orderItems.length === 0) {
    return res.status(400).json({ msg: 'Sepet boş olamaz.' });
  }

  try {
    const order = new Order({
      orderItems: orderItems,
      user: req.user._id,
      shippingAddress,
      paymentMethod,
      totalPrice,
      originalTotalPrice: totalPrice,
      // Modeldeki 'Onay Bekliyor' durumu otomatik olarak atanacaktır.
    });

    const createdOrder = await order.save();

    // === SİPARİŞ AYIRMA ===
    const supplierGroups = {};
    for (const item of orderItems) {
      const product = await Product.findById(item.product).select('supplier');
      if (!product) continue;
      const supId = String(product.supplier || 'unknown');
      if (!supplierGroups[supId]) supplierGroups[supId] = [];
      supplierGroups[supId].push(item);
    }

    for (const [supplierId, items] of Object.entries(supplierGroups)) {
      if (supplierId === 'unknown') continue;
      const subTotal = items.reduce((acc,i)=>acc+i.price*i.qty,0);
      const supOrder = new SupplierOrder({
        parentOrder: createdOrder._id,
        supplier: supplierId,
        orderItems: items,
        totalPrice: subTotal
      });
      await supOrder.save();
    }
    
    // Sipariş onay e-postası gönder
    try {
      // Kullanıcı bilgilerini al
      const user = await User.findById(req.user._id).select('name email');
      if (user && user.email) {
        await sendOrderStatusUpdateEmail({
          order: createdOrder,
          user: user,
          previousStatus: null,
          newStatus: 'Onay Bekliyor'
        });
        console.log(`${user.email} adresine yeni sipariş onay e-postası gönderildi.`);
      }
    } catch (emailError) {
      console.error('Sipariş onay e-postası gönderilirken hata:', emailError);
      // E-posta gönderimi başarısız olsa da siparişi kaydet
    }

    res.status(201).json(createdOrder);
  } catch(error) {
      console.error(error);
      res.status(500).json({ msg: 'Sipariş oluşturulurken bir hata oluştu.'});
  }
});

module.exports = router;