const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const AddressSchema = new Schema({
    addressTitle: { type: String, required: true, default: 'Varsayılan Adres' },
    province: { type: String, required: true },
    district: { type: String, required: true }, 
    fullAddress: { type: String, required: true }
});

const baseOptions = {
  discriminatorKey: '__t',
  collection: 'users',      
  timestamps: true          
};

const baseUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true, select: false },
  
  // === GÜNCELLEME: Yeni "sales_rep" rolü eklendi ===
  role: {
      type: String,
      required: true,
      enum: ['customer', 'admin', 'pazarlamaci', 'sevkiyat', 'muhasebe'],
      default: 'customer'
  },
  priceList: {
    type: Schema.Types.ObjectId,
    ref: 'PriceList',
    default: null
  },
  shippingAddress: {
    type: Schema.Types.ObjectId,
    ref: 'Address'
  },
  balance: {
    type: Number,
    default: 0
  },
  paymentTerms: {
    type: String,
    enum: ['cash', 'credit'], // Nakit, Vadeli
    default: 'cash'
  },
  
  isApproved: { type: Boolean, default: false },
  
  // === YENİ ALANLAR ===
  // Müşterinin hangi pazarlamacıya bağlı olduğunu tutar
  salesRepresentative: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    default: null
  },
  // Pazarlamacının kendi kasasını tutar
  cashboxBalance: {
      type: Number,
      default: 0
  },

  currentAccountBalance: { type: Number, default: 0 },
  addresses: [AddressSchema],
  wishlist: [{ type: Schema.Types.ObjectId, ref: 'Product' }],
  refreshTokens: { type: [String], default: [] }
}, baseOptions);

const User = mongoose.model('User', baseUserSchema);

const IndividualUser = User.discriminator('IndividualUser', new Schema({
  tcKimlik: { type: String, required: true, unique: true },
  taxOffice: { type: String } 
}));

const CorporateUser = User.discriminator('CorporateUser', new Schema({
  companyTitle: { type: String, required: true },
  taxNumber: { type: String, required: true, unique: true },
  taxOffice: { type: String, required: true },
}));

const SupplierUser = User.discriminator('SupplierUser', new Schema({
  companyTitle: { type: String, required: true },
  taxNumber: { type: String, required: true, unique: true },
  taxOffice: { type: String, required: true },
  iban: { type: String },
  contactPerson: { type: String },
  phone: { type: String }
}));

module.exports = { User, IndividualUser, CorporateUser, SupplierUser };