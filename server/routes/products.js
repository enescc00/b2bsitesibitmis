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
router.post('/', protect, admin, upload.array('images', 10), async (req, res) => {
    console.log('Ürün oluşturma isteği başladı');
    console.log('İstek gövdesi:', req.body);
    console.log('İstek dosyaları:', req.files ? req.files.length : 'Yok');
    
    try {
        // İstek doğrulama - zorunlu alanları kontrol et
        const requiredFields = ['name', 'description', 'category'];
        for (const field of requiredFields) {
            if (!req.body[field]) {
                console.error(`Zorunlu alan eksik: ${field}`);
                return res.status(400).json({ 
                    message: `Zorunlu alan eksik: ${field}`,
                    field: field
                });
            }
        }
        
        // Form verilerini çözümle ve doğru tiplere dönüştür
        const formData = {
            name: req.body.name,
            description: req.body.description,
            category: req.body.category,
            sku: req.body.sku || '',
            warrantyPeriod: req.body.warrantyPeriod || ''
        };
        
        // Sayısal alanları dönüştür
        formData.costPrice = req.body.costPrice ? parseFloat(req.body.costPrice) : 0;
        formData.profitMargin = req.body.profitMargin ? parseFloat(req.body.profitMargin) : 0;
        formData.salePrice = req.body.salePrice ? parseFloat(req.body.salePrice) : 0;
        formData.stock = req.body.stock ? parseInt(req.body.stock) : 0;
        
        // Boolean değerleri dönüştür
        formData.isActive = req.body.isActive === 'true' || req.body.isActive === true;
        
        // JSON alanlarını parse et
        formData.specifications = [];
        formData.boxContents = [];
        formData.components = [];
        
        try {
            // Mevcut resimleri dizi olarak ekle
            formData.existingImages = [];
            if (req.body.existingImages) {
                // Tekil değer mi yoksa dizi mi kontrol et
                if (Array.isArray(req.body.existingImages)) {
                    formData.existingImages = req.body.existingImages;
                } else {
                    formData.existingImages = [req.body.existingImages];
                }
            }
            
            // JSON alanlarını parse et, geçersiz olanlara boş dizi ata
            if (req.body.specifications) {
                try {
                    formData.specifications = JSON.parse(req.body.specifications);
                    if (!Array.isArray(formData.specifications)) {
                        formData.specifications = [];
                    }
                } catch (e) { formData.specifications = []; }
            }
            
            if (req.body.boxContents) {
                try {
                    formData.boxContents = JSON.parse(req.body.boxContents);
                    if (!Array.isArray(formData.boxContents)) {
                        formData.boxContents = [];
                    }
                } catch (e) { formData.boxContents = []; }
            }
            
            if (req.body.components) {
                try {
                    formData.components = JSON.parse(req.body.components);
                    if (!Array.isArray(formData.components)) {
                        formData.components = [];
                    }
                } catch (e) { formData.components = []; }
            }
        } catch (e) {
            console.error('Form veri dönüşüm hatası:', e);
        }
        
        // Resim URL'leri için mevcut resimler veya varsayılan placeholder kullan
        formData.images = formData.existingImages.length > 0 
            ? formData.existingImages 
            : ['https://via.placeholder.com/500'];
        
        // Yüklenen yeni dosyalar varsa ekle
        if (req.files && req.files.length > 0) {
            try {
                console.log('Yüklenen dosyalar:', req.files);
                
                // Cloudinary yükleme yanıtını doğru şekilde işle
                const newImagesUrls = req.files.map(file => {
                    if (file.path) {
                        // Bazen path yerine secure_url olabilir
                        return file.path;
                    } else if (file.secure_url) {
                        return file.secure_url;
                    } else if (file.url) {
                        return file.url;
                    } else {
                        console.error('Dosya URL bulunamadı:', file);
                        return 'https://via.placeholder.com/500';
                    }
                });
                
                console.log('İşlenmiş resim URL\'leri:', newImagesUrls);
                formData.images = [...formData.images, ...newImagesUrls];
            } catch (error) {
                console.error('Dosya işleme hatası:', error);
                // Hata olsa bile geçerli resimlerle devam et
            }
        }

        // Ürün nesnesini oluştur
        const product = new Product({ 
            name: formData.name, 
            images: formData.images,
            description: formData.description, 
            category: formData.category, 
            components: formData.components, 
            sku: formData.sku, 
            warrantyPeriod: formData.warrantyPeriod, 
            specifications: formData.specifications, 
            boxContents: formData.boxContents, 
            costPrice: formData.costPrice, 
            profitMargin: formData.profitMargin, 
            salePrice: formData.salePrice, 
            stock: formData.stock, 
            isActive: formData.isActive 
        });
        
        console.log('Ürün nesnesi oluşturuldu, değerler:', {
            costPrice: product.costPrice,
            stock: product.stock,
            name: product.name,
            category: product.category
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