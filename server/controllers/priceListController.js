const PriceList = require('../models/priceListModel');
const asyncHandler = require('express-async-handler');

// @desc    Get all price lists
// @route   GET /api/pricelists
// @access  Admin
const getPriceLists = asyncHandler(async (req, res) => {
    const priceLists = await PriceList.find({});
    res.json(priceLists);
});

// @desc    Get price list by ID
// @route   GET /api/pricelists/:id
// @access  Admin
const getPriceListById = asyncHandler(async (req, res) => {
    const priceList = await PriceList.findById(req.params.id);

    if (priceList) {
        res.json(priceList);
    } else {
        res.status(404);
        throw new Error('Price list not found');
    }
});

// @desc    Create a new price list
// @route   POST /api/pricelists
// @access  Admin
const createPriceList = asyncHandler(async (req, res) => {
    const { name, globalDiscount, categoryDiscounts, productPrices } = req.body;

    const priceList = new PriceList({
        name,
        globalDiscount,
        categoryDiscounts,
        productPrices
    });

    const createdPriceList = await priceList.save();
    res.status(201).json(createdPriceList);
});

// @desc    Update a price list
// @route   PUT /api/pricelists/:id
// @access  Admin
const updatePriceList = asyncHandler(async (req, res) => {
    const { name, globalDiscount, categoryDiscounts, productPrices } = req.body;

    const priceList = await PriceList.findById(req.params.id);

    if (priceList) {
        priceList.name = name || priceList.name;
        priceList.globalDiscount = globalDiscount !== undefined ? globalDiscount : priceList.globalDiscount;
        priceList.categoryDiscounts = categoryDiscounts || priceList.categoryDiscounts;
        priceList.productPrices = productPrices || priceList.productPrices;

        const updatedPriceList = await priceList.save();
        res.json(updatedPriceList);
    } else {
        res.status(404);
        throw new Error('Price list not found');
    }
});

// @desc    Delete a price list
// @route   DELETE /api/pricelists/:id
// @access  Admin
const deletePriceList = asyncHandler(async (req, res) => {
    const priceList = await PriceList.findById(req.params.id);

    if (priceList) {
        await priceList.deleteOne(); // Mongoose v6 ve sonrası için remove() yerine deleteOne() kullanılır
        res.json({ message: 'Price list removed' });
    } else {
        res.status(404);
        throw new Error('Price list not found');
    }
});

module.exports = {
    getPriceLists,
    getPriceListById,
    createPriceList,
    updatePriceList,
    deletePriceList
};
