const express = require('express');
const router = express.Router();

// Rota dosyalarını içeri aktar
const customerRoutes = require('./customers');
const dashboardRoutes = require('./dashboard');

// Rotaları ilgili yollara bağla
router.use('/customers', customerRoutes);
router.use('/dashboard', dashboardRoutes);

module.exports = router;
