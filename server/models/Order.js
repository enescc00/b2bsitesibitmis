const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderItemSchema = new Schema({
    name: { type: String, required: true },
    qty: { type: Number, required: true },
    price: { type: Number, required: true },
    product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
    }
}, {_id: false});


const OrderSchema = new Schema({
  orderNumber: {
    type: Number,
    unique: true,
    index: true
  },
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderItems: [OrderItemSchema],
  backorderedItems: [OrderItemSchema], // Bu alanı bir önceki adımdan eklemiştik
  shippingAddress: {
    addressTitle: { type: String, required: true },
    province: { type: String, required: true },
    district: { type: String, required: true },
    fullAddress: { type: String, required: true }
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['Havale/EFT', 'Kredi Kartı', 'Cari Hesap']
  },
  totalPrice: {
    type: Number,
    required: true,
    default: 0.0
  },
  originalTotalPrice: {
    type: Number,
    default: 0.0
  },
  packagesCount: { type: Number, default: 1 },
  trackingNumber: { type: String },
  shippedAt: { type: Date },
  // === DEĞİŞİKLİK: Sipariş onayı için yeni durum eklendi ===
  status: {
    type: String,
    required: true,
    // Yeni durum: 'Onay Bekliyor'
    enum: ['Onay Bekliyor', 'Beklemede', 'Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi', 'Kısmi Tamamlandı'],
    // Müşteri sipariş geçtiğinde varsayılan durum bu olacak
    default: 'Onay Bekliyor'
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  }
}, {
  timestamps: true
});

// Sipariş oluşturulurken sıralı orderNumber ata
OrderSchema.pre('save', async function(next) {
  if (this.orderNumber) return next();

  try {
    const lastOrder = await mongoose.model('Order').findOne({ orderNumber: { $ne: null } }).sort({ orderNumber: -1 }).select('orderNumber');
    this.orderNumber = lastOrder ? lastOrder.orderNumber + 1 : 1;
    next();
  } catch (err) {
    next(err);
  }
});

module.exports = mongoose.model('Order', OrderSchema);