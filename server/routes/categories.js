const express = require('express');
const router = express.Router();
const Category = require('../models/Category');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @route   GET api/categories
// @desc    Tüm kategorileri getir (Herkese Açık)
router.get('/', async (req, res) => {
  try {
    const categories = await Category.find().sort({ name: 1 });
    res.json(categories);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Sunucu Hatası' });
  }
});

// @route   GET api/categories/:id
// @desc    ID ile tek bir kategori getir (Admin Gerekli)
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Kategori bulunamadı' });
        res.json(category);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   POST api/categories
// @desc    Yeni bir kategori oluştur (Admin Gerekli)
router.post('/', protect, admin, async (req, res) => {
  const { name } = req.body;
  if (!name) {
    return res.status(400).json({ msg: 'Lütfen kategori adını girin.' });
  }
  try {
    let category = await Category.findOne({ name });
    if (category) {
      return res.status(400).json({ msg: 'Bu kategori zaten mevcut.' });
    }
    const newCategory = new Category({ name });
    category = await newCategory.save();
    res.status(201).json(category);
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Sunucu Hatası' });
  }
});

// @route   PUT api/categories/:id
// @desc    Bir kategoriyi güncelle (Admin Gerekli)
router.put('/:id', protect, admin, async (req, res) => {
    const { name } = req.body;
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Kategori bulunamadı' });

        category.name = name;
        await category.save();
        res.json(category);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


// @route   DELETE api/categories/:id
// @desc    Bir kategoriyi sil (Admin Gerekli)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Kategori bulunamadı' });

        // İPUCU: İleride bu kategoriyi kullanan ürünler var mı diye kontrol edilebilir.
        await category.deleteOne();
        res.json({ msg: 'Kategori başarıyla silindi.' });
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


module.exports = router;