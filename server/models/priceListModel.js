const mongoose = require('mongoose');

const priceListSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Fiyat listesi adı zorunludur.'],
        unique: true,
        trim: true
    },
    description: {
        type: String,
        trim: true
    },
    // Bu fiyat listesine özel ürün fiyatları
    productPrices: [
        {
            product: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Product',
                required: true
            },
            price: {
                type: Number,
                required: true,
                min: 0
            }
        }
    ],
    // Bu fiyat listesine özel kategori indirimleri
    categoryDiscounts: [
        {
            category: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'Category',
                required: true
            },
            discountPercentage: {
                type: Number,
                required: true,
                min: 0,
                max: 100
            }
        }
    ],
    // Kapsam dışı ürünler için genel indirim oranı
    globalDiscountPercentage: {
        type: Number,
        default: 0,
        min: 0,
        max: 100
    },
    // Misafir veya varsayılan kullanıcılar için mi?
    isDefault: {
        type: Boolean,
        default: false
    }
}, { timestamps: true });

// Varsayılan olarak sadece bir tane liste olabilir
priceListSchema.index({ isDefault: 1 }, { unique: true, partialFilterExpression: { isDefault: true } });

const PriceList = mongoose.model('PriceList', priceListSchema);

module.exports = PriceList;
