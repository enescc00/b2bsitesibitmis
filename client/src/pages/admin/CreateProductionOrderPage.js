import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import { IoCheckmarkDoneCircleSharp } from "react-icons/io5";
import { IoIosCloseCircle } from "react-icons/io";
import DropdownWithSearch from "./../../components/DropdownWithSearch";
import { toast } from "react-toastify";

export default function CreateProductionOrderPage() {
  const navigate = useNavigate();
  const [products, setProducts] = useState([]);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [user, setUser] = useState(null);
  const [productTree, setProductTree] = useState(null);
  const [formData, setFormData] = useState({
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
    productToProduce,
    quantityToProduce,
    componentsUsed,
    status,
    createdBy,
    completedBy,
    notes,
    isDraft,
  } = formData;
  const allStatus = [
    { _id: 0, name: "Planlandı" },
    { _id: 1, name: "İmalatta" },
    { _id: 2, name: "Tamamlandı" },
    { _id: 3, name: "İptal Edildi" },
  ];

  useEffect(() => {
    const fetchProductsData = async () => {
      try {
        const [productResponse, userResponse] = await Promise.all([
          fetch("/api/products/all"),
          fetch("/api/users/profile"),
        ]);

        if (!productResponse.ok || !userResponse.ok) {
          throw new Error(
            "Bir veya daha fazla API'den veri alınırken bir hata oluştu."
          );
        }

        const productData = await productResponse.json();
        const userData = await userResponse.json();

        setProducts(
          productData.products.filter((product) => product.isManufactured)
        );
        setUser(userData);
        setFormData((prev) => ({
          ...prev,
          createdBy: userData._id,
          completedBy: userData._id,
        }));
      } catch (err) {
        toast.error(`Veri çekilirken bir hata oluştu: ${err.message}`);
      } finally {
      }
    };

    fetchProductsData();
  }, []);

  const updateFormData = (key, value) =>
    setFormData((prev) => ({ ...prev, [key]: value }));

  const renderDropdown = (label, value, items, onSelect) => (
    <div className="form-group">
      <label>{label}</label>
      <DropdownWithSearch
        title={
          value ? items.find((item) => item._id === value)?.name : `${label}`
        }
        items={items}
        onClickList={(item) => onSelect(item._id)}
        renderListItem={(item) => <span>{item.name}</span>}
      />
    </div>
  );

  const getProductTreeAndInventoryItems = async (selectedProductId) => {
    try {
      const [inventoryResponse, productTreeResponse] = await Promise.all([
        fetch("/api/inventory"),
        fetch("/api/product-trees"),
      ]);

      if (!inventoryResponse.ok || !productTreeResponse.ok) {
        throw new Error(
          "Bir veya daha fazla API'den veri alınırken bir hata oluştu."
        );
      }

      const inventoryData = await inventoryResponse.json();
      const productTreeData = await productTreeResponse.json();
      const findRelatedProductTree = productTreeData.find(
        (item) => item.product?._id === selectedProductId
      );
      if (findRelatedProductTree) {
        const getNecessaryInventoryData = inventoryData.filter((item) =>
          findRelatedProductTree.components
            .map((item) => item.inventoryItem._id)
            .includes(item?._id)
        );
        setProductTree(findRelatedProductTree);
        setInventoryItems(getNecessaryInventoryData);
        setFormData((prev) => ({
          ...prev,
          componentsUsed: findRelatedProductTree.components.map((item) => ({
            inventoryItem: item.inventoryItem._id,
            quantity: item.quantity,
          })),
        }));
      } else {
        setProductTree(null);
        setInventoryItems([]);
        setFormData((prev) => ({
          ...prev,
          componentsUsed: [],
        }));
      }
    } catch (err) {
      toast.error(`Veri çekilirken bir hata oluştu: ${err.message}`);
    } finally {
    }
  };

  const checkAndPostData = async (e) => {
    e.preventDefault();

    const isStocksEnough = componentsUsed.every((item) => {
      const inventoryItem = inventoryItems.find(
        (inventoryItem) => inventoryItem._id === item.inventoryItem
      );

      return item.quantity * quantityToProduce <= inventoryItem.quantity;
    });
    if (!productToProduce) {
      toast.error("Başarısız: Lütfen bir ürün seçiniz.");
      return;
    }

    if (!createdBy) {
      toast.error("Başarısız: Lütfen ürünü oluşturan kullanıcıyı seçiniz.");
      return;
    }
    if (!productTree) {
      toast.error("Başarısız: Henüz geçerli bir ürün seçimi yapmadınız.");
      return;
    }

    if (!isStocksEnough && !isDraft) {
      toast.error("Başarısız: Stoklar yeterli değil.");
      return;
    }

    const data = {
      ...formData,
    };

    try {
      const response = await fetch("/api/production-orders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(data),
      });

      const result = await response.json();

      if (!response.ok) {
        throw new Error(result.error || "Bir hata oluştu");
      }

      toast.success("Üretim emri başarıyla oluşturuldu!");
      setFormData({
        productToProduce: "",
        quantityToProduce: 1,
        componentsUsed: [],
        status: "Planlandı",
        notes: "",
        createdBy: user._id,
        completedBy: user._id,
      });
      setProductTree(null);
    } catch (error) {
      toast.error(`Hata: ${error.message}`);
      console.error("Üretim oluşturulurken hata oluştu:", error);
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
      <h1>Yeni İmalat Emri Oluştur</h1>
      <form>
        {renderDropdown("Üretilecek Ürün", productToProduce, products, (id) => {
          updateFormData("productToProduce", id);
          getProductTreeAndInventoryItems(id);
        })}

        <div className="form-group">
          <label htmlFor="quantityToProduce">Üretilecek Miktar</label>
          <input
            type="number"
            className="form-control"
            id="quantityToProduct"
            placeholder="Üretilecek Miktar"
            value={quantityToProduce}
            onChange={(e) =>
              updateFormData("quantityToProduce", e.target.value)
            }
          />
        </div>
        <div className="form-group">
          <label htmlFor="stocks">Stok Analizi</label>
          <div className="table-responsive">
            <table className="table">
              <thead>
                <tr>
                  <th scope="col">AD</th>
                  <th scope="col">Gereken Miktar</th>
                  <th scope="col">Miktar</th>
                  <th scope="col">Mevcut Stok</th>
                  <th scope="col">Durum</th>
                </tr>
              </thead>
              <tbody>
                {productTree ? (
                  inventoryItems.map((item) => (
                    <tr key={item._id}>
                      <td>{item.name}</td>
                      <td>
                        {quantityToProduce *
                          productTree.components.find(
                            (tree) => tree.inventoryItem._id === item._id
                          ).quantity}
                      </td>
                      <td>
                        {
                          productTree.components.find(
                            (tree) => tree.inventoryItem._id === item._id
                          ).quantity
                        }
                      </td>
                      <td>{item.quantity}</td>
                      <td>
                        {quantityToProduce *
                          productTree.components.find(
                            (tree) => tree.inventoryItem._id === item._id
                          ).quantity <=
                        item.quantity ? (
                          <span>
                            <IoCheckmarkDoneCircleSharp
                              color="green"
                              size={20}
                            />{" "}
                            Yeterli
                          </span>
                        ) : (
                          <span>
                            <IoIosCloseCircle color="red" size={20} /> Yetersiz
                          </span>
                        )}
                      </td>
                    </tr>
                  ))
                ) : (
                  <tr>
                    <td colSpan={5}>
                      <p>Henüz geçerli bir ürün seçimi yapmadınız.</p>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
        <div className="form-group">
          <label htmlFor="status">Durum</label>
          <DropdownWithSearch
            title={status}
            items={allStatus}
            onClickList={(item) => {
              setFormData((prev) => ({ ...prev, status: item.name }));
            }}
            renderListItem={(item) => <span>{item.name}</span>}
          />
        </div>
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
            value={notes}
            onChange={(e) => updateFormData("notes", e.target.value)}
          />
        </div>
        <div className="form-check mb-3">
          <input
            className="form-check-input"
            type="checkbox"
            id="isDraft"
            name="isDraft"
            onChange={(e) =>
              setFormData((prev) => ({ ...prev, isDraft: !prev.isDraft }))
            }
          />
          <label className="form-check-label fw-bold pl-5" htmlFor="isDraft">
            Taslak Mı?
          </label>
        </div>

        <button
          type="submit"
          className="btn btn-primary"
          onClick={checkAndPostData}
        >
          İmalat Emri Oluştur
        </button>
      </form>
    </div>
  );
}
