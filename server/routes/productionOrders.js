const express = require("express");
const router = express.Router();
const ProductionOrder = require("../models/ProductionOrder");
const crypto = require("crypto");
const InventoryItem = require("../models/InventoryItem");
//const User = require("../models/User");
const Product = require("../models/Product");

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

// CHECK LATER
// const validateUser = async (user) => {
//   const userExists = await User.exists({ _id: user });
//   if (!userExists) {
//     throw new Error(`User with ID ${user} does not exist.`);
//   }
// };

const validateProduct = async (product) => {
  const productExist = await Product.exists({ _id: product });
  if (!productExist) {
    throw new Error(`ID'si ${product} olan ürün bulunamadı.`);
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
    } = req.body;

    await validateComponentsUsed(componentsUsed, quantityToProduce);
    //await validateUser(createdBy);
    await validateProduct(productToProduce);
    const orderNumber = crypto.randomInt(1000, 1000000);

    const newOrder = new ProductionOrder({
      orderNumber,
      productToProduce,
      quantityToProduce,
      componentsUsed,
      createdBy,
      notes,
    });

    await newOrder.save();
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
      return res.status(404).json({ error: "Order not found" });
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
    } = req.body;

    await validateComponentsUsed(componentsUsed, quantityToProduce);
    // await validateUser(createdBy);
    // if (completedBy !== null) {
    //   await validateUser(completedBy);
    // }
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
      },
      { new: true, runValidators: true }
    );

    if (!updatedOrder) {
      return res.status(404).json({ error: "Sipariş bulunamadı." });
    }

    res.status(200).json(updatedOrder);
  } catch (err) {
    console.error(err);
    res.status(400).json({ error: err.message });
  }
});

router.delete("/:id", async (req, res) => {
  try {
    const deletedOrder = await ProductionOrder.findByIdAndDelete(req.params.id);

    if (!deletedOrder) {
      return res.status(404).json({
        error:
          "İlgili sipariş bulunamadı. Lütfen sipariş ID'sini kontrol edin ve tekrar deneyin.",
      });
    }

    res.status(200).json({ message: "Sipariş başarıyla silindi." });
  } catch (err) {
    res.status(500).json({ error: "Bir hata oluştu." });
  }
});

module.exports = router;
