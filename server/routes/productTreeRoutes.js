const express = require('express');
const router = express.Router();
const ProductTree = require('../models/ProductTree');
// === DÜZELTME BURADA ===
const { protect, admin } = require('../middleware/authMiddleware');

// Tüm rotalar sadece admin tarafından erişilebilir olmalı
router.use(protect, admin);

// @route   GET /api/product-trees
// @desc    Tüm ürün ağaçlarını getir
router.get('/', async (req, res) => {
    try {
        const productTrees = await ProductTree.find({}).populate('components.inventoryItem', 'name itemCode');
        res.json(productTrees);
    } catch (error) {
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   POST /api/product-trees
// @desc    Yeni bir ürün ağacı oluştur
router.post('/', async (req, res) => {
    const { name, description, components } = req.body;
    try {
        const newProductTree = new ProductTree({ name, description, components });
        const savedTree = await newProductTree.save();
        res.status(201).json(savedTree);
    } catch (error) {
        if (error.code === 11000) {
            return res.status(400).json({ msg: 'Bu isimde bir ürün ağacı zaten mevcut.' });
        }
        res.status(500).json({ msg: 'Ürün ağacı oluşturulurken hata oluştu.' });
    }
});

// @route   GET /api/product-trees/:id
// @desc    Tek bir ürün ağacını getir
router.get('/:id', async (req, res) => {
    try {
        const tree = await ProductTree.findById(req.params.id).populate('components.inventoryItem');
        if(!tree) return res.status(404).json({ msg: 'Ürün ağacı bulunamadı.' });
        res.json(tree);
    } catch (error) {
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


// @route   PUT /api/product-trees/:id
// @desc    Bir ürün ağacını güncelle
router.put('/:id', async (req, res) => {
    try {
        const { name, description, components } = req.body;
        const updatedTree = await ProductTree.findByIdAndUpdate(
            req.params.id, 
            { name, description, components }, 
            { new: true }
        );
        if (!updatedTree) return res.status(404).json({ msg: 'Ürün ağacı bulunamadı.' });
        res.json(updatedTree);
    } catch (error) {
        res.status(500).json({ msg: 'Ürün ağacı güncellenirken hata oluştu.' });
    }
});

// @route   DELETE /api/product-trees/:id
// @desc    Bir ürün ağacını sil
router.delete('/:id', async (req, res) => {
    try {
        const tree = await ProductTree.findById(req.params.id);
        if (!tree) return res.status(404).json({ msg: 'Ürün ağacı bulunamadı.' });
        
        // İPUCU: İleride bu ağacı kullanan bir ürün var mı diye kontrol edilebilir.
        await tree.deleteOne();
        res.json({ msg: 'Ürün ağacı başarıyla silindi.' });
    } catch (error) {
        res.status(500).json({ msg: 'Ürün ağacı silinirken hata oluştu.' });
    }
});


module.exports = router;