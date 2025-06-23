const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const SupplierOrderItemSchema = new Schema({
  product: { type: Schema.Types.ObjectId, ref: 'Product', required: true },
  name: String,
  qty: Number,
  price: Number
}, { _id: false });

const SupplierOrderSchema = new Schema({
  parentOrder: { type: Schema.Types.ObjectId, ref: 'Order', required: true },
  supplier: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  orderItems: [SupplierOrderItemSchema],
  totalPrice: { type: Number, default: 0 },
  status: { type: String, enum: ['Hazırlanıyor','Kargoya Verildi','Teslim Edildi','İptal Edildi'], default: 'Hazırlanıyor' }
}, { timestamps: true });

module.exports = mongoose.model('SupplierOrder', SupplierOrderSchema);
