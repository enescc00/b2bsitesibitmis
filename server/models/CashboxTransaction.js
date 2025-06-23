const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CashboxTransactionSchema = new Schema({
    salesRep: {
        type: Schema.Types.ObjectId,
        required: true,
        ref: 'User'
    },
    // Bu işlem bir 'gelir' mi (tahsilat) yoksa 'gider' mi (harcama)?
    type: {
        type: String,
        required: true,
        enum: ['income', 'expense']
    },
    // Gelir ise hangi müşteriden geldi? Gider ise bu alan boş olabilir.
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        default: null
    },
    amount: {
        type: Number,
        required: true
    },
    // === YENİ ALANLAR ===
    paymentMethod: {
        type: String,
        required: true,
        enum: ['Nakit', 'Kredi Kartı', 'Banka', 'Çek', 'Senet'],
        default: 'Nakit'
    },
    dueDate: { // Sadece Çek/Senet için vade tarihi
        type: Date,
        default: null
    },
    // ====================
    description: {
        type: String,
        required: true
    },
    date: {
        type: Date,
        default: Date.now // Tarih otomatik olarak o an atanır
    }
}, {
    timestamps: true
});

module.exports = mongoose.model('CashboxTransaction', CashboxTransactionSchema);