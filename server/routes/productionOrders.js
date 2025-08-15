const express = require("express");
const router = express.Router();
const ProductionOrder = require("../models/ProductionOrder");
const crypto = require("crypto");
const InventoryItem = require("../models/InventoryItem");
const Product = require("../models/Product");

const updateProductStock = async (productId, quantityToProduce) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error("Ürün bulunamadı.");
  }
  product.stock = (product.stock || 0) + +quantityToProduce;
  await product.save();
};

const updateInventoryItems = async (componentsUsed, quantityToProduce) => {
  for (const component of componentsUsed) {
    const inventoryItem = await InventoryItem.findById(component.inventoryItem);
    if (!inventoryItem) {
      throw new Error("Envanter bulunamadı.");
    }
    inventoryItem.quantity =
      (inventoryItem.quantity || 0) - +quantityToProduce * component.quantity;
    await inventoryItem.save();
  }
};

const validateComponentsUsed = async (componentsUsed, quantityToProduce) => {
  const inventoryItems = componentsUsed.map(async (component) => {
    const item = await InventoryItem.findById(component.inventoryItem);

    const itemExists = await InventoryItem.exists({
      _id: component.inventoryItem,
    });

    if (component.quantity * quantityToProduce > item.quantity) {
      throw new Error(
        `Yeterli stok bulunmamaktadır. ${
          component.inventoryItem
        } ürününden üretim yapmak için ${
          component.quantity * quantityToProduce
        } adet stok gerekmektedir.`
      );
    }
    if (!itemExists) {
      throw new Error(
        `ID'si ${component.inventoryItem} olan envanter ürünü bulunamadı. Lütfen ürün kimliğini kontrol edin.`
      );
    }
  });

  await Promise.all(inventoryItems);
};

const validateProduct = async (productId) => {
  const product = await Product.findById(productId);
  if (!product) {
    throw new Error(`ID'si ${productId} olan ürün bulunamadı.`);
  }
  if (!product?.isManufactured) {
    throw new Error(`ID'si ${productId} olan ürün henüz üretilmemiştir.`);
  }
};

router.post("/", async (req, res) => {
  try {
    const {
      productToProduce,
      quantityToProduce,
      componentsUsed,
      createdBy,
      notes,
      isDraft,
    } = req.body;

    await validateComponentsUsed(componentsUsed, quantityToProduce);
    await validateProduct(productToProduce);
    const orderNumber = crypto.randomInt(1000, 1000000);

    const newOrder = new ProductionOrder({
      orderNumber,
      productToProduce,
      quantityToProduce,
      componentsUsed,
      createdBy,
      notes,
      isDraft,
    });

    await newOrder.save();

    await updateProductStock(productToProduce, quantityToProduce);
    await updateInventoryItems(componentsUsed, quantityToProduce);
    res.status(201).json(newOrder);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.get("/", async (req, res) => {
  try {
    const orders = await ProductionOrder.find()
      .populate("productToProduce")
      .populate("componentsUsed.inventoryItem")
      .populate("createdBy")
      .populate("completedBy");

    res.status(200).json(orders);
  } catch (err) {
    res
      .status(500)
      .json({ error: "Veritabanından üretim emirleri alınamadı." });
  }
});

router.get("/:id", async (req, res) => {
  try {
    const order = await ProductionOrder.findById(req.params.id)
      .populate("productToProduce")
      .populate("componentsUsed.inventoryItem")
      .populate("createdBy")
      .populate("completedBy");

    if (!order) {
      return res.status(404).json({ error: "Ürün bulunamadı." });
    }

    res.status(200).json(order);
  } catch (err) {
    res.status(500).json({ error: "Geçersiz ID" });
  }
});

router.put("/:id", async (req, res) => {
  try {
    const {
      productToProduce,
      quantityToProduce,
      componentsUsed,
      createdBy,
      completedBy,
      notes,
      isDraft,
    } = req.body;

    await validateComponentsUsed(componentsUsed, quantityToProduce);
    await validateProduct(productToProduce);

    const updatedOrder = await ProductionOrder.findByIdAndUpdate(
      req.params.id,
      {
        productToProduce,
        quantityToProduce,
        componentsUsed,
        createdBy,
        completedBy,
        notes,
        isDraft,
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Ürün bulunamadı." });
    }

    await updateProductStock(productToProduce, quantityToProduce);
    await updateInventoryItems(componentsUsed, quantityToProduce);

    res.status(200).json(updatedOrder);
  } catch (err) {
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await ProductionOrder.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        error:
          "İlgili ürün bulunamadı. Lütfen ürün ID'sini kontrol edin ve tekrar deneyin.",
      });
    }

    res.status(200).json({ message: "Ürün başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: "Bir hata oluştu." });
  }
});

module.exports = router;
