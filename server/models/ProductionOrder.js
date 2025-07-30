const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ComponentUsedSchema = new Schema(
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

const ProductionOrderSchema = new Schema(
  {
    orderNumber: { type: Number, unique: true, required: true },

    productToProduce: {
      type: Schema.Types.ObjectId,
      required: true,
      ref: "Product",
    },
    quantityToProduce: { type: Number, required: true },

    componentsUsed: [ComponentUsedSchema],

    status: {
      type: String,
      enum: ["Planlandı", "İmalatta", "Tamamlandı", "İptal Edildi"],
      default: "Planlandı",
    },

    createdBy: { type: Schema.Types.ObjectId, ref: "User" },
    completedBy: { type: Schema.Types.ObjectId, ref: "User", default: null },

    notes: { type: String, default: "" },
  },
  {
    timestamps: true,
  }
);

module.exports = mongoose.model("ProductionOrder", ProductionOrderSchema);
