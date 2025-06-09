const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { User } = require('../models/User'); // Ana User modelini kullanmamız yeterli
const { protect } = require('../middleware/authMiddleware');
const { admin } = require('../middleware/adminMiddleware');

// @route   GET /api/users
// @desc    Get all users (Admin only)
// @access  Private/Admin
router.get('/', protect, admin, async (req, res) => {
    try {
        const users = await User.find({}).select('-password');
        res.json(users);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   GET /api/users/:id
// @desc    Get user by ID (Admin only)
// @access  Private/Admin
router.get('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id).select('-password');
        if (user) {
            res.json(user);
        } else {
            res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   PUT /api/users/:id
// @desc    Update user by ID (Admin only)
// @access  Private/Admin
router.put('/:id', protect, admin, async (req, res) => {
    try {
        const user = await User.findById(req.params.id);

        if (user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            user.role = req.body.role || user.role;
            user.currentAccountBalance = req.body.currentAccountBalance !== undefined ? req.body.currentAccountBalance : user.currentAccountBalance;

            if (user.__t === 'CorporateUser') {
                user.companyTitle = req.body.companyTitle || user.companyTitle;
            }

            const updatedUser = await user.save();
            res.json(updatedUser);
        } else {
            res.status(404).json({ msg: 'Kullanıcı bulunamadı' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   POST api/users/register
// @desc    Yeni kullanıcı (müşteri) kaydı (Bireysel/Kurumsal)
router.post('/register', async (req, res) => {
  const { userType, email, password, name, address, taxOffice, tcKimlik, companyTitle, taxNumber } = req.body;
  try {
    let existingUser = await User.findOne({ email });
    if (existingUser) return res.status(400).json({ msg: 'Bu email adresi ile bir kullanıcı zaten mevcut.' });
    if (userType === 'bireysel' && tcKimlik) {
        const existingTc = await User.findOne({ tcKimlik });
        if(existingTc) return res.status(400).json({ msg: 'Bu TC Kimlik Numarası zaten kayıtlı.' });
    }
    if (userType === 'kurumsal' && taxNumber) {
        const existingTax = await User.findOne({ taxNumber });
        if(existingTax) return res.status(400).json({ msg: 'Bu Vergi Numarası zaten kayıtlı.' });
    }
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);
    let newUser;
    const initialAddress = { addressTitle: 'Varsayılan Adres', province: address.province, district: address.district, fullAddress: address.fullAddress };
    if (userType === 'bireysel') {
        const IndividualUserModel = User.discriminators['IndividualUser'];
        newUser = new IndividualUserModel({ name, email, password: hashedPassword, tcKimlik, taxOffice, addresses: [initialAddress] });
    } else if (userType === 'kurumsal') {
        const CorporateUserModel = User.discriminators['CorporateUser'];
        newUser = new CorporateUserModel({ name, email, password: hashedPassword, companyTitle, taxNumber, taxOffice, addresses: [initialAddress] });
    } else {
        return res.status(400).json({ msg: 'Geçersiz kullanıcı tipi.' });
    }
    await newUser.save();
    res.status(201).json({ msg: 'Kullanıcı başarıyla oluşturuldu.' });
  } catch (err) {
    console.error(err.message);
    if(err.code === 11000) return res.status(400).json({ msg: 'Girilen bilgilerden bazıları (Email, TC, Vergi No) zaten kullanımda.' });
    res.status(500).json({ msg: 'Sunucu hatası oluştu. Lütfen tekrar deneyin.' });
  }
});

// @route   POST api/users/login
// @desc    Kullanıcı girişi ve token alma
router.post('/login', async (req, res) => {
  const { email, password } = req.body;
  try {
    let user = await User.findOne({ email });
    if (!user) return res.status(400).json({ msg: 'Geçersiz kullanıcı bilgileri.' });
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) return res.status(400).json({ msg: 'Geçersiz kullanıcı bilgileri.' });
    const payload = { user: { id: user.id, name: user.name, role: user.role, addresses: user.addresses } };
    jwt.sign(payload, process.env.JWT_SECRET, { expiresIn: '5h' }, (err, token) => {
        if (err) throw err;
        res.json({ token });
    });
  } catch (err) {
    console.error(err.message);
    res.status(500).json({ msg: 'Sunucu hatası oluştu.' });
  }
});

// @route   POST /api/users/add-address
// @desc    Add new address for logged in user
// @access  Private
router.post('/add-address', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if (!user) return res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
        user.addresses.push(req.body);
        await user.save();
        res.status(201).json(user.addresses);
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası' });
    }
});

// @route   GET api/users/profile
// @desc    Get user profile
// @access  Private
router.get('/profile', protect, async (req, res) => {
    res.json(req.user);
});

// @route   PUT api/users/profile
// @desc    Update user profile
// @access  Private
router.put('/profile', protect, async (req, res) => {
    try {
        const user = await User.findById(req.user.id);
        if(user) {
            user.name = req.body.name || user.name;
            user.email = req.body.email || user.email;
            if (user.__t === 'IndividualUser') { user.tcKimlik = req.body.tcKimlik || user.tcKimlik; }
            else if (user.__t === 'CorporateUser') {
                user.companyTitle = req.body.companyTitle || user.companyTitle;
                user.taxNumber = req.body.taxNumber || user.taxNumber;
            }
            user.taxOffice = req.body.taxOffice || user.taxOffice;
            const updatedUser = await user.save();
            res.json({ _id: updatedUser._id, name: updatedUser.name, email: updatedUser.email, });
        } else {
            res.status(404).json({ msg: 'Kullanıcı bulunamadı.' });
        }
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası'});
    }
});

// @route   PUT api/users/profile/password
// @desc    Change user password
// @access  Private
router.put('/profile/password', protect, async (req, res) => {
    const { currentPassword, newPassword } = req.body;
    try {
        const user = await User.findById(req.user.id);
        const isMatch = await bcrypt.compare(currentPassword, user.password);
        if (!isMatch) return res.status(401).json({ msg: 'Mevcut şifre yanlış.' });
        const salt = await bcrypt.genSalt(10);
        user.password = await bcrypt.hash(newPassword, salt);
        await user.save();
        res.json({ msg: 'Şifre başarıyla güncellendi.' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ msg: 'Sunucu Hatası'});
    }
});


module.exports = router;