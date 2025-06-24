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

// ROTA DOSYALARI daha önce burada doğrudan require edilip mount ediliyordu.
// Artık sorunlu route'ları tespit edebilmek için safeMount fonksiyonunu kullanacağız.
// Aşağıdaki eski require satırları kaldırıldı.
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


// ROTA DOSYALARINI GÜVENLİ ŞEKİLDE MOUNT ETME FONKSİYONU
const safeMount = (routePath, mountPoint) => {
    try {
        const routerModule = require(routePath);
        app.use(mountPoint, routerModule);
        console.log(`✅ Mounted ${routePath} -> ${mountPoint}`);
    } catch (err) {
        console.error(`❌ Crash mounting ${routePath}`, err);
        throw err; // Render loglarında görünmesi için hatayı ileri gönder
    }
};

// API ROTALARINI TANIMLAMA (SAFE)
safeMount('./routes/adminRoutes', '/api/admin');
safeMount('./routes/categories', '/api/categories');
safeMount('./routes/costingRoutes', '/api/costing');
safeMount('./routes/salesrepRoutes', '/api/salesrep');
safeMount('./routes/inventoryRoutes', '/api/inventory');
safeMount('./routes/orders', '/api/orders');
safeMount('./routes/payments', '/api/payments');
safeMount('./routes/products', '/api/products');
safeMount('./routes/productTreeRoutes', '/api/product-trees');
safeMount('./routes/settingsRoutes', '/api/settings');
safeMount('./routes/uploadRoutes', '/api/upload');
safeMount('./routes/usersMain', '/api/users');
safeMount('./routes/quotes', '/api/quotes');
safeMount('./routes/supplier', '/api/supplier');


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
// Serve static files from the public folder
if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, 'public')));
    // Use named wildcard parameter for catch-all route
    app.get('/*any', (req, res) => {
        res.sendFile(path.join(__dirname, 'public', 'index.html'));
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