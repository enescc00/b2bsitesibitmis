const asyncHandler = require('express-async-handler');
const { User } = require('../../models/User');
const ErrorHandler = require('../../utils/errorHandler');

/**
 * @desc    Get all customers assigned to the logged-in sales representative
 * @route   GET /api/salesrep/customers
 * @access  Private/Salesrep
 */
const getAssignedCustomers = asyncHandler(async (req, res, next) => {
    const salesRepId = req.user.id;

    // Find all users where the 'salesRepresentative' field matches the logged-in sales rep's ID
    const keyword = req.query.keyword ? {
        $or: [
            { name: { $regex: req.query.keyword, $options: 'i' } },
            { companyTitle: { $regex: req.query.keyword, $options: 'i' } },
            { email: { $regex: req.query.keyword, $options: 'i' } }
        ]
    } : {};

    const customers = await User.find({ salesRepresentative: salesRepId, ...keyword }).select('-password');

    if (!customers) {
        return next(new ErrorHandler('Bu temsilciye atanmış müşteri bulunamadı.', 404));
    }

    res.json(customers);
});

module.exports = {
    getAssignedCustomers
};
