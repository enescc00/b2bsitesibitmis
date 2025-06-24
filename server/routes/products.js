const express = require('express');
const router = express.Router();
const { body, validationResult } = require('express-validator');
const Product = require('../models/Product');
const Category = require('../models/Category');
const Order = require('../models/Order'); // Yorum kontrolü için Order modelini dahil ediyoruz
const { protect, admin } = require('../middleware/authMiddleware');
// === YENİ IMPORT ===
// Yeni oluşturduğumuz middleware'i dahil ediyoruz.
const { adminOrSalesRep } = require('../middleware/adminOrSalesRepMiddleware');
const upload = require('../config/cloudinary');

// @route   GET /api/products/search-suggestions
// @desc    Get product suggestions based on a keyword
router.get('/search-suggestions', async (req, res) => {
    try {
        const keyword = req.query.keyword ? {
            name: {
                $regex: req.query.keyword,
                $options: 'i'
            },
            isActive: true
        } : { isActive: true };

        const products = await Product.find(keyword)
            .select('_id name images')
            .limit(5);

        res.json(products);
    } catch (err) {
        console.error("Arama önerileri getirilirken hata:", err.message);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   GET /api/products (VİTRİN İÇİN)
router.get('/', async (req, res) => {
  const pageSize = 10;
  const page = Number(req.query.pageNumber) || 1;
  let filter = { isActive: true };
  
  if (req.query.keyword) {
    filter.name = { $regex: req.query.keyword, $options: 'i' };
  }
  
  if (req.query.category) {
    try {
        const subCategories = await Category.find({ parent: req.query.category });
        const subCategoryIds = subCategories.map(sub => sub._id);
        const categoriesToSearch = [req.query.category, ...subCategoryIds];
        filter.category = { $in: categoriesToSearch };
    } catch(err) {
        console.error("Alt kategoriler getirilirken hata oluştu:", err);
        filter.category = req.query.category;
    }
  }

  try {
    const count = await Product.countDocuments(filter);
    const products = await Product.find(filter)
      .populate('category', 'name')
      .limit(pageSize)
      .skip(pageSize * (page - 1));
      
    res.json({ products, page, pages: Math.ceil(count / pageSize) });
  } catch (err) {
    console.error("Ürünler getirilirken hata:", err.message);
    res.status(500).json({ msg: 'Sunucu Hatası', error: err.message });
  }
});

// @route   GET /api/products/all (ADMİN VE PAZARLAMACI İÇİN)
// === DEĞİŞİKLİK: 'admin' middleware'i 'adminOrSalesRep' ile değiştirildi ===
router.get('/all', protect, adminOrSalesRep, async (req, res) => {
    const pageSize = 10;
    const page = Number(req.query.pageNumber) || 1;
    const keyword = req.query.keyword ? { name: { $regex: req.query.keyword, $options: 'i' } } : {};
    try {
        const count = await Product.countDocuments({ ...keyword });
        const products = await Product.find({ ...keyword }).populate('category', 'name').limit(pageSize).skip(pageSize * (page - 1));
        res.json({ products, page, pages: Math.ceil(count / pageSize) });
    } catch (err) {
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

// @route   GET /api/products/:id (ID ile tek ürün getir)
router.get('/:id', async (req, res) => {
    try {
        if (!req.params.id.match(/^[0-9a-fA-F]{24}$/)) { return res.status(404).json({ msg: 'Geçersiz ürün IDsi.' }); }
        const product = await Product.findById(req.params.id).populate('category', 'name');
        if (product) { res.json(product); } else { res.status(404).json({ msg: 'Ürün bulunamadı' }); }
    } catch (err) { console.error(`Ürün ID ${req.params.id} getirilirken hata:`, err.message); res.status(500).json({ msg: 'Sunucu Hatası', error: err.message }); }
});

// @route   POST /api/products (Yeni ürün oluşturma)
// Cloudinary hatasını önlemek için upload.array middleware'ini geçici olarak kaldırıldı
router.post('/', protect, admin, [
    body('name', 'Ürün adı zorunludur').not().isEmpty().trim().escape(),
], async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) { return res.status(400).json({ errors: errors.array() }); }
    
    // Form verilerini doğru şekilde çözümleme
    const { name, description, category, sku, warrantyPeriod, costPrice, profitMargin, salePrice, stock } = req.body;
    
    // JSON olarak gönderilen alanları parse etme
    let specifications = [];
    let boxContents = [];
    let components = [];
    let isActive = true;
    
    try {
        // JSON stringlerini kontrol edip parse etme
        if (req.body.specifications) specifications = JSON.parse(req.body.specifications);
        if (req.body.boxContents) boxContents = JSON.parse(req.body.boxContents);
        if (req.body.components) components = JSON.parse(req.body.components);
        if (req.body.isActive !== undefined) isActive = req.body.isActive === 'true' || req.body.isActive === true;
    } catch (e) {
        console.error('JSON parse hatası:', e);
        return res.status(400).json({ msg: 'Formda geçersiz JSON verileri var', error: e.message });
    }
    
    // Cloudinary hatasını geçici olarak önlemek için sabit resim URL'leri kullanalım
    // Bu placehold.co ve picsum.photos geçici resim URL'leri
    const images = req.files 
        ? req.files.map(file => file.path) 
        : [
            'https://via.placeholder.com/500',
            'https://picsum.photos/id/26/500/500'
          ];

    try { 
        // Daha iyi hata ayıklama için form verilerini kontrol etme
        console.log('Form verileri:', { 
            name, description, category, sku, warrantyPeriod,
            costPrice, profitMargin, salePrice, stock, isActive,
            specificationsLength: specifications.length,
            boxContentsLength: boxContents.length,
            componentsLength: components.length,
            imageCount: images.length
        });
        
        const product = new Product({ 
            name, 
            images, // Use URLs from Cloudinary
            description, 
            category, 
            components, 
            sku, 
            warrantyPeriod, 
            specifications, 
            boxContents, 
            costPrice, 
            profitMargin, 
            salePrice, 
            stock, 
            isActive 
        });
        
        // Doğrulama hatalarını yakalamak için validateSync kullan
        const validationError = product.validateSync();
        if (validationError) {
            console.error('Doğrulama hatası:', validationError);
            const messages = Object.values(validationError.errors).map(val => val.message);
            return res.status(400).json({ msg: 'Form doğrulama hatası', errors: messages });
        }
        
        const createdProduct = await product.save();
        res.status(201).json(createdProduct);
    } catch (error) {
        if (error.name === 'ValidationError') {
            const errors = Object.values(error.errors).map(err => err.message);
            console.error('Product creation validation error:', errors);
            // Return a detailed error message to the client
            return res.status(400).json({ message: 'Zorunlu alanlar eksik veya geçersiz.', errors: errors.join(', ') });
        }
        if (error.code === 11000) {
            // Handle duplicate key error (e.g., unique product name)
            return res.status(400).json({ message: 'Bu isimde bir ürün zaten mevcut.' });
        }
        // For any other errors, return a generic 500 server error
        console.error('Product creation server error:', error);
        res.status(500).json({ message: 'Sunucuda bir hata oluştu.', error: error.message });
    }
});

// @route   PUT /api/products/:id (Ürün güncelleme)
router.put('/:id', protect, admin, upload.array('images', 10), async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            // Get URLs of newly uploaded files
            const newImageUrls = req.files ? req.files.map(file => file.path) : [];

            // Get existing images that client wants to keep
            let existingImages = [];
            if (req.body.existingImages) {
                existingImages = Array.isArray(req.body.existingImages) 
                    ? req.body.existingImages 
                    : [req.body.existingImages];
            }

            product.name = req.body.name ?? product.name;
            product.images = [...existingImages, ...newImageUrls]; // Combine old and new images
            product.description = req.body.description ?? product.description;
            product.category = req.body.category ?? product.category;
            product.components = req.body.components ?? product.components;
            product.sku = req.body.sku ?? product.sku;
            product.warrantyPeriod = req.body.warrantyPeriod ?? product.warrantyPeriod;
            product.specifications = req.body.specifications ?? product.specifications;
            product.boxContents = req.body.boxContents ?? product.boxContents;
            product.costPrice = req.body.costPrice ?? product.costPrice;
            product.profitMargin = req.body.profitMargin ?? product.profitMargin;
            product.salePrice = req.body.salePrice ?? product.salePrice;
            product.stock = req.body.stock ?? product.stock;
            product.isActive = req.body.isActive ?? product.isActive;
            
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

// @route   POST /api/products/:id/reviews
// @desc    Bir ürüne yeni bir yorum oluştur
// @access  Private
router.post('/:id/reviews', protect, async (req, res) => {
    const { rating, comment } = req.body;

    try {
        const product = await Product.findById(req.params.id);
        if (!product) {
            return res.status(404).json({ msg: 'Ürün bulunamadı.' });
        }

        const alreadyReviewed = product.reviews.find(
            r => r.user.toString() === req.user._id.toString()
        );

        if (alreadyReviewed) {
            return res.status(400).json({ msg: 'Bu ürüne zaten yorum yaptınız.' });
        }

        // Opsiyonel: Sadece ürünü satın alanların yorum yapmasını sağlama
        const orders = await Order.find({ user: req.user._id });
        const hasPurchased = orders.some(order => 
            order.orderItems.some(item => item.product.toString() === req.params.id)
        );
        if (!hasPurchased && req.user.role !== 'admin') { // Adminler her zaman yorum yapabilir
             return res.status(400).json({ msg: 'Sadece satın aldığınız ürünlere yorum yapabilirsiniz.' });
        }

        const review = {
            name: req.user.name,
            rating: Number(rating),
            comment,
            user: req.user._id,
        };

        product.reviews.push(review);
        product.numReviews = product.reviews.length;
        product.rating = product.reviews.reduce((acc, item) => item.rating + acc, 0) / product.reviews.length;

        await product.save();
        res.status(201).json({ msg: 'Yorumunuz başarıyla eklendi.' });

    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});


// @route   PUT /api/products/:id/recalculate-price
// @desc    Ürünün satış fiyatını kâr marjına göre yeniden hesapla
router.put('/:id/recalculate-price', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) {
            product.salePrice = product.costPrice * (1 + product.profitMargin / 100);
            product.profitabilityAlert = false;
            
            const updatedProduct = await product.save();
            res.json(updatedProduct);
        } else {
            res.status(404).json({ msg: 'Ürün bulunamadı' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Fiyat yeniden hesaplanırken sunucu hatası oluştu.' });
    }
});

// @route   DELETE /api/products/:id (Ürün silme)
router.delete('/:id', protect, admin, async (req, res) => {
    try {
        const product = await Product.findById(req.params.id);
        if (product) { await product.deleteOne(); res.json({ msg: 'Ürün kaldırıldı' }); } 
        else { res.status(404).json({ msg: 'Ürün bulunamadı' }); }
    } catch (err) { console.error(`Ürün ID ${req.params.id} silinirken hata:`, err.message); res.status(500).json({ msg: 'Sunucu Hatası', error: err.message }); }
});

module.exports = router;