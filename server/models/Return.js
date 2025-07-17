const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const returnProductSchema = new Schema({
    product: {
        type: Schema.Types.ObjectId,
        ref: 'Product',
        required: true
    },
    quantity: {
        type: Number,
        required: true,
        min: 1
    },
    reason: { // Opsiyonel: İade nedeni (örn: 'Arızalı', 'Yanlış Ürün')
        type: String,
        trim: true
    },
    priceAtReturn: { // Muhasebe onayı sırasında kullanılacak fiyat
        type: Number
    }
});

const returnSchema = new Schema({
    returnNumber: {
        type: Number,
        unique: true
    },
    customer: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    order: {
        type: Schema.Types.ObjectId,
        ref: 'Order',
        required: true
    },
    products: [returnProductSchema],
    status: {
        type: String,
        required: true,
        enum: ['İade Talebi Oluşturuldu', 'Kargo Bekleniyor', 'İade Teslim Alındı', 'İncelemede', 'Onaylandı', 'Kısmen Onaylandı', 'Reddedildi', 'Tamamlandı'],
        default: 'İade Talebi Oluşturuldu'
    },
    description: {
        type: String,
        required: [true, 'Lütfen iade nedenini açıklayınız.'],
        trim: true
    },
    createdBy: {
        type: Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    history: [{
        status: String,
        updatedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        notes: String,
        updatedAt: { type: Date, default: Date.now }
    }],
    resolution: {
        type: String,
        enum: ['Para İadesi', 'Değişim', 'Kredi Tanımlama', 'Diğer'],
    },
    financial: {
        totalRefundAmount: Number,
        isProcessed: { type: Boolean, default: false },
        processedBy: { type: Schema.Types.ObjectId, ref: 'User' },
        processedAt: Date
    }
}, { timestamps: true });

// Siparişlerde olduğu gibi sıralı bir iade numarası oluştur
returnSchema.pre('save', async function(next) {
    if (this.isNew) {
        this.history.push({ status: this.status, updatedBy: this.createdBy, notes: 'İade talebi oluşturuldu.' });
        if (!this.returnNumber) {
            const lastReturn = await this.constructor.findOne().sort({ returnNumber: -1 });
            this.returnNumber = lastReturn ? lastReturn.returnNumber + 1 : 1;
        }
    }
    next();
});

const Return = mongoose.model('Return', returnSchema);
module.exports = Return;
