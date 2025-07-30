const mongoose = require("mongoose");
const Schema = mongoose.Schema;

// === YENİ: Yorumlar için alt şema ===
const ReviewSchema = new Schema(
  {
    user: { type: Schema.Types.ObjectId, required: true, ref: "User" },
    name: { type: String, required: true }, // Yorumu yapanın adını da saklayalım
    rating: { type: Number, required: true }, // 1-5 arası puan
    comment: { type: String, required: true },
  },
  {
    timestamps: true,
  }
);

const ComponentSchema = new Schema(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "InventoryItem",
    },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const SpecificationSchema = new Schema(
  {
    key: { type: String, required: true },
    value: { type: String, required: true },
  },
  { _id: false }
);

const BoxContentSchema = new Schema(
  {
    item: { type: String, required: true },
    quantity: { type: Number, required: true, default: 1 },
  },
  { _id: false }
);

const ProductSchema = new Schema(
  {
    name: { type: String, required: true, trim: true, unique: true },
    images: [{ type: String }],
    description: { type: String, required: true },
    category: { type: Schema.Types.ObjectId, required: true, ref: "Category" },
    components: [ComponentSchema],
    sku: { type: String, default: "" },
    warrantyPeriod: { type: String, default: "2 Yıl" },
    specifications: [SpecificationSchema],
    boxContents: [BoxContentSchema],

    // === YENİ ALANLAR: Puanlama ve Yorumlar için ===
    reviews: [ReviewSchema],
    rating: { type: Number, required: true, default: 0 },
    numReviews: { type: Number, required: true, default: 0 },

    costPrice: { type: Number, required: true, default: 0 },
    profitMargin: { type: Number, required: true, default: 20 },
    salePrice: { type: Number, default: 0 },
    profitabilityAlert: { type: Boolean, default: false },
    isActive: { type: Boolean, default: true },
    stock: { type: Number, required: true, default: 0 },
    supplier: { type: Schema.Types.ObjectId, ref: "User" },
    minPackQuantity: { type: Number, default: 1 },
    isManufactured: { type: Boolean, required: true, default: false },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("Product", ProductSchema);
