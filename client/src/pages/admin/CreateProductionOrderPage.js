import React from "react";
import { useNavigate } from "react-router-dom";
import { toast } from "react-toastify";
import { ProductTreeDropdown } from "../../components/ProductTreeDropdown";
import DropdownWithSearch from "../../components/DropdownWithSearch";
import { useProductionOrderData } from "./../../hooks/useProductionOrderData";
import { useProductionOrderFormData } from "./../../hooks/useProductionOrderFormData";
import { ProductionOrderStockTable } from "./../../components/ProductionOrderStockTable";
import { isProductionOrderStockSufficient } from "./../../utils/helpers";

const STATUS_OPTIONS = [
  { _id: 0, name: "Planlandı" },
  { _id: 1, name: "İmalatta" },
  { _id: 2, name: "Tamamlandı" },
  { _id: 3, name: "İptal Edildi" },
];

export default function CreateProductionOrderPage() {
  const navigate = useNavigate();

  const { formData, update, setFormData } = useProductionOrderFormData({
    productToProduce: "",
    quantityToProduce: 1,
    componentsUsed: [],
    status: "Planlandı",
    createdBy: "",
    completedBy: "",
    notes: "",
    isDraft: false,
  });

  const {
    user,
    productTrees,
    inventoryItems,
    selectedProductTree,
    setSelectedProductTree,
    fetchInventoryForTree,
  } = useProductionOrderData(setFormData);

  const submitOrder = async (e) => {
    e.preventDefault();

    if (!formData.productToProduce) return toast.error("Ürün seçiniz.");
    if (!formData.createdBy) return toast.error("Oluşturan kullanıcı yok.");
    if (!selectedProductTree) return toast.error("Geçerli ürün yok.");
    if (
      !isProductionOrderStockSufficient(
        formData.componentsUsed,
        inventoryItems,
        formData.quantityToProduce
      ) &&
      !formData.isDraft
    )
      return toast.error("Stoklar yetersiz.");

    try {
      const res = await fetch("/api/production-orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || "Hata oluştu");
      toast.success("Üretim emri oluşturuldu");
      setFormData((prev) => ({
        ...prev,
        productToProduce: "",
        quantityToProduce: 1,
        componentsUsed: [],
        notes: "",
      }));
      setSelectedProductTree(null);
    } catch (err) {
      toast.error(`Hata: ${err.message}`);
    }
  };

  return (
    <div className="admin-page-container">
      <button
        onClick={() => navigate("/admin/manufacturing-module")}
        className="back-btn"
      >
        &larr; İmalat Modülü Sayfasına Dön
      </button>
      <h1>Yeni İmalat Emri</h1>
      <form onSubmit={submitOrder}>
        <ProductTreeDropdown
          label="Ürün Ağacı"
          items={productTrees}
          selected={selectedProductTree}
          onSelect={(item) => {
            update("productToProduce", item?.product?._id);
            fetchInventoryForTree(item);
            setSelectedProductTree(item);
          }}
        />

        {selectedProductTree?.product && (
          <div className="form-group">
            <label htmlFor="quantityToProduce">Seçilen ürün:</label>
            <div>
              {selectedProductTree.product.images.length && (
                <img
                  src={selectedProductTree.product.images[0]}
                  width={100}
                  height={100}
                />
              )}
              <h6>{selectedProductTree.product.name}</h6>
            </div>
          </div>
        )}

        <div className="form-group">
          <label htmlFor="quantityToProduce">Üretilecek Miktar</label>
          <input
            type="number"
            min={1}
            className="form-control"
            id="quantityToProduct"
            placeholder="Üretilecek Miktar"
            value={formData.quantityToProduce}
            onChange={(e) => update("quantityToProduce", e.target.value)}
          />
        </div>

        <ProductionOrderStockTable
          tree={selectedProductTree}
          inventoryItems={inventoryItems}
          quantity={formData.quantityToProduce}
        />

        <DropdownWithSearch
          title={formData.status}
          items={STATUS_OPTIONS}
          onClickList={(item) => update("status", item.name)}
          renderListItem={(item) => <span>{item.name}</span>}
        />

        <div className="form-group">
          <label htmlFor="status">Oluşturan Kullanıcı</label>
          <input placeholder={user?.name} type="text" disabled />
        </div>
        <div className="form-group">
          <label htmlFor="status">Tamamlayan Kullanıcı</label>
          <input placeholder={user?.name} type="text" disabled />
        </div>

        <div className="form-group">
          <label htmlFor="note">Not</label>
          <input
            type="text"
            className="form-control"
            id="notes"
            placeholder="Not gir"
            value={formData.notes}
            onChange={(e) => update("notes", e.target.value)}
          />
        </div>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="isDraft"
            name="isDraft"
            checked={formData.isDraft}
            onChange={() => update("isDraft", !formData.isDraft)}
          />
          <label className="form-check-label fw-bold pl-5" htmlFor="isDraft">
            Taslak Mı?
          </label>
        </div>

        <button type="submit" className="btn btn-primary">
          İmalat Emri Oluştur
        </button>
      </form>
    </div>
  );
}
