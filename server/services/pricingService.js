const PriceList = require('../models/priceListModel');
const Settings = require('../models/settingsModel');

/**
 * Verilen ürün ve kullanıcı için dinamik fiyatı hesaplar.
 * @param {object} product - Fiyatı hesaplanacak ürün nesnesi.
 * @param {object} user - Fiyatın hesaplanacağı kullanıcı nesnesi.
 * @returns {Promise<number>} - Müşteriye özel hesaplanmış fiyat.
 */
async function calculateProductPrice(product, user) {
    let finalPrice = product.price; // Ürünün baz fiyatıyla başla

    // 1. Kullanıcıya atanmış bir fiyat listesi var mı kontrol et
    if (user && user.priceList) {
        const priceList = await PriceList.findById(user.priceList)
            .populate('productPrices.product')
            .populate('categoryDiscounts.category');

        if (priceList) {
            // a. Ürüne özel bir fiyat var mı?
            const specificProductPrice = priceList.productPrices.find(
                p => p.product && p.product._id.equals(product._id)
            );
            if (specificProductPrice) {
                finalPrice = specificProductPrice.price;
            } else {
                // b. Ürünün kategorisine özel bir indirim var mı?
                let categoryDiscount = null;
                if (product.category) {
                    const categorySpecificDiscount = priceList.categoryDiscounts.find(
                        d => d.category && d.category._id.equals(product.category._id)
                    );
                    if (categorySpecificDiscount) {
                        categoryDiscount = categorySpecificDiscount.discountPercentage;
                    }
                }

                // c. Kategori indirimi yoksa, genel indirim uygulanır
                const discountPercentage = categoryDiscount !== null ? categoryDiscount : priceList.globalDiscountPercentage;

                if (discountPercentage > 0) {
                    finalPrice = finalPrice * (1 - discountPercentage / 100);
                }
            }
        }
    } else {
        // Misafir veya fiyat listesi olmayan kullanıcılar için varsayılan listeyi bul
        const defaultPriceList = await PriceList.findOne({ isDefault: true });
        if (defaultPriceList) {
            // Varsayılan liste için de aynı mantığı uygula (genellikle sadece genel indirim)
            if (defaultPriceList.globalDiscountPercentage > 0) {
                finalPrice = finalPrice * (1 - defaultPriceList.globalDiscountPercentage / 100);
            }
        }
    }

    // 2. Kullanıcının ödeme şekli vadeli ise vade farkı ekle
    if (user && user.paymentTerms === 'credit') {
        const settings = await Settings.findOne();
        if (settings && settings.monthlyInterestRate > 0) {
            finalPrice = finalPrice * (1 + settings.monthlyInterestRate / 100);
        }
    }

    // Fiyatı 2 ondalık basamağa yuvarla
    return Math.round(finalPrice * 100) / 100;
}

module.exports = { calculateProductPrice };
