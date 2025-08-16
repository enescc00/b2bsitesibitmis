export const isProductionOrderStockSufficient = (
  componentsUsed,
  inventoryItems,
  quantity
) =>
  componentsUsed.every((c) => {
    const item = inventoryItems.find((inv) => inv._id === c.inventoryItem);
    return c.quantity * quantity <= item?.quantity;
  });
