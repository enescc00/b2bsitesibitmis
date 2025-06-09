const jwt = require('jsonwebtoken');
const { User } = require('../models/User'); // DEĞİŞİKLİK BURADA: Süslü parantez ekledik.

const protect = async (req, res, next) => {
  let token;

  if (
    req.headers.authorization &&
    req.headers.authorization.startsWith('Bearer')
  ) {
    try {
      // Token'ı header'dan al ('Bearer TOKEN' formatında gelir)
      token = req.headers.authorization.split(' ')[1];

      // Token'ı doğrula
      const decoded = jwt.verify(token, process.env.JWT_SECRET);

      // Kullanıcıyı ID ile bul ve parolası olmadan isteğe ekle
      // Artık User değişkenimiz doğru Mongoose modeli olduğu için .findById çalışacaktır.
      req.user = await User.findById(decoded.user.id).select('-password');

      next(); // Her şey yolundaysa bir sonraki işleme geç
    } catch (error) {
      console.error(error);
      res.status(401).json({ msg: 'Yetkilendirme başarısız, token geçersiz.' });
    }
  }

  if (!token) {
    res.status(401).json({ msg: 'Yetkilendirme başarısız, token bulunamadı.' });
  }
};

module.exports = { protect };