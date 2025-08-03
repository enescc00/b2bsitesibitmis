import { Link } from "react-router-dom";
import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import "./MyOrdersPage.css";

// Helper function to get status details
const getStatusDetails = (status) => {
  const statusMap = {
    "Onay Bekliyor": {
      className: "status-onay-bekliyor",
      icon: "fas fa-hourglass-half",
    },
    Hazırlanıyor: { className: "status-hazırlanıyor", icon: "fas fa-box-open" },
    "Kargoya Verildi": {
      className: "status-kargoya-verildi",
      icon: "fas fa-truck",
    },
    "Teslim Edildi": {
      className: "status-teslim-edildi",
      icon: "fas fa-check-circle",
    },
    "İptal Edildi": {
      className: "status-iptal-edildi",
      icon: "fas fa-times-circle",
    },
    default: { className: "status-default", icon: "fas fa-question-circle" },
  };
  return statusMap[status] || statusMap["default"];
};

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const { authToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch("/api/orders/myorders", {
          headers: {
            Authorization: `Bearer ${authToken}`,
          },
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || "Siparişler getirilemedi.");
        }
        // Orders should be sorted by date descending
        setOrders(
          data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        );
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchOrders();
    }
  }, [authToken]);

  const filterOrders = () => {
    switch (activeFilter) {
      case "Devam Edenler":
        // Updated to include 'Onay Bekliyor'
        return orders.filter((order) =>
          ["Onay Bekliyor", "Hazırlanıyor", "Kargoya Verildi"].includes(
            order.status
          )
        );
      case "Teslim Edilenler":
        return orders.filter((order) => order.status === "Teslim Edildi");
      case "İptaller":
        return orders.filter((order) => order.status === "İptal Edildi");
      case "Tümü":
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders();

  const handleCancelBackorder = async (orderId, productId) => {
    try {
      const res = await fetch(
        `/api/orders/${orderId}/backordered/${productId}/cancel`,
        {
          method: "PUT",
          headers: { Authorization: `Bearer ${authToken}` },
        }
      );
      const updated = await res.json();
      if (!res.ok) throw new Error(updated.msg || "Ürün iptal edilemedi");
      // setOrders by replacing one order
      setOrders((prev) =>
        prev.map((o) => (o._id === updated._id ? updated : o))
      );
    } catch (err) {
      alert(err.message);
    }
  };

  const filterButtons = [
    "Tümü",
    "Devam Edenler",
    "Teslim Edilenler",
    "İptaller",
  ];
  const filterButtonClasses = {
    Tümü: "tumu",
    "Devam Edenler": "devam-edenler",
    "Teslim Edilenler": "teslim-edilenler",
    İptaller: "iptaller",
  };

  if (loading)
    return <div className="loading-container">Siparişler Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="my-orders-page">
      <h1>Siparişlerim</h1>

      <div className="order-filters d-flex justify-content-between align-items-center">
        {filterButtons.map((filter) => (
          <button
            key={filter}
            className={`filter-btn filter-btn-${filterButtonClasses[filter]} ${
              activeFilter === filter ? "active" : ""
            }`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
        <Link
          to="/admin/create-production-order"
          className="text-center bg-primary text-white py-2 px-3 rounded"
        >
          İmalat Emri Oluştur
        </Link>
      </div>

      <div className="order-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map((order) => {
            const statusDetails = getStatusDetails(order.status);
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span>
                      SİPARİŞ TARİHİ:{" "}
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span>
                      SİPARİŞ NO: #{String(order.orderNumber).padStart(4, "0")}
                    </span>
                  </div>
                  <div className={`order-status ${statusDetails.className}`}>
                    <i className={statusDetails.icon}></i>
                    <span>{order.status}</span>
                  </div>
                </div>
                <div className="order-body">
                  {order.orderItems.map((item) => (
                    <div key={item.product || item._id} className="order-item">
                      {item.qty} x {item.name}
                    </div>
                  ))}

                  {order.backorderedItems &&
                    order.backorderedItems.length > 0 && (
                      <>
                        <hr />
                        <div className="backorder-header">
                          Eksikteki Ürünler
                        </div>
                        {order.backorderedItems.map((item) => (
                          <div
                            key={item.product}
                            className="order-item backordered-item"
                          >
                            <span className="badge-backordered">Eksikte</span>
                            {item.qty} x {item.name}
                            <button
                              className="cancel-backorder-btn"
                              onClick={() =>
                                handleCancelBackorder(order._id, item.product)
                              }
                            >
                              İptal Et
                            </button>
                          </div>
                        ))}
                      </>
                    )}
                </div>
                <div className="order-footer">
                  <span>
                    Toplam Tutar:{" "}
                    <strong>{order.totalPrice.toFixed(2)} ₺</strong>
                  </span>
                </div>
              </div>
            );
          })
        ) : (
          <div className="no-orders-message">
            <p>Bu filtreye uygun sipariş bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;
