const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const OrderSchema = new Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  orderItems: [
    {
      name: { type: String, required: true },
      qty: { type: Number, required: true },
      price: { type: Number, required: true },
      product: {
        type: mongoose.Schema.Types.ObjectId,
        required: true,
        ref: 'Product'
      }
    }
  ],
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
  // isPaid ve isDelivered yerine yeni status alanı
  status: {
    type: String,
    required: true,
    enum: ['Beklemede', 'Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi'],
    default: 'Beklemede'
  },
}, {
  timestamps: true // createdAt ve updatedAt alanlarını otomatik ekler
});

module.exports = mongoose.model('Order', OrderSchema);