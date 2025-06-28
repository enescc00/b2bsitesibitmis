const express = require('express');
const router = express.Router();
const {
    getPriceLists,
    getPriceListById,
    createPriceList,
    updatePriceList,
    deletePriceList
} = require('../controllers/priceListController');
const { protect, admin } = require('../middleware/authMiddleware');

router.route('/')
    .get(protect, admin, getPriceLists)
    .post(protect, admin, createPriceList);

router.route('/:id')
    .get(protect, admin, getPriceListById)
    .put(protect, admin, updatePriceList)
    .delete(protect, admin, deletePriceList);

module.exports = router;
