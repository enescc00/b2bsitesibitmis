const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ComponentSchema = new mongoose.Schema(
  {
    inventoryItem: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "InventoryItem", // Burası InventoryItem modeline referans veriyor
    },
    quantity: {
      type: Number,
      required: true,
      default: 1,
    },
  },
  { _id: false }
); // Her bir component için ayrı _id oluşturma

const ProductTreeSchema = new Schema(
  {
    name: {
      type: String,
      required: [true, "Ürün ağacı adı zorunludur."],
      trim: true,
      unique: true,
    },
    product: {
      type: Schema.Types.ObjectId,
      //required: true,
      ref: "Product",
    },
    components: [ComponentSchema],
    totalCost: {
      // Bu ağacın standart (nakit) maliyeti
      type: Number,
      default: 0,
    },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProductTree", ProductTreeSchema);
