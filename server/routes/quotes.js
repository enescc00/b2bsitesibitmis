const express = require('express');
const asyncHandler = require('express-async-handler');
const Quote = require('../models/Quote');
const { protect, admin, salesrep } = require('../middleware/authMiddleware');
const Product = require('../models/Product');
const router = express.Router();

// @desc    Teklif oluştur (müşteri veya satış temsilcisi)
// @route   POST /api/quotes
// @access  Protected
router.post(
  '/',
  protect,
  asyncHandler(async (req, res) => {
    const { items, note, customerId } = req.body;

    if (!items || items.length === 0) {
      return res.status(400).json({ msg: 'En az bir ürün ekleyin.' });
    }

    // costPrice & salePrice hesapla (şimdilik cost = product.costPrice, sale = cost)
    const populatedItems = await Promise.all(
      items.map(async (it) => {
        const product = await Product.findById(it.productId).select('costPrice name');
        if (!product) throw new Error('Ürün bulunamadı');
        const cost = product.costPrice || 0;
        return {
          product: product._id,
          qty: it.qty,
          costPrice: cost,
          profitPercent: 0,
          salePrice: cost,
        };
      })
    );

    const quote = await Quote.create({
      requester: req.user._id,
      customer: customerId || req.user._id,
      items: populatedItems,
      note,
      createdBy: req.user._id,
    });

    res.status(201).json(quote);
  })
);

// @desc    Aktif kullanıcının teklifleri
// @route   GET /api/quotes/my
// @access  Protected
// Admin tüm teklifleri listeleyebilir, opsiyonel status filtresi
router.get(
  '/',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { status } = req.query;
    const filter = status ? { status } : {};
    const quotes = await Quote.find(filter)
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    res.json(quotes);
  })
);

router.get(
  '/my',
  protect,
  asyncHandler(async (req, res) => {
    const quotes = await Quote.find({
      $or: [{ requester: req.user._id }, { customer: req.user._id }],
    })
      .populate('customer', 'name')
      .sort({ createdAt: -1 });
    res.json(quotes);
  })
);

// @desc    Teklif detay
// @route   GET /api/quotes/:id
// @access  Protected (ilgili taraflar veya admin)
router.get(
  '/:id',
  protect,
  asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id).populate('items.product', 'name');
    if (!quote) return res.status(404).json({ msg: 'Teklif bulunamadı' });

    if (
      !(
        req.user.role === 'admin' ||
        quote.requester.equals(req.user._id) ||
        quote.customer.equals(req.user._id)
      )
    ) {
      return res.status(403).json({ msg: 'Yetkiniz yok' });
    }

    res.json(quote);
  })
);

// @desc   Teklifi hazırla (karlılık gir) - admin
// @route  PUT /api/quotes/:id/prepare
router.put(
  '/:id/prepare',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const { items } = req.body; // array with profitPercent OR salePrice
    const quote = await Quote.findById(req.params.id).populate('items.product', 'costPrice name');
    if (!quote) return res.status(404).json({ msg: 'Teklif bulunamadı' });

    // map over existing items preserving qty & product
    quote.items = quote.items.map((it) => {
      const incoming = items.find((x) => String(x.productId) === String(it.product._id));
      if (!incoming) return it; // unchanged
      const cost = it.costPrice;
      const rawProfit = incoming.profitPercent ?? it.profitPercent ?? 0;
      const profitPercent = isNaN(rawProfit) ? 0 : Number(rawProfit);
      const rawSale = incoming.salePrice;
      const salePrice = isNaN(rawSale) || rawSale === undefined || rawSale === null || rawSale <= 0
        ? cost * (1 + profitPercent / 100)
        : Number(rawSale);
      return {
        ...it.toObject(),
        profitPercent,
        salePrice,
      };
    });
    quote.status = 'prepared';
    quote.updatedBy = req.user._id;
    await quote.save();
    res.json(quote);
  })
);

// @desc   Teklifi gönder (PDF oluştur + e-posta placeholder)
// @route  PUT /api/quotes/:id/send
router.put(
  '/:id/send',
  protect,
  admin,
  asyncHandler(async (req, res) => {
    const quote = await Quote.findById(req.params.id)
      .populate('customer', 'name email')
      .populate('items.product', 'name');
    if (!quote) return res.status(404).json({ msg: 'Teklif bulunamadı' });
    if (quote.status !== 'prepared') return res.status(400).json({ msg: 'Önce teklifi hazırlayın.' });

        // PDF oluştur
    const { generateQuotePdf } = require('../utils/pdfGenerator');
    let pdfUrl;
    try {
      pdfUrl = await generateQuotePdf(quote);
    } catch (pdfErr) {
      console.error('PDF Create Error:', pdfErr);
      return res.status(500).json({ msg: `PDF oluşturulamadı: ${pdfErr.message}` });
    }

    const publicUrl = `${req.protocol}://${req.get('host')}${pdfUrl}`;
    quote.pdfUrl = publicUrl;
    quote.status = 'sent';
    quote.updatedBy = req.user._id;
    await quote.save();

    // TODO: nodemailer ile müşteri ve salesrep e-posta gönder.

    res.json({ msg: 'Teklif gönderildi', quote });
  })
);

module.exports = router;
