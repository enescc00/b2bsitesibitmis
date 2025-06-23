const mongoose = require('mongoose');

const currencyRateSchema = new mongoose.Schema({
    code: { type: String, required: true, enum: ['USD', 'EUR'] },
    buy: { type: Number, required: true, default: 1 },
    sell: { type: Number, required: true, default: 1 }
}, {_id: false});


const settingSchema = new mongoose.Schema({
    shippingFreeThreshold: {
        type: Number,
        required: true,
        default: 500
    },
    monthlyInterestRate: {
        type: Number,
        required: true,
        default: 5
    },
    currencyRates: [currencyRateSchema]
});

// Ayarların her zaman tek bir doküman olmasını sağlamak için bir ön-kayıt kancası
settingSchema.pre('save', async function (next) {
    const model = mongoose.model('Setting', settingSchema);
    const count = await model.countDocuments();
    if (count > 1 && this.isNew) { // Sadece yeni dokümanlarda ve 1'den fazla varsa hata ver
        throw new Error('Sadece bir ayar dokümanı olabilir.');
    }
    next();
});

const Setting = mongoose.model('Setting', settingSchema);

module.exports = Setting;