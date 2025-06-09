const admin = (req, res, next) => {
  // `protect` middleware'i daha önce çalıştığı için req.user'ın var olduğunu varsayabiliriz.
  if (req.user && req.user.role === 'admin') {
    next(); // Kullanıcı admin ise, isteğin devam etmesine izin ver
  } else {
    res.status(403).json({ msg: 'Erişim reddedildi. Admin yetkisi gerekli.' });
  }
};

module.exports = { admin };