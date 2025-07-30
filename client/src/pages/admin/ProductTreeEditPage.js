import React, { useState, useEffect, useContext } from "react";
import { API_BASE_URL } from "../../config/api";
import { useParams, useNavigate } from "react-router-dom";
import { AuthContext } from "../../context/AuthContext";
import { toast } from "react-toastify";
import "./AdminForm.css";
import "./ProductTreePage.css";

function ProductTreeEditPage() {
  const { id: treeId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [isNewTree, setIsNewTree] = useState(!treeId);
  const [inventoryItems, setInventoryItems] = useState([]);
  const [treeName, setTreeName] = useState("");
  const [components, setComponents] = useState([]);
  const [loading, setLoading] = useState(true);

  const [targetTerm, setTargetTerm] = useState(0);
  const [calculatedCost, setCalculatedCost] = useState(null);

  const [searchQuery, setSearchQuery] = useState("");

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        const res = await fetch(`${API_BASE_URL}/api/inventory`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error("Stok kalemleri getirilemedi.");
        setInventoryItems(data);

        if (!isNewTree) {
          const treeRes = await fetch(
            `${API_BASE_URL}/api/product-trees/${treeId}`,
            { headers: { Authorization: `Bearer ${authToken}` } }
          );
          const treeData = await treeRes.json();
          if (!treeRes.ok) throw new Error("Ürün ağacı verisi alınamadı.");
          setTreeName(treeData.name);
          const populatedComponents = treeData.components.map((comp) => ({
            ...comp.inventoryItem,
            quantity: comp.quantity,
          }));
          setComponents(populatedComponents);
        }
      } catch (error) {
        toast.error(error.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchInitialData();
  }, [authToken, treeId, isNewTree]);

  const filteredInventoryItems = inventoryItems.filter((item) =>
    item.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleSearchChange = (e) => {
    setSearchQuery(e.target.value);
  };

  const handleAddItem = (item) => {
    const existingItem = components.find((comp) => comp._id === item._id);
    if (existingItem) {
      const updatedComponents = components.map((comp) =>
        comp._id === item._id
          ? { ...comp, quantity: (comp.quantity || 1) + 1 }
          : comp
      );
      setComponents(updatedComponents);
    } else {
      setComponents([...components, { ...item, quantity: 1 }]);
    }
    setSearchQuery("");
  };

  const handleQuantityChange = (id, quantity) => {
    const updatedComponents = components.map((item) =>
      item._id === id ? { ...item, quantity: parseInt(quantity) || 1 } : item
    );
    setComponents(updatedComponents);
  };

  const handleRemoveItem = (id) => {
    setComponents(components.filter((item) => item._id !== id));
  };

  const handleSaveTree = async () => {
    if (!treeName.trim())
      return toast.error("Lütfen reçete için bir isim girin.");

    const componentData = components.map((c) => ({
      inventoryItem: c._id,
      quantity: c.quantity,
    }));
    const url = isNewTree
      ? "/api/product-trees"
      : `/api/product-trees/${treeId}`;
    const method = isNewTree ? "POST" : "PUT";

    try {
      const res = await fetch(`${API_BASE_URL}${url}`, {
        method: method,
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({ name: treeName, components: componentData }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Reçete kaydedilemedi.");

      toast.success(
        `Reçete başarıyla ${isNewTree ? "kaydedildi" : "güncellendi"}.`
      );
      if (isNewTree) {
        navigate(`/admin/product-tree/${data._id}`, { replace: true });
      }
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleCalculateCost = async () => {
    if (components.length === 0)
      return toast.error("Önce ürün ağacına parça ekleyin.");
    const componentData = components.map((item) => ({
      inventoryItem: item._id,
      quantity: item.quantity,
    }));
    try {
      const res = await fetch(`${API_BASE_URL}/api/costing/calculate`, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify({
          components: componentData,
          targetTerm,
          targetCurrency: "TL",
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || "Maliyet hesaplanamadı.");
      setCalculatedCost(data);
      toast.success("Maliyet başarıyla hesaplandı!");
    } catch (error) {
      toast.error(error.message);
    }
  };

  const handleListProductForSale = () => {
    if (!treeName.trim() || isNewTree) {
      return toast.error("Lütfen önce bu reçeteyi kaydedin.");
    }
    if (!calculatedCost) {
      return toast.error("Satışa çıkarmadan önce maliyeti hesaplamalısınız.");
    }

    const productToCreate = {
      name: treeName,
      costPrice: parseFloat(calculatedCost.totalCostTL),
      components: components.map((c) => ({
        inventoryItem: c._id,
        quantity: c.quantity,
      })),
    };

    navigate("/admin/product/new", {
      state: { newProductFromTree: productToCreate },
    });
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;

  return (
    <div className="admin-page-container">
      <button
        onClick={() => navigate("/admin/product-trees")}
        className="back-btn"
      >
        &larr; Ürün Ağacı Listesine Dön
      </button>
      <h1>{isNewTree ? "Yeni Ürün Ağacı Oluştur" : "Ürün Ağacını Düzenle"}</h1>

      <div className="admin-form-container">
        <div className="form-group">
          <label>Ürün Ağacı Adı (Reçete Adı)</label>
          <input
            type="text"
            value={treeName}
            onChange={(e) => setTreeName(e.target.value)}
          />
        </div>
      </div>

      <div className="product-tree-grid">
        <div className="tree-builder-container">
          <h3>Parça Ekle</h3>
          <div class="btn-group w-100 mb-3">
            <button
              type="button"
              className="btn bg-white dropdown-toggle d-flex justify-content-between align-items-center w-100 border p-2"
              data-bs-toggle="dropdown"
              aria-expanded="false"
            >
              <span className="text-start text">Stoktan Parça Seç...</span>
              <span className="dropdown-toggle-icon">
                <i className="bi bi-caret-down-fill"></i>
              </span>
            </button>
            <ul className="dropdown-menu w-100 p-2">
              <li>
                <input
                  className="w-100"
                  placeholder="Arama Yap..."
                  type="text"
                  value={searchQuery}
                  onChange={handleSearchChange}
                  autoFocus={true}
                />
              </li>
              {filteredInventoryItems.map((item) => (
                <li
                  role="button"
                  onClick={() => handleAddItem(item)}
                  className="dropdown-item"
                >
                  {item.name} ({item.itemCode})
                </li>
              ))}
            </ul>
          </div>
          <div className="admin-table-container">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Parça Adı</th>
                  <th>Alım Türü</th>
                  <th>Adet</th>
                  <th>İşlem</th>
                </tr>
              </thead>
              <tbody>
                {components.map((item, index) => (
                  <tr key={index}>
                    <td>{item.name}</td>
                    <td>
                      {item.purchaseType === "vadeli"
                        ? `${item.termMonths || 0} Ay Vadeli`
                        : "Nakit"}
                    </td>
                    <td>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) =>
                          handleQuantityChange(item._id, e.target.value)
                        }
                        className="inline-input"
                      />
                    </td>
                    <td>
                      <button
                        onClick={() => handleRemoveItem(item._id)}
                        className="delete-btn"
                      >
                        Kaldır
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div className="cost-calculator-container">
          <h3>Maliyet ve Satış</h3>
          <button
            onClick={handleSaveTree}
            className="submit-btn full-width"
            style={{
              marginBottom: "1rem",
              backgroundColor: "#ffc107",
              color: "#212529",
            }}
          >
            {isNewTree ? "Reçeteyi Kaydet" : "Değişiklikleri Kaydet"}
          </button>
          <hr className="divider" />
          <div className="form-group">
            <label>İstenen Vade (Ay)</label>
            <input
              type="number"
              value={targetTerm}
              onChange={(e) => setTargetTerm(parseInt(e.target.value) || 0)}
            />
          </div>
          <button
            onClick={handleCalculateCost}
            className="submit-btn full-width"
          >
            Maliyeti Hesapla
          </button>
          {calculatedCost && (
            <div className="cost-result">
              <h4>Hesaplanan Toplam Maliyet</h4>
              <p className="cost-tl">{calculatedCost.totalCostTL} TL</p>
            </div>
          )}
          <hr className="divider" />
          <button
            onClick={handleListProductForSale}
            className="approve-btn full-width"
            disabled={isNewTree}
          >
            Bu Reçeteyi Satışa Çıkar
          </button>
        </div>
      </div>
    </div>
  );
}

export default ProductTreeEditPage;
