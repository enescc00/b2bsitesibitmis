import { useState, useEffect } from "react";
import { toast } from "react-toastify";

export const useProductionOrderData = (setFormData) => {
  const [user, setUser] = useState(null);
  const [productTrees, setProductTrees] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [selectedProductTree, setSelectedProductTree] = useState(null);

  useEffect(() => {
    (async () => {
      try {
        const [treeRes, userRes] = await Promise.all([
          fetch("/api/product-trees"),
          fetch("/api/users/profile"),
        ]);
        if (!treeRes.ok || !userRes.ok) throw new Error("API hata verdi");

        const [treeData, userData] = await Promise.all([
          treeRes.json(),
          userRes.json(),
        ]);

        setUser(userData);
        setProductTrees(treeData);
        setFormData((prev) => ({
          ...prev,
          createdBy: userData._id,
          completedBy: userData._id,
        }));
      } catch (err) {
        toast.error(`Veri çekme hatası: ${err.message}`);
      }
    })();
  }, []);

  const fetchInventoryForTree = async (tree) => {
    if (!tree?.product || !tree?.product?.isManufactured) return;
    try {
      const invRes = await fetch("/api/inventory");
      if (!invRes.ok) throw new Error("Envanter alınamadı");
      const invData = await invRes.json();

      const filteredInventory = invData.filter((item) =>
        tree.components.map((c) => c.inventoryItem._id).includes(item._id)
      );

      setInventoryItems(filteredInventory);
      setFormData((prev) => ({
        ...prev,
        componentsUsed: tree.components.map((c) => ({
          inventoryItem: c.inventoryItem._id,
          quantity: c.quantity,
        })),
      }));
    } catch (err) {
      toast.error(`Envanter hatası: ${err.message}`);
    }
  };

  return {
    user,
    productTrees,
    inventoryItems,
    selectedProductTree,
    setSelectedProductTree,
    fetchInventoryForTree,
  };
};
