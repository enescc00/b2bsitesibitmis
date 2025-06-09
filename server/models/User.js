const mongoose = require('mongoose');
const Schema = mongoose.Schema;

// Adres için ayrı bir şema tanımlamak daha temiz bir yöntemdir.
const AddressSchema = new Schema({
    addressTitle: { type: String, required: true, default: 'Varsayılan Adres' },
    province: { type: String, required: true }, // İl
    district: { type: String, required: true }, // İlçe
    fullAddress: { type: String, required: true } // Açık Adres
});

const baseOptions = {
  discriminatorKey: '__t', // Hangi tipte bir kullanıcı olduğunu belirten alan
  collection: 'users',      // Hepsinin 'users' koleksiyonunda saklanmasını sağlar
  timestamps: true          // createdAt ve updatedAt alanlarını otomatik ekler
};

// Ortak alanlar
const baseUserSchema = new Schema({
  name: { type: String, required: true },
  email: { type: String, required: true, unique: true },
  password: { type: String, required: true },
  role: { type: String, default: 'customer' },
  currentAccountBalance: { type: Number, default: 0 },
  // DEĞİŞİKLİK: Adres artık bir dizi (array)
  addresses: [AddressSchema]
}, baseOptions);

const User = mongoose.model('User', baseUserSchema);

// Bireysel Kullanıcı için ek alanlar
const IndividualUser = User.discriminator('IndividualUser', new Schema({
  tcKimlik: { type: String, required: true, unique: true },
  taxOffice: { type: String, required: true }, 
}));

// Kurumsal Kullanıcı için ek alanlar
const CorporateUser = User.discriminator('CorporateUser', new Schema({
  companyTitle: { type: String, required: true },
  taxNumber: { type: String, required: true, unique: true },
  taxOffice: { type: String, required: true },
}));

module.exports = { User, IndividualUser, CorporateUser };