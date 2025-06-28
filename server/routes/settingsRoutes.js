const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
// === DÜZELTME BURADA ===
const { protect, admin } = require('../middleware/authMiddleware');

// Varsayılan ayarları oluşturmak veya bulmak için yardımcı fonksiyon
const getOrCreateSettings = async () => {
    let settings = await Setting.findOne();
    
    if (!settings) {
        // Eğer hiç ayar yoksa, varsayılanlarla bir tane oluştur
        console.log('Ayar dokümanı bulunamadı, yenisi oluşturuluyor...');
        settings = await Setting.create({
            currencyRates: [
                { code: 'USD', buy: 30.0, sell: 30.5 },
                { code: 'EUR', buy: 32.0, sell: 32.5 }
            ]
        });
    } else if (!settings.currencyRates || settings.currencyRates.length === 0) {
        // Eğer ayar var ama döviz kuru yoksa, ekle ve kaydet
        console.log('Mevcut ayarlarda döviz kuru bulunamadı, varsayılanlar ekleniyor...');
        settings.currencyRates.push({ code: 'USD', buy: 30.0, sell: 30.5 });
        settings.currencyRates.push({ code: 'EUR', buy: 32.0, sell: 32.5 });
        await settings.save();
    }
    return settings;
};

// @route   GET /api/settings
// @desc    Get site settings
router.get('/', protect, admin, async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json(settings);
    } catch (error) {
        res.status(500).json({ msg: 'Ayarlar getirilirken hata oluştu.', error: error.message });
    }
});

// @route   PUT /api/settings
// @desc    Update site settings
router.put('/', protect, admin, async (req, res) => {
    try {
        let settings = await Setting.findOne();
        if (!settings) {
            return res.status(404).json({ msg: "Güncellenecek ayar bulunamadı." });
        }

        settings.shippingFreeThreshold = req.body.shippingFreeThreshold;
        settings.monthlyInterestRate = req.body.monthlyInterestRate;
        
        if (req.body.currencyRates) {
            settings.currencyRates = req.body.currencyRates;
        }

        // Bakım modu ayarlarını güncelle
        if (req.body.hasOwnProperty('maintenanceMode')) {
            settings.maintenanceMode = req.body.maintenanceMode;
        }

        if (req.body.hasOwnProperty('maintenanceMessage')) {
            settings.maintenanceMessage = req.body.maintenanceMessage;
        }

        const updatedSettings = await settings.save();
        res.json(updatedSettings);

    } catch (error) {
        res.status(500).json({ msg: 'Ayarlar güncellenirken hata oluştu.', error: error.message });
    }
});

// @route   GET /api/settings/status
// @desc    Get maintenance mode status (public)
router.get('/status', async (req, res) => {
    try {
        const settings = await getOrCreateSettings();
        res.json({
            maintenanceMode: settings.maintenanceMode,
            maintenanceMessage: settings.maintenanceMessage
        });
    } catch (error) {
        res.status(500).json({ msg: 'Ayar durumu getirilirken hata oluştu.', error: error.message });
    }
});

module.exports = router;