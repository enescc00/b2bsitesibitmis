const express = require('express');
const router = express.Router();
const Product = require('../models/Product');
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @route   GET /api/products
// @desc    Tüm ürünleri getir
router.get('/', async (req, res) => {
  try {
    const products = await Product.find({}).populate('category', 'name');
    res.json(products);
  } catch (err) {
    console.error("Tüm ürünler getirilirken hata:", err.message);
    res.status(500).json({ msg: 'Sunucu Hatası', error: err.message });
  }
});

// @route   GET /api/products/:id
// @desc    ID ile tek bir ürün getir
router.get('/:id', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) {
            return res.status(404).json({ msg: 'Geçersiz ürün IDsi.' });
        }
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (product) {
            res.json(product);
        } else {
            res.status(404).json({ msg: 'Ürün bulunamadı' });
        }
    } catch (err) {
        console.error(`Ürün ID ${req.params.id} getirilirken hata:`, err.message);
        res.status(500).json({ msg: 'Sunucu Hatası', error: err.message });
    }
});

// @route   POST /api/products
// @desc    Yeni bir ürün oluştur
router.post('/', protect, admin, async (req, res) => {
  const { name, image, description, price, stock, category } = req.body;
  try {
    const product = new Product({ name, image, description, price, stock, category });
    const createdProduct = await product.save();
    res.status(201).json(createdProduct);
  } catch (err) {
    console.error("Ürün oluşturulurken hata:", err.message);
    res.status(500).json({ msg: 'Ürün oluşturulurken hata oluştu.', error: err.message });
  }
});

// @route   PUT /api/products/:id
// @desc    Bir ürünü güncelle
router.put('/:id', protect, admin, async (req, res) => {
    const { name, image, description, price, stock, category } = req.body;
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.name = name;
            product.image = image;
            product.description = description;
            product.price = price;
            product.stock = stock;
            product.category = category;
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ msg: 'Ürün bulunamadı' });
        }
    } catch (err) {
        console.error(`Ürün ID ${req.params.id} güncellenirken hata:`, err.message);
        res.status(500).json({ msg: 'Ürün güncellenirken hata oluştu.', error: err.message });
    }
});

// @route   DELETE /api/products/:id
// @desc    Bir ürünü sil
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            await product.deleteOne();
            res.json({ msg: 'Ürün kaldırıldı' });
        } else {
            res.status(404).json({ msg: 'Ürün bulunamadı' });
        }
    } catch (err) {
        console.error(`Ürün ID ${req.params.id} silinirken hata:`, err.message);
        res.status(500).json({ msg: 'Sunucu Hatası', error: err.message });
    }
});

module.exports = router;