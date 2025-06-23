const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Category = require('../models/Category');
const { protect, admin } = require('../middleware/authMiddleware');

// @route   GET api/categories
// @desc    Tüm kategorileri getir
router.get('/', async (req, res) => {
  try { 
    const categories = await Category.find().sort({ name: 1 }); 
    res.json(categories); 
  } 
  catch (err) { 
    console.error(err.message); 
    res.status(500).json({ msg: 'Sunucu Hatası' }); 
  }
});

// @route   GET api/categories/:id
// @desc    ID ile tek bir kategori getir
router.get('/:id', protect, admin, async (req, res) => {
    try { 
      const category = await Category.findById(req.params.id); 
      if (!category) return res.status(404).json({ msg: 'Kategori bulunamadı' }); 
      res.json(category); 
    } 
    catch (err) { 
      console.error(err.message); 
      res.status(500).json({ msg: 'Sunucu Hatası' }); 
    }
});

// @route   POST api/categories
// @desc    Yeni bir kategori oluştur
router.post('/', protect, admin, [
    body('name', 'Kategori adı boş bırakılamaz').not().isEmpty().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // === DÜZELTME 1: "parent" alanı req.body'den alınıyor ===
    const { name, parent } = req.body;
    try {
        let category = await Category.findOne({ name });
        if (category) {
            return res.status(400).json({ errors: [{ msg: 'Bu kategori zaten mevcut.' }] });
        }
        // === DÜZELTME 2: Yeni kategori oluşturulurken "parent" alanı da ekleniyor ===
        const newCategory = new Category({ name, parent: parent || null });
        category = await newCategory.save();
        res.status(201).json(category);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   PUT api/categories/:id
// @desc    Bir kategoriyi güncelle
router.put('/:id', protect, admin, [
    body('name', 'Kategori adı boş bırakılamaz').not().isEmpty().trim().escape()
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    // === DÜZELTME 3: "parent" alanı req.body'den alınıyor ===
    const { name, parent } = req.body;
    try {
        const category = await Category.findById(req.params.id);
        if (!category) return res.status(404).json({ msg: 'Kategori bulunamadı' });

        // === DÜZELTME 4: Kategori güncellenirken "parent" alanı da güncelleniyor ===
        category.name = name;
        category.parent = parent || null;
        
        await category.save();
        res.json(category);
    } catch (err) {
        console.error(err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


// @route   DELETE api/categories/:id
// @desc    Bir kategoriyi sil
router.delete('/:id', protect, admin, async (req, res) => {
    try { 
      const category = await Category.findById(req.params.id); 
      if (!category) return res.status(404).json({ msg: 'Kategori bulunamadı' });
      
      // İPUCU: Silmeden önce bu kategoriyi üst kategori olarak kullanan başka bir kategori var mı diye kontrol edilebilir.
      // Şimdilik bu kontrolü eklemiyoruz.
      await category.deleteOne();

      res.json({ msg: 'Kategori başarıyla silindi.' }); 
    } 
    catch (err) { 
      console.error(err.message); 
      res.status(500).json({ msg: 'Sunucu Hatası' }); 
    }
});

module.exports = router;