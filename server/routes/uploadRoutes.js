const path = require('path');
const express = require('express');
const multer = require('multer');
const router = express.Router();
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// Multer için depolama ayarları
const storage = multer.diskStorage({
  destination(req, file, cb) {
    cb(null, 'uploads/'); // Dosyaların 'uploads' klasörüne kaydedileceğini belirtir
  },
  filename(req, file, cb) {
    // Dosya adını eşsiz yapmak için: fieldname-tarih.uzantı
    cb(null, `${file.fieldname}-${Date.now()}${path.extname(file.originalname)}`);
  }
});

// Dosya tipi kontrolü
function checkFileType(file, cb) {
  const filetypes = /jpg|jpeg|png/;
  const extname = filetypes.test(path.extname(file.originalname).toLowerCase());
  const mimetype = filetypes.test(file.mimetype);

  if (extname && mimetype) {
    return cb(null, true);
  } else {
    // Hata nesnesi fırlatmak, daha iyi hata yönetimi sağlar
    cb(new Error('Sadece resim dosyaları yüklenebilir (jpg, jpeg, png)!'));
  }
}

// Multer middleware'ini yapılandırma
const upload = multer({
  storage,
  fileFilter: function (req, file, cb) {
    checkFileType(file, cb);
  }
});

// @route   POST /api/upload
// @desc    Upload an image
// @access  Private/Admin
router.post('/', protect, admin, (req, res) => {
    // upload.single middleware'ini doğrudan rota içinde kullanmak daha standart bir yöntemdir.
    const uploader = upload.single('image');

    uploader(req, res, function (err) {
        if (err) {
            // Multer veya checkFileType'dan gelen hataları yakala
            return res.status(400).json({ msg: err.message });
        }

        // Dosya yüklenmemişse hata ver
        if (!req.file) {
            return res.status(400).json({ msg: 'Lütfen bir resim dosyası seçin.' });
        }

        // Her şey yolundaysa, dosya yolunu JSON olarak gönder
        res.status(200).json({
            message: 'Resim başarıyla yüklendi.',
            image: `/${req.file.path.replace(/\\/g, "/")}`
        });
    });
});

module.exports = router;