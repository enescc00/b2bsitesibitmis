const express = require('express');
const router = express.Router();
const { protect, admin } = require('../middleware/authMiddleware');
const { transporter, sendTestEmail } = require('../config/emailConfig');
const { sendWelcomeEmail, sendPasswordResetEmail, sendOrderStatusUpdateEmail } = require('../services/emailService');
const { User } = require('../models/User');
const Token = require('../models/Token');

/**
 * @route   GET /api/test/email
 * @desc    Test e-posta gönderme (sadece admin)
 * @access  Private/Admin
 */
router.get('/email', protect, admin, async (req, res) => {
    try {
        // Kullanıcının kendi e-posta adresine test e-postası gönder
        const result = await sendTestEmail(req.user.email);
        
        if (result.success) {
            res.status(200).json({
                message: `Test e-postası ${req.user.email} adresine başarıyla gönderildi.`
            });
        } else {
            res.status(500).json({
                error: 'E-posta gönderilirken bir hata oluştu.',
                details: result.error
            });
        }
    } catch (error) {
        console.error('Test e-posta gönderimi sırasında hata:', error);
        res.status(500).json({
            error: 'Test e-posta gönderimi sırasında bir hata oluştu.',
            details: error.message
        });
    }
});

/**
 * @route   GET /api/test/welcome-email
 * @desc    Test hoş geldin e-postası gönderme (sadece admin)
 * @access  Private/Admin
 */
router.get('/welcome-email', protect, admin, async (req, res) => {
    try {
        // Admin kullanıcısının bilgilerini kullanarak hoş geldin e-postası gönder
        const user = await User.findById(req.user.id);
        const result = await sendWelcomeEmail(user);
        
        res.status(200).json({
            message: `Hoş geldin test e-postası ${user.email} adresine ${result.success ? 'başarıyla gönderildi' : 'gönderilemedi'}.`,
            details: result
        });
    } catch (error) {
        console.error('Test hoş geldin e-postası gönderimi sırasında hata:', error);
        res.status(500).json({
            error: 'Test hoş geldin e-postası gönderimi sırasında bir hata oluştu.',
            details: error.message
        });
    }
});

/**
 * @route   GET /api/test/password-reset-email
 * @desc    Test şifre sıfırlama e-postası gönderme (sadece admin)
 * @access  Private/Admin
 */
router.get('/password-reset-email', protect, admin, async (req, res) => {
    try {
        // Admin kullanıcısının bilgilerini kullanarak şifre sıfırlama e-postası gönder
        const user = await User.findById(req.user.id);
        const result = await sendPasswordResetEmail(user, Token);
        
        res.status(200).json({
            message: `Şifre sıfırlama test e-postası ${user.email} adresine ${result.success ? 'başarıyla gönderildi' : 'gönderilemedi'}.`,
            details: result
        });
    } catch (error) {
        console.error('Test şifre sıfırlama e-postası gönderimi sırasında hata:', error);
        res.status(500).json({
            error: 'Test şifre sıfırlama e-postası gönderimi sırasında bir hata oluştu.',
            details: error.message
        });
    }
});

module.exports = router;
