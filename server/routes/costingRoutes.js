const express = require('express');
const router = express.Router();
const Setting = require('../models/Setting');
const InventoryItem = require('../models/InventoryItem');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   POST /api/costing/calculate
// @desc    Calculate cost of a product tree
// @access  Private/Admin
router.post('/calculate', protect, admin, async (req, res) => {
    const { components, targetTerm, targetCurrency } = req.body;
    
    try {
        // 1. GÜNCEL AYARLARI ÇEK
        let settings = await Setting.findOne();
        if (!settings) throw new Error('Site ayarları bulunamadı.');
        const monthlyInterestRate = settings.monthlyInterestRate / 100; // Yüzdeyi ondalığa çevir
        const usdRate = settings.currencyRates.find(r => r.code === 'USD');
        if (!usdRate) throw new Error('USD kuru bulunamadı.');

        let totalCostTL = 0;
        let totalCostUSD = 0;

        // 2. HER BİR PARÇANIN MALİYETİNİ HESAPLA
        for (const comp of components) {
            const item = await InventoryItem.findById(comp.inventoryItem);
            if (!item) continue; // Parça bulunamazsa atla

            // Parçanın ana maliyetini TL'ye çevir
            // === DÜZELTME BURADA: item.purchasePrice -> item.unitPrice olarak değiştirildi ===
            let baseCostTL = item.unitPrice; 
            if (item.currency === 'USD') {
                baseCostTL = item.unitPrice * usdRate.sell; // USD alırken, satış kurundan TL'ye çevir
            }

            // Vade farkını hesapla
            let interestMonths = 0;
            if (targetTerm > 0) { // Eğer bir hedef vade varsa
                if (item.purchaseType === 'nakit') {
                    interestMonths = targetTerm;
                } else if (item.purchaseType === 'vadeli') {
                    // İstenen vade, parçanın kendi vadesinden büyükse aradaki fark kadar faiz uygula
                    if (targetTerm > item.termMonths) {
                        interestMonths = targetTerm - item.termMonths;
                    }
                }
            }
            
            const interestAmount = baseCostTL * monthlyInterestRate * interestMonths;
            const finalCostTL = (baseCostTL + interestAmount) * comp.quantity;

            totalCostTL += finalCostTL;
        }
        
        // 3. İSTENEN PARA BİRİMİNE GÖRE SONUCU DÖNDÜR
        if (targetCurrency === 'USD') {
            totalCostUSD = totalCostTL / usdRate.buy; // TL'yi dolara çevirirken alış kurunu kullan
        }

        res.json({
            totalCostTL: totalCostTL.toFixed(2),
            totalCostUSD: totalCostUSD.toFixed(2)
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: error.message });
    }
});

module.exports = router;