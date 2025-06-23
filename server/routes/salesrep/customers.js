const express = require('express');
const router = express.Router();
const { getAssignedCustomers } = require('../../controllers/salesrep/customerController');
const { protect, salesrep } = require('../../middleware/authMiddleware');

// Bu yönlendiricideki tüm rotalar, protect ve salesrep middleware'lerinden geçecek.
// Yani sadece giriş yapmış ve rolü 'sales_rep' veya 'admin' olanlar erişebilir.
router.use(protect, salesrep);

router.route('/')
    .get(getAssignedCustomers);

module.exports = router;
