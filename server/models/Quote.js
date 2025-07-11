const mongoose = require('mongoose');

const quoteItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true,
  },
  qty: {
    type: Number,
    required: true,
    min: 1,
  },
  costPrice: {
    type: Number,
    required: true,
  },
  profitPercent: {
    type: Number,
    default: 0,
  },
  salePrice: {
    type: Number,
    required: true,
  },
});

const quoteSchema = new mongoose.Schema(
  {
    quoteNumber: {
      type: Number,
      unique: true,
      index: true
    },
    requester: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    customer: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    items: [quoteItemSchema],
    note: String,
    status: {
      type: String,
      enum: ['requested', 'prepared', 'sent'],
      default: 'requested',
    },
    pdfUrl: String,
    createdBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
    updatedBy: {
      type: mongoose.Schema.Types.ObjectId,
      ref: 'User',
    },
  },
  { timestamps: true }
);

quoteSchema.pre('save', async function(next) {
  if (this.isNew && !this.quoteNumber) {
    try {
      const lastQuote = await this.constructor.findOne({ quoteNumber: { $ne: null } }).sort({ quoteNumber: -1 });
      this.quoteNumber = lastQuote ? lastQuote.quoteNumber + 1 : 1;
      next();
    } catch (err) {
      next(err);
    }
  } else {
    next();
  }
});

module.exports = mongoose.model('Quote', quoteSchema);
