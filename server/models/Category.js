const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CategorySchema = new Schema({
  name: {
    type: String,
    required: [true, 'Kategori adı zorunludur.'],
    unique: true,
    trim: true
  },
  // === YENİ ALAN: Üst kategoriyi tutmak için ===
  parent: {
    type: Schema.Types.ObjectId,
    ref: 'Category', // Kendi kendine referans verir
    default: null
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Category', CategorySchema);