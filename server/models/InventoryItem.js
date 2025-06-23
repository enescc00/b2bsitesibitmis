const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const HistorySchema = new Schema({
    user: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    action: {
        type: String,
        required: true
    },
    details: {
        type: String
    },
    timestamp: {
        type: Date,
        default: Date.now
    }
}, {_id: false});


const InventoryItemSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Stok kalem adı zorunludur.'],
        trim: true,
        unique: true
    },
    itemCode: {
        type: String,
        required: [true, 'Stok kodu zorunludur.'],
        unique: true,
        trim: true
    },
    quantity: {
        type: Number,
        required: true,
        default: 0
    },
    unitPrice: {
        type: Number,
        required: [true, 'Birim fiyatı zorunludur.'],
        default: 0
    },
    currency: {
        type: String,
        required: true,
        enum: ['TRY', 'USD', 'EUR'],
        default: 'TRY'
    },
    purchaseType: {
        type: String,
        enum: ['nakit', 'vadeli'],
        default: 'nakit'
    },
    termMonths: {
        type: Number,
        default: 0
    },
    // === YENİ ALAN: Bayat fiyat uyarısı için ===
    isStale: {
        type: Boolean,
        default: false
    },
    history: [HistorySchema]
}, {
    timestamps: true 
});

module.exports = mongoose.model('InventoryItem', InventoryItemSchema);