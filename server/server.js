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
const helmet = require('helmet');

const rateLimit = require('express-rate-limit');
const hpp = require('hpp');
const cron = require('node-cron');
const checkStalePrices = require('./cron/stalePriceChecker');

// ROTA DOSYALARI daha önce burada doğrudan require edilip mount ediliyordu.
// Artık sorunlu route'ları tespit edebilmek için safeMount fonksiyonunu kullanacağız.
// Aşağıdaki eski require satırları kaldırıldı.
const errorMiddleware = require('./middleware/errorMiddleware');
const maintenanceMiddleware = require('./middleware/maintenanceMiddleware');

// EXPRESS UYGULAMASINI OLUŞTURMA
const app = express();
// Render ve diğer proxy ortamlarında doğru IP tespiti ve rate limit için
// 'trust proxy' ayarlamak gerekir. Aksi halde express-rate-limit X-Forwarded-For
// başlığından dolayı hata fırlatır.
app.set('trust proxy', 1);

// ORTA KATMAN YAZILIMLARI (MIDDLEWARE)
// Kesin olarak izin verilen origin'leri belirt
const allowedOrigins = ['http://localhost:3000', 'https://localhost:3000', 'https://b2bsitesibitmis.onrender.com', 'https://curkuslar.online', 'https://www.curkuslar.online'];

console.log('CORS için izin verilen originler:', allowedOrigins);

const corsOptions = {
    origin: function(origin, callback) {
        // Kaynağı olmayan isteklere izin ver (Postman, curl vb.)
        if (!origin) {
            console.log('Origin olmayan istek kabul edildi');
            return callback(null, true);
        }
        
        // İzin verilen originler listesinde varsa izin ver
        if (allowedOrigins.indexOf(origin) !== -1) {
            console.log('CORS izni verilen origin:', origin);
            return callback(null, true);
        }

        // Debug için
        console.log('CORS izni reddedilen origin:', origin);
        callback(new Error('CORS tarafından izin verilmiyor: ' + origin));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With'],
    exposedHeaders: ['Access-Control-Allow-Origin']
};
// Güvenlik middlewares
app.use(helmet());
// Ek güvenlik başlıkları
app.use(helmet.frameguard({ action: 'deny' })); // X-Frame-Options: DENY
app.use(helmet.noSniff()); // X-Content-Type-Options: nosniff
app.use(helmet.hsts({ maxAge: 63072000, includeSubDomains: true, preload: true })); // Strict-Transport-Security
app.use(helmet.contentSecurityPolicy({
  directives: {
    defaultSrc: ["'self'", "https://b2bsitesibitmis.onrender.com", "https://curkuslar.online"],
    scriptSrc: ["'self'", "'unsafe-inline'"],
    connectSrc: ["'self'", "https://b2bsitesibitmis.onrender.com", "https://curkuslar.online", "wss://*"],
    imgSrc: ["'self'", 'data:', 'blob:', 'https:'],
    objectSrc: ["'none'"],
    baseUri: ["'self'"],
    frameSrc: ["'none'"],
    frameAncestors: ["'none'"]
  }
}));

app.use(hpp());

// CORS
app.use(cors(corsOptions));

// Günlükleme
app.use(morgan('combined', { stream: logger.stream }));

// Global rate limiter
const apiLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 100,
  standardHeaders: true,
  legacyHeaders: false,
  message: { msg: 'Çok fazla istek yaptınız, lütfen 15 dakika sonra tekrar deneyin.' }
});
app.use('/api', apiLimiter);

// Body parsers (boyut limiti)
app.use(express.json({ limit: '10kb' }));
app.use(express.urlencoded({ extended: true, limit: '10kb' }));

// URL yapılandırma sorunlarını düzeltecek gelişmiş ara yazılım
app.use((req, res, next) => {
    // API URL sorunlarını düzeltmek için regex kullanımı
    const patterns = [
        { pattern: /\/api\/api\//, replacement: '/api/' }, // Çift /api/api/ sorununu düzelt
        { pattern: /\/api\/users\/api\//, replacement: '/api/users/' }, // /api/users/api/ sorununu düzelt
        { pattern: /connect(\d+)/, replacement: (match, p1) => `connect${p1}` } // connect1 vb. için yapılandırma
    ];
    
    let originalUrl = req.url;
    let changed = false;
    
    // Tüm regex düzeltmelerini uygula
    patterns.forEach(({ pattern, replacement }) => {
        if (pattern.test(req.url)) {
            req.url = req.url.replace(pattern, replacement);
            changed = true;
        }
    });
    
    // URL değiştiyse log kaydı tut
    if (changed) {
        console.log(`URL düzeltildi: ${originalUrl} -> ${req.url}`);
    }
    
    next();
});
app.use(cookieParser());

// Bakım modu kontrolü (tüm API rotalarından önce gelmeli)
app.use('/api', maintenanceMiddleware);

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
safeMount('./routes/priceListRoutes', '/api/pricelists');
safeMount('./routes/testRoutes', '/api/test'); // Test rotaları
safeMount('./routes/returns', '/api/returns'); // İade rotaları

// ZAMANLANMIŞ GÖREV (CRON JOB)
// Her gün gece yarısı (00:00) çalışır.
cron.schedule('0 0 * * *', () => {
    checkStalePrices();
}, {
    scheduled: true,
    timezone: "Europe/Istanbul"
});

// STATİK DOSYALARA ERİŞİM
// Uploads klasörü (resimler vb. için)
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// Önce tüm statik dosyaları serve et
app.use(express.static(path.join(__dirname, 'public')));

// API istekleri için route'ları kullan
// Client-side routing için HTML5 fallback
app.use((req, res, next) => {
    // API istekleri için pass
    if (req.path.startsWith('/api/')) {
        return next();
    }
    
    // Statik olmayan tüm istekleri index.html'e yönlendir (React Router için)
    res.sendFile(path.join(__dirname, 'public', 'index.html'), err => {
        if (err) {
            console.error('Statik dosya servis hatası:', err);
            res.status(500).send('Statik dosya servis hatası');
        }
    });
});


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
// Render ortamında process.env.PORT her zaman ayarlanmış olmalıdır
const PORT = parseInt(process.env.PORT || '3000', 10);
console.log(`Kullanılan PORT değişkeni: ${process.env.PORT || '3000 (varsayılan)'}`);

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Sunucu ${PORT} portunda 0.0.0.0 adresinde çalışıyor (Render için).`);
    // Sunucu ilk başladığında da bir kontrol yapalım
    console.log('Sunucu başlangıcında ilk bayat fiyat kontrolü yapılıyor...');
    checkStalePrices();
});

// Test ortamı için app'i dışa aktar
module.exports = app;