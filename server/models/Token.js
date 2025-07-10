const mongoose = require('mongoose');

const tokenSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    required: true,
    ref: 'User'
  },
  token: {
    type: String,
    required: true
  },
  type: {
    type: String,
    required: true,
    enum: ['passwordReset', 'emailVerify']
  },
  expires: {
    type: Date,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 3600 // Otomatik olarak 1 saat sonra silinir
  }
});

// Süresi geçmiş tokenleri temizleyen index
tokenSchema.index({ "expires": 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model('Token', tokenSchema);
