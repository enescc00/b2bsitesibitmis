const path = require('path');
const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
require('dotenv').config();

// Rota dosyaları
const categoryRoutes = require('./routes/categories');
const productRoutes = require('./routes/products');
const userRoutes = require('./routes/users');
const orderRoutes = require('./routes/orders');
const uploadRoutes = require('./routes/uploadRoutes');

const app = express();
const PORT = process.env.PORT || 5001;

// Middleware'ler
app.use(cors());
app.use(express.json());

// Veritabanı bağlantısı
const MONGO_URI = process.env.MONGO_URI || "mongodb://localhost:27017/b2bDatabase";

mongoose.connect(MONGO_URI)
  .then(() => console.log("MongoDB veritabanına başarıyla bağlanıldı."))
  .catch(err => console.error("MongoDB bağlantı hatası:", err));


// Rotalar
app.get('/api', (req, res) => {
  res.json({ message: "B2B E-Ticaret API'sine hoş geldiniz!" });
});
app.use('/api/categories', categoryRoutes);
app.use('/api/products', productRoutes);
app.use('/api/users', userRoutes);
app.use('/api/orders', orderRoutes);
app.use('/api/upload', uploadRoutes);


// `uploads` klasörünü statik hale getirerek dışarıya açıyoruz.
// Bu satır, tarayıcının http://localhost:5001/uploads/resim.jpg gibi adreslere
// erişerek resimleri görebilmesini sağlar.
const currentDir = __dirname;
app.use('/uploads', express.static(path.join(currentDir, '/uploads')));


app.listen(PORT, () => {
  console.log(`Sunucu http://localhost:${PORT} adresinde çalışıyor.`);
});