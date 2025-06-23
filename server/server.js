// GEREKLİ PAKETLERİ İÇERİ AKTARMA
require('dotenv').config({ path: './config/config.env' });

// GLOBAL HATA YAKALAYICILAR
process.on('uncaughtException', (err) => {
  console.error('YAKALANAMAYAN HATA (uncaughtException):', err);
});
process.on('unhandledRejection', (reason, promise) => {
  console.error('YAKALANAMAYAN PROMISE HATASI (unhandledRejection):', reason);
});

const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const path = require('path');
const morgan = require('morgan');
const logger = require('./utils/logger');
const cron = require('node-cron');
const checkStalePrices = require('./cron/stalePriceChecker');

// ROTA DOSYALARINI İÇERİ AKTARMA
const adminRoutes = require('./routes/adminRoutes');
const categoryRoutes = require('./routes/categories');
const costingRoutes = require('./routes/costingRoutes');
const inventoryRoutes = require('./routes/inventoryRoutes');
const orderRoutes = require('./routes/orders');
const paymentRoutes = require('./routes/payments');
const productRoutes = require('./routes/products');
const productTreeRoutes = require('./routes/productTreeRoutes');
const settingsRoutes = require('./routes/settingsRoutes');
const uploadRoutes = require('./routes/uploadRoutes');
const userRoutes = require('./routes/usersMain');
const quoteRoutes = require('./routes/quotes');
const salesrepRoutes = require('./routes/salesrepRoutes');
const supplierRoutes = require('./routes/supplier'); // Bu satır eklendi
const errorMiddleware = require('./middleware/errorMiddleware');

// EXPRESS UYGULAMASINI OLUŞTURMA
const app = express();

// ORTA KATMAN YAZILIMLARI (MIDDLEWARE)
const corsOptions = {
    origin: process.env.CORS_ORIGIN || 'http://localhost:3000',
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
    credentials: true
};
app.use(cors(corsOptions));
app.use(morgan('combined', { stream: logger.stream }));
app.use(express.json());
app.use(cookieParser());

// VERİTABANI BAĞLANTISI
const MONGO_URI = process.env.MONGO_URI;

mongoose.connect(MONGO_URI, {
    useNewUrlParser: true,
    useUnifiedTopology: true
})
.then(() => {
    console.log("MongoDB veritabanına başarıyla bağlanıldı.");
})
.catch(err => {
    console.error("MongoDB bağlantı hatası:", err);
    process.exit(1); // Bağlantı başarısız olduğunda uygulamayı sonlandır
});


// API ROTALARINI TANIMLAMA
app.use('/api/admin', adminRoutes);
app.use('/api/categories', categoryRoutes);
app.use('/api/costing', costingRoutes);
app.use('/api/salesrep', salesrepRoutes);
app.use('/api/inventory', inventoryRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/payments', paymentRoutes);
app.use('/api/products', productRoutes);
app.use('/api/product-trees', productTreeRoutes);
app.use('/api/settings', settingsRoutes);
app.use('/api/upload', uploadRoutes);
// Tüm /api/users isteklerini ana kullanıcı yönlendiricisine gönder
app.use('/api/users', userRoutes);
app.use('/api/quotes', quoteRoutes);
app.use('/api/supplier', supplierRoutes); // Bu satır değiştirildi


// ZAMANLANMIŞ GÖREV (CRON JOB)
// Her gün gece yarısı (00:00) çalışır.
cron.schedule('0 0 * * *', () => {
    checkStalePrices();
}, {
    scheduled: true,
    timezone: "Europe/Istanbul"
});


// STATİK DOSYALARA ERİŞİM (Resimler vb. için)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));


// ÜRETİM (PRODUCTION) ORTAMI İÇİN YAPILANDIRMA
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/build')));
    app.get('*', (req, res) => {
        res.sendFile(path.resolve(__dirname, '../client/build', 'index.html'));
    });
} else {
    app.get('/', (req, res) => {
        res.send('B2B API çalışıyor... (Geliştirme Modu)');
    });
}


// HATA YÖNETİMİ (ERROR HANDLING) ORTA KATMANI
// Bulunamayan Rotalar İçin Hata Yakalayıcı (404)
app.use((req, res, next) => {
    const error = new Error(`Bulunamadı - ${req.originalUrl}`);
    error.statusCode = 404;
    res.status(404);
    next(error);
});

// Genel Hata Yakalayıcı
app.use(errorMiddleware);


// SUNUCUYU BAŞLATMA
const PORT = process.env.PORT || 5001;
app.listen(PORT, () => {
    console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
    // Sunucu ilk başladığında da bir kontrol yapalım
    console.log('Sunucu başlangıcında ilk bayat fiyat kontrolü yapılıyor...');
    checkStalePrices();
});

// Test ortamı için app'i dışa aktar
module.exports = app;