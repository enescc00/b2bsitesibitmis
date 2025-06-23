const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const { body, validationResult } = require('express-validator');
const asyncHandler = require('express-async-handler');
const ErrorHandler = require('../../utils/errorHandler');
const { SupplierUser, User } = require('../../models/User');

// @route   POST /api/users/supplier/register
// @desc    Yeni tedarikçi kaydı (admin onaylı)
// @access  Public
router.post('/register', [
  body('companyTitle', 'Şirket unvanı zorunludur').not().isEmpty().trim().escape(),
  body('taxNumber', 'Vergi numarası zorunludur').not().isEmpty().trim(),
  body('taxOffice', 'Vergi dairesi zorunludur').not().isEmpty().trim().escape(),
  body('email', 'Geçerli e-posta adresi girin').isEmail().normalizeEmail(),
  body('password', 'Şifre en az 6 karakter olmalıdır').isLength({ min: 6 })
], asyncHandler(async (req, res, next) => {
  const errors = validationResult(req);
  if (!errors.isEmpty()) {
    return res.status(400).json({ errors: errors.array() });
  }

  const { companyTitle, taxNumber, taxOffice, email, password, iban, contactPerson, phone } = req.body;

  // Çift kayıt kontrolü
  const existingEmail = await User.findOne({ email });
  if (existingEmail) return next(new ErrorHandler('Bu email adresi zaten kullanılıyor.', 400));
  const existingTax = await SupplierUser.findOne({ taxNumber });
  if (existingTax) return next(new ErrorHandler('Bu vergi numarası zaten kayıtlı.', 400));

  const salt = await bcrypt.genSalt(10);
  const hashed = await bcrypt.hash(password, salt);

  const newSupplier = new SupplierUser({
    name: companyTitle,
    email,
    password: hashed,
    role: 'supplier',
    companyTitle,
    taxNumber,
    taxOffice,
    iban,
    contactPerson,
    phone,
    isApproved: false // admin onayı bekler
  });

  await newSupplier.save();
  res.status(201).json({ msg: 'Tedarikçi kaydı başarıyla alındı. Hesabınız yönetici onayından sonra aktif olacak.'});
}))

module.exports = router;
