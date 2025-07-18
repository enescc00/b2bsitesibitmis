const crypto = require('crypto');
const jwt = require('jsonwebtoken');

// Payload Mongoose belgeleri veya döngüsel referanslar içerebilir.
// Sadece gerekli alanları içeren hafif bir payload oluşturarak JSON.stringify hatalarını önleriz.
function generateAccessToken(payload) {
  let minimalPayload = payload;
  if (payload && payload.user) {
    const { id, name, role } = payload.user;
    minimalPayload = { user: { id, name, role } };
  }
  return jwt.sign(minimalPayload, process.env.JWT_SECRET, { expiresIn: '15m' });
}

function generateRefreshToken() {
  return crypto.randomBytes(40).toString('hex');
}

module.exports = { generateAccessToken, generateRefreshToken };
