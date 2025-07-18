const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const crypto = require('crypto');
const { generateAccessToken, generateRefreshToken } = require('../../utils/tokenService');
const { body, validationResult } = require('express-validator');
const rateLimit = require('express-rate-limit');
const asyncHandler = require('express-async-handler');
const ErrorHandler = require('../../utils/errorHandler');
const { User, IndividualUser, CorporateUser } = require('../../models/User');
const Token = require('../../models/Token');
const { protect, admin } = require('../../middleware/authMiddleware');
const { sendWelcomeEmail, sendPasswordResetEmail } = require('../../services/emailService');

const authLimiter = rateLimit({
    windowMs: 15 * 60 * 1000,
    max: 20,
    standardHeaders: true,
    legacyHeaders: false,
    message: { msg: 'Bu IP adresinden çok fazla istek yapıldı. Lütfen 15 dakika sonra tekrar deneyin.' }
});

// @route   POST /api/users/auth/register
// @desc    Yeni kullanıcı kaydı
// @access  Public
router.post('/register', authLimiter, [
    body('name', 'İsim alanı boş bırakılamaz.').not().isEmpty().trim().escape(),
    body('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail().normalizeEmail(),
    body('password', 'Şifre en az 6 karakter olmalıdır.').isLength({ min: 6 }),
    body('address.province', 'İl bilgisi zorunludur.').not().isEmpty().trim().escape(),
    body('address.district', 'İlçe bilgisi zorunludur.').not().isEmpty().trim().escape(),
    body('address.fullAddress', 'Adres bilgisi zorunludur.').not().isEmpty().trim().escape(),
    body('userType', 'Kullanıcı tipi belirtilmelidir.').isIn(['bireysel', 'kurumsal']),
    body('tcKimlik', 'TC kimlik numarası zorunludur.').if(body('userType').equals('bireysel')).not().isEmpty(),
    body('taxNumber', 'Vergi numarası zorunludur.').if(body('userType').equals('kurumsal')).not().isEmpty(),
    body('taxOffice', 'Vergi dairesi bilgisi zorunludur.').if(body('userType').equals('kurumsal')).not().isEmpty().trim().escape()
], async (req, res, next) => {
    try {
        const errors = validationResult(req);
        if (!errors.isEmpty()) {
            return res.status(400).json({ errors: errors.array() });
        }

        const { name, email, password, userType, address, tcKimlik, taxNumber, taxOffice } = req.body;
        
        let existingUser = await User.findOne({ email });
        if (existingUser) return next(new ErrorHandler('Bu email adresi ile bir kullanıcı zaten mevcut.', 400));

        // Check for duplicate TC Kimlik or Vergi Numarası to prevent DB crash
        if (userType === 'bireysel' && tcKimlik) {
            const existingIndividual = await IndividualUser.findOne({ tcKimlik });
            if (existingIndividual) {
                return next(new ErrorHandler('Bu TC kimlik numarası ile bir kullanıcı zaten mevcut.', 400));
            }
        } else if (userType === 'kurumsal' && taxNumber) {
            const existingCorporate = await CorporateUser.findOne({ taxNumber });
            if (existingCorporate) {
                return next(new ErrorHandler('Bu vergi numarası ile bir kullanıcı zaten mevcut.', 400));
            }
        }

        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);

        let newUser;
        const initialAddress = { 
            addressTitle: 'Varsayılan Adres', 
            province: address.province, 
            district: address.district, 
            fullAddress: address.fullAddress 
        };

        if (userType === 'bireysel') {
            newUser = new IndividualUser({ 
                name, 
                email, 
                password: hashedPassword, 
                tcKimlik, 
                addresses: [initialAddress] 
            });
        } else if (userType === 'kurumsal') {
            newUser = new CorporateUser({ 
                name, 
                email, 
                password: hashedPassword, 
                companyTitle: name,
                taxNumber, 
                taxOffice, 
                addresses: [initialAddress] 
            });
        } else {
            return next(new ErrorHandler('Geçersiz kullanıcı tipi.', 400));
        }

        await newUser.save();
        
        // Hoş geldin e-postası gönder
        try {
            await sendWelcomeEmail(newUser);
            console.log(`${newUser.email} adresine hoş geldin e-postası gönderildi.`);
        } catch (emailError) {
            console.error('Hoş geldin e-postası gönderilirken hata oluştu:', emailError);
            // E-posta gönderiminde hata oluşsa da kullanıcıya başarılı kayıt mesajı gönder
        }
        
        res.status(201).json({ msg: 'Kayıt başarıyla oluşturuldu. Admin onayından sonra hesabınız aktif olacak. E-posta adresinize bir hoş geldin mesajı gönderildi.' });
    } catch (error) {
        console.error("KAYIT İŞLEMİNDE KRİTİK HATA:", error);
        next(error);
    }
});

// @route   POST /api/users/auth/login
// @desc    Kullanıcı giriş yapar
// @access  Public
router.post('/login', authLimiter, [
    body('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail().normalizeEmail(),
    body('password', 'Şifre alanı zorunludur.').exists()
], asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    let user = await User.findOne({ email }).select('+password');

    if (!user) {
        return next(new ErrorHandler('Geçersiz kullanıcı bilgileri.', 401));
    }

    // Güvenlik katmanı: bcrypt.compare'e undefined değer gitmesini engelle
    if (!password || !user.password) {
        return next(new ErrorHandler('Geçersiz kullanıcı bilgileri.', 401));
    }

    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return next(new ErrorHandler('Geçersiz kullanıcı bilgileri.', 401));
    }

    if (!user.isApproved) {
        return next(new ErrorHandler('Hesabınız henüz yönetici tarafından onaylanmadı.', 403));
    }

    // Mongoose nesnelerini JSON'a çevirirken döngüsel referans hatasını önlemek için
    // sadece gerekli alanları içeren güvenli bir payload oluşturuyoruz
    
    // Adresleri basit nesnelere dönüştür - döngüsel referansları önler
    const safeAddresses = user.addresses ? user.addresses.map(addr => ({
        addressTitle: addr.addressTitle,
        province: addr.province,
        district: addr.district,
        fullAddress: addr.fullAddress
    })) : [];
    
    const payload = {
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
            addresses: safeAddresses,
            currentAccountBalance: user.currentAccountBalance ? user.currentAccountBalance : 0
        }
    };

    if (!process.env.JWT_SECRET) {
        console.error('JWT_SECRET ortam değişkeni eksik!');
        return next(new ErrorHandler('Sunucu yapılandırması eksik (JWT_SECRET tanımsız).', 500));
    }
    try {
        const accessToken = generateAccessToken(payload);
        const refreshToken = generateRefreshToken();
        user.refreshTokens.push(refreshToken);
        await user.save();
        res.cookie('refreshToken', refreshToken, {
            httpOnly: true,
            secure: process.env.NODE_ENV === 'production',
            sameSite: 'strict',
            maxAge: 30 * 24 * 60 * 60 * 1000 // 30 gün
        });
        res.json({ token: accessToken });
    } catch (err) {
        console.error('JWT İmzalama Hatası:', err);
        return next(new ErrorHandler('Token oluşturulurken bir sistem hatası oluştu.', 500));
    }
}));

// @route POST /api/users/auth/refresh
// @desc  Yeni access token üretir
// @access Public (cookie üzerinden)
router.post('/refresh', asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies || {};
    if (!refreshToken) return next(new ErrorHandler('Refresh token yok.', 401));

    const user = await User.findOne({ refreshTokens: refreshToken });
    if (!user) return next(new ErrorHandler('Geçersiz refresh token.', 401));

    const payload = {
        user: {
            id: user.id,
            name: user.name,
            role: user.role,
            addresses: user.addresses,
            currentAccountBalance: user.currentAccountBalance
        }
    };
    const newAccess = generateAccessToken(payload);
    res.json({ token: newAccess });
}));

// @route POST /api/users/auth/logout
router.post('/logout', asyncHandler(async (req, res, next) => {
    const { refreshToken } = req.cookies || {};
    if (refreshToken) {
        await User.updateOne({ refreshTokens: refreshToken }, { $pull: { refreshTokens: refreshToken } });
    }
    res.clearCookie('refreshToken');
    res.json({ msg: 'Çıkış yapıldı' });
}));

// @route GET /api/users/auth/verifytoken
// @desc Verify token validity
// @access Private
router.get('/verifytoken', protect, asyncHandler(async (req, res) => {
    // Token valid ise protect middleware'den geçer ve buraya gelir
    res.status(200).json({ valid: true, user: req.user });
}));

// @route GET /api/users/verifytoken (Legacy support)
// @desc Verify token validity (for backwards compatibility)
// @access Private
router.get('/verifytoken', protect, asyncHandler(async (req, res) => {
    // Eski versiyon için aynı işlevi görür
    res.status(200).json({ valid: true, user: req.user });
}));

// @route   POST /api/users/auth/forgot-password
// @desc    Şifre sıfırlama e-postası gönderir
// @access  Public
router.post('/forgot-password', [
    body('email', 'Lütfen geçerli bir e-posta adresi girin.').isEmail().normalizeEmail()
], asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email } = req.body;
    const user = await User.findOne({ email });

    if (!user) {
        // Güvenlik nedeniyle kullanıcı bulunamasa bile başarılı mesaj döndür
        return res.status(200).json({ 
            msg: 'Eğer bu e-posta adresine sahip bir hesap varsa, şifre sıfırlama talimatları gönderilecektir.'
        });
    }

    try {
        // Önceki tokenleri temizle (aynı kullanıcı için)
        await Token.deleteMany({ userId: user._id, type: 'passwordReset' });
        
        // Şifre sıfırlama e-postası gönder
        const result = await sendPasswordResetEmail(user, Token);
        
        if (!result.success) {
            return next(new ErrorHandler('E-posta gönderilirken bir hata oluştu.', 500));
        }
        
        res.status(200).json({ 
            msg: 'Şifre sıfırlama bağlantısı e-posta adresinize gönderildi.'
        });
    } catch (error) {
        console.error('Şifre sıfırlama e-postası gönderilirken hata:', error);
        next(new ErrorHandler('Şifre sıfırlama işlemi sırasında bir hata oluştu.', 500));
    }
}));

// @route   POST /api/users/auth/reset-password/:token
// @desc    Token ile şifreyi sıfırlar
// @access  Public
router.post('/reset-password/:token', [
    body('password', 'Şifre en az 6 karakter olmalıdır.').isLength({ min: 6 }),
    body('confirmPassword', 'Şifreler eşleşmiyor.').custom((value, { req }) => {
        if (value !== req.body.password) {
            throw new Error('Şifreler eşleşmiyor.');
        }
        return true;
    })
], asyncHandler(async (req, res, next) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    
    const { token } = req.params;
    const { password } = req.body;
    
    try {
        // Token'ı hash'le (DB'de hash'lenmiş şekilde saklanıyor)
        const hashedToken = crypto
            .createHash('sha256')
            .update(token)
            .digest('hex');
        
        // Token DB'de var mı kontrol et
        const passwordResetToken = await Token.findOne({ 
            token: hashedToken, 
            type: 'passwordReset',
            expires: { $gt: Date.now() }
        });
        
        if (!passwordResetToken) {
            return next(new ErrorHandler('Geçersiz veya süresi dolmuş token.', 400));
        }
        
        // İlgili kullanıcıyı bul
        const user = await User.findById(passwordResetToken.userId);
        
        if (!user) {
            return next(new ErrorHandler('Kullanıcı bulunamadı.', 404));
        }
        
        // Yeni şifreyi hash'le
        const salt = await bcrypt.genSalt(10);
        const hashedPassword = await bcrypt.hash(password, salt);
        
        // Şifreyi güncelle
        user.password = hashedPassword;
        await user.save();
        
        // Token'ı sil
        await passwordResetToken.deleteOne();
        
        res.status(200).json({ msg: 'Şifreniz başarıyla sıfırlandı. Yeni şifrenizle giriş yapabilirsiniz.' });
    } catch (error) {
        console.error('Şifre sıfırlama hatası:', error);
        next(new ErrorHandler('Şifre sıfırlama işlemi sırasında bir hata oluştu.', 500));
    }
}));

module.exports = router;
