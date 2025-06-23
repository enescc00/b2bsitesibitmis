const InventoryItem = require('../models/InventoryItem');

const checkStalePrices = async () => {
    console.log('Bayat fiyat kontrolü çalışıyor...', new Date().toLocaleString());
    
    // 30 günden daha eski olan kayıtları bulmak için tarih hesapla
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    try {
        // Son 30 gün içinde GÜNCELLENMEMİŞ tüm ürünleri bul
        const staleItems = await InventoryItem.find({ updatedAt: { $lt: thirtyDaysAgo } });

        if (staleItems.length > 0) {
            console.log(`${staleItems.length} adet bayat fiyatlı ürün bulundu.`);
            for (const item of staleItems) {
                item.isStale = true;
                await item.save();
            }
        } else {
            console.log('Bayat fiyatlı ürün bulunamadı.');
        }

        // Fiyatı sonradan güncellenmiş ama hala isStale=true olanları düzelt
        // (Bu, manuel güncellemeler sonrası sistemi temizler)
        const recentlyUpdatedItems = await InventoryItem.find({ 
            updatedAt: { $gte: thirtyDaysAgo },
            isStale: true 
        });

        if (recentlyUpdatedItems.length > 0) {
            for (const item of recentlyUpdatedItems) {
                item.isStale = false;
                await item.save();
            }
        }

    } catch (error) {
        console.error('Bayat fiyat kontrolü sırasında hata oluştu:', error);
    }
};

module.exports = checkStalePrices;