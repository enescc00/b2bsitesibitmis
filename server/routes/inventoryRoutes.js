const express = require('express');
const router = express.Router();
const InventoryItem = require('../models/InventoryItem');
const Product = require('../models/Product');
const { protect, admin } = require('../middleware/authMiddleware');

// Tüm rotalar sadece admin tarafından erişilebilir olmalı
router.use(protect, admin);

// Ürün Maliyetlerini Güncelleme ve Kârlılık Kontrolü Servisi
const updateProductCosts = async (inventoryItemId) => {
    try {
        console.log(`Maliyet güncelleme tetiklendi: Stok ID ${inventoryItemId}`);
        const productsToUpdate = await Product.find({ 'components.inventoryItem': inventoryItemId }).populate('components.inventoryItem');

        for (const product of productsToUpdate) {
            let newCostPrice = 0;
            for (const component of product.components) {
                if (component.inventoryItem) { 
                    newCostPrice += component.inventoryItem.unitPrice * component.quantity;
                }
            }
            
            product.costPrice = newCostPrice;

            if (newCostPrice > 0) {
                const currentProfit = ((product.salePrice - newCostPrice) / newCostPrice) * 100;
                const alertThreshold = product.profitMargin - 10;

                if (isFinite(currentProfit) && currentProfit < alertThreshold) {
                    product.profitabilityAlert = true;
                    console.log(`UYARI: '${product.name}' ürünü için kârlılık (${currentProfit.toFixed(1)}%) hedef eşiğin (${alertThreshold}%) altına düştü!`);
                } else {
                    product.profitabilityAlert = false;
                }
            } else {
                product.profitabilityAlert = false;
            }
            
            await product.save();
        }
    } catch (error) {
        console.error('Ürün maliyetleri güncellenirken bir hata oluştu:', error);
    }
};

// @route   GET /api/inventory
// @desc    Tüm stok kalemlerini getir
router.get('/', async (req, res) => {
    try {
        const items = await InventoryItem.find({}).populate('history.user', 'name');
        res.json(items);
    } catch (error) {
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   POST /api/inventory
// @desc    Yeni bir stok kalemi oluştur
router.post('/', async (req, res) => {
    try {
        const newItem = new InventoryItem(req.body);
        newItem.history.push({
            user: req.user._id,
            action: 'Stok Kalemi Oluşturuldu'
        });
        const savedItem = await newItem.save();
        res.status(201).json(savedItem);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Bu isim veya kod ile bir stok kalemi zaten mevcut.' });
        }
        res.status(500).json({ msg: 'Stok kalemi oluşturulurken hata oluştu.' });
    }
});

// @route   PUT /api/inventory/:id
// @desc    Bir stok kalemini güncelle
router.put('/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Stok kalemi bulunamadı.' });

        const { name, itemCode, unitPrice, currency } = req.body;
        
        if (item.name !== name) {
            item.history.push({ user: req.user._id, action: 'İsim Değiştirildi', details: `'${item.name}' -> '${name}'` });
        }
        if (item.itemCode !== itemCode) {
            item.history.push({ user: req.user._id, action: 'Kod Değiştirildi', details: `'${item.itemCode}' -> '${itemCode}'` });
        }
        if (item.unitPrice !== unitPrice || item.currency !== currency) {
            item.history.push({ user: req.user._id, action: 'Fiyat Güncellendi', details: `${item.unitPrice} ${item.currency} -> ${unitPrice} ${currency}` });
        }

        item.name = req.body.name;
        item.itemCode = req.body.itemCode;
        item.quantity = req.body.quantity;
        item.unitPrice = req.body.unitPrice;
        item.currency = req.body.currency;
        item.purchaseType = req.body.purchaseType;
        item.termMonths = req.body.termMonths;
        item.isStale = false;

        const updatedItem = await item.save();

        await updateProductCosts(updatedItem._id);

        res.json(updatedItem);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Bu isim veya kod ile başka bir stok kalemi zaten mevcut.' });
        }
        res.status(500).json({ msg: 'Stok kalemi güncellenirken hata oluştu.' });
    }
});

// @route   DELETE /api/inventory/:id
// @desc    Bir stok kalemini sil
router.delete('/:id', async (req, res) => {
    try {
        const item = await InventoryItem.findById(req.params.id);
        if (!item) return res.status(404).json({ msg: 'Stok kalemi bulunamadı.' });
        await item.deleteOne();
        res.json({ msg: 'Stok kalemi başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ msg: 'Stok kalemi silinirken hata oluştu.' });
    }
});

module.exports = router;