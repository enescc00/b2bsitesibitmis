const express = require('express');
const router = express.Router();
const mongoose = require('mongoose');
const { protect, admin } = require('../middleware/authMiddleware');
const CashboxTransaction = require('../models/CashboxTransaction');
const { User } = require('../models/User');


// GET /api/payments/customers
// Return customers with payment metrics and optional filters
router.get('/customers', protect, admin, async (req, res) => {

    try {
        const {
            noPaymentDays,               // integer – getirilecek minimum gün
            avgDueDaysGreater,           // integer – avg due days threshold
            paymentMethod,               // string – filter by payment method
            dueDaysGreater,              // integer – çek/senet için vade gün eşiği
            minTotalPaid,
            maxTotalPaid,
            minAvgDueDays,
            maxAvgDueDays,
            methods, // comma separated list of payment methods
            lastPaymentBefore // ISO date
        } = req.query;

        const matchStage = { type: 'income' };
        if (paymentMethod) matchStage.paymentMethod = paymentMethod;
        if (methods) {
            const arr = methods.split(',');
            matchStage.paymentMethod = { $in: arr };
        }

        // Build aggregation
        const aggregate = [
            { $match: matchStage },
            {
                $group: {
                    _id: '$customer',
                    lastPaymentDate: { $max: '$date' },
                    totalPaid: { $sum: '$amount' },
                    avgDueDays: {
                        $avg: {
                            $cond: [
                                { $and: [ { $ifNull: ['$dueDate', false] }, { $ne: ['$dueDate', null] } ] },
                                {
                                    $divide: [
                                        { $subtract: [ '$dueDate', '$date' ] },
                                        1000 * 60 * 60 * 24
                                    ]
                                },
                                null
                            ]
                        }
                    }
                }
            },
            {
                $lookup: {
                    from: 'users',
                    localField: '_id',
                    foreignField: '_id',
                    as: 'customer'
                }
            },
            { $unwind: '$customer' }
        ];

        let customers = await CashboxTransaction.aggregate(aggregate);

        // Post aggregation filters
        if (noPaymentDays) {
            const cutoff = new Date();
            cutoff.setDate(cutoff.getDate() - parseInt(noPaymentDays));
            customers = customers.filter(c => !c.lastPaymentDate || c.lastPaymentDate < cutoff);
        }
        if (avgDueDaysGreater) {
            customers = customers.filter(c => (c.avgDueDays || 0) > parseInt(avgDueDaysGreater));
        }
        if (dueDaysGreater) {
            const threshold = parseInt(dueDaysGreater);
            customers = customers.filter(c => {
                if (c.avgDueDays == null) return false;
                return c.avgDueDays > threshold;
            });
        }
        if (minTotalPaid) {
            customers = customers.filter(c => c.totalPaid >= parseFloat(minTotalPaid));
        }
        if (maxTotalPaid) {
            customers = customers.filter(c => c.totalPaid <= parseFloat(maxTotalPaid));
        }
        if (minAvgDueDays) {
            customers = customers.filter(c => (c.avgDueDays || 0) >= parseInt(minAvgDueDays));
        }
        if (maxAvgDueDays) {
            customers = customers.filter(c => (c.avgDueDays || 0) <= parseInt(maxAvgDueDays));
        }
        if (lastPaymentBefore) {
            const dateCut = new Date(lastPaymentBefore);
            customers = customers.filter(c => !c.lastPaymentDate || c.lastPaymentDate < dateCut);
        }


        res.json(customers);
    } catch (err) {
        console.error(err);
        res.status(500).json({ msg: 'Sunucu hatası' });
    }
});

module.exports = router;
