import { AuthContext } from "./../../context/AuthContext";
import React, { useContext, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { toast } from "react-toastify";

const getStatusDetails = (status) => {
  const statusMap = {
    Planlandı: {
      className: "status-onay-bekliyor",
      icon: "fas fa-hourglass-half",
    },
    İmalatta: { className: "status-hazırlanıyor", icon: "fas fa-box-open" },
    "Kargoya Verildi": {
      className: "status-kargoya-verildi",
      icon: "fas fa-truck",
    },
    Tamamlandı: {
      className: "status-teslim-edildi",
      icon: "fas fa-check-circle",
    },
    "İptal Edildi": {
      className: "status-iptal-edildi",
      icon: "fas fa-times-circle",
    },
    Taslaklar: {
      className: "status-taslaklar",
      icon: "fas fa-file",
    },
    default: { className: "status-default", icon: "fas fa-question-circle" },
  };
  return statusMap[status] || statusMap["default"];
};
const checkStocksEnough = (componentsUsed, quantityToProduce) => {
  const isStocksEnough = componentsUsed.every((item) => {
    return item.quantity * quantityToProduce <= item.inventoryItem.quantity;
  });
  return isStocksEnough;
};

function ManufacturingModule() {
  const [productionOrders, setProductionOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [activeFilter, setActiveFilter] = useState("Tümü");
  const { authToken } = useContext(AuthContext);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const response = await fetch("/api/production-orders", {
        headers: {
          Authorization: `Bearer ${authToken}`,
        },
      });
      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.msg || "Ürünler getirilemedi.");
      }
      setProductionOrders(
        data.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
      );
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) {
      fetchOrders();
    }
  }, [authToken]);

  const filterOrders = () => {
    switch (activeFilter) {
      case "Planlandı":
        return productionOrders.filter(
          (production) =>
            production.status === "Planlandı" && !production.isDraft
        );
      case "İmalatta":
        return productionOrders.filter(
          (production) =>
            production.status === "İmalatta" && !production.isDraft
        );
      case "Tamamlandı":
        return productionOrders.filter(
          (production) =>
            production.status === "Tamamlandı" && !production.isDraft
        );
      case "İptal Edildi":
        return productionOrders.filter(
          (production) =>
            production.status === "İptal Edildi" && !production.isDraft
        );
      case "Taslaklar":
        return productionOrders.filter((production) => production.isDraft);
      case "Tümü":
      default:
        return productionOrders;
    }
  };

  const filteredOrders = filterOrders();

  const editProductionOrder = async (e, item) => {
    e.preventDefault();
    try {
      const data = {
        status: "Planlandı",
        isDraft: false,
        productToProduce: item.productToProduce,
        quantityToProduce: item.quantityToProduce,
        componentsUsed: item.componentsUsed,
      };
      const response = await fetch(`/api/production-orders/${item._id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(data),
      });

      const items = await response.json();
      if (!response.ok) {
        throw new Error(items.error);
      }
      fetchOrders();
      toast.success("Taslak başarılı bir şekilde güncellendi.");
    } catch (error) {
      toast.error(`${error}`);
    }
  };

  const filterButtons = [
    "Tümü",
    "Planlandı",
    "İmalatta",
    "Tamamlandı",
    "İptal Edildi",
    "Taslaklar",
  ];
  const filterButtonClasses = {
    Tümü: "tumu",
    Planlandı: "devam-edenler",
    Tamamlandı: "devam-edenler",
    İmalatta: "teslim-edilenler",
    "İptal Edildi": "iptaller",
    Taslaklar: "taslaklar",
  };

  if (loading)
    return <div className="loading-container">İmalat Modülü Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="my-orders-page">
      <h1>İmalat Modülü</h1>

      <div className="order-filters d-flex justify-content-start align-items-center">
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
          className="text-center bg-primary text-white py-2 px-3 rounded ms-md-auto ms-sm-0"
        >
          İmalat Emri Oluştur
        </Link>
      </div>

      <div className="order-list">
        {filteredOrders?.length > 0 ? (
          filteredOrders?.map((order) => {
            const statusDetails = getStatusDetails(
              order.isDraft ? "Taslaklar" : order.status
            );
            return (
              <div key={order._id} className="order-card">
                <div className="order-header">
                  <div className="order-info">
                    <span>
                      İMALAT TARİHİ:{" "}
                      {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                    </span>
                    <span>
                      İMALAT NO: #{String(order.orderNumber).padStart(4, "0")}
                    </span>
                  </div>
                  <div className={`order-status ${statusDetails.className}`}>
                    <i className={statusDetails.icon}></i>
                    <span>{order.isDraft ? "Taslaklar" : order.status}</span>
                  </div>
                </div>
                <div className="order-body">
                  <span>
                    {order?.quantityToProduce} adet{" "}
                    <b>{order.productToProduce?.name}</b> ürünü{" "}
                    <b>{order?.createdBy?.name}</b> tarafından oluşturuldu
                  </span>
                  <br />
                  {order?.notes && (
                    <span>
                      <b>Notlar:</b> {order?.notes}
                    </span>
                  )}

                  {order.componentsUsed.map((item, index) => (
                    <div key={index} className="order-item">
                      <span>
                        {item.quantity} x {item.inventoryItem?.name}
                      </span>
                    </div>
                  ))}
                </div>
                {order.isDraft && (
                  <div className="order-footer">
                    <button
                      className="order-footer-button"
                      disabled={
                        !order.productToProduce ||
                        !checkStocksEnough(
                          order.componentsUsed,
                          order.quantityToProduce
                        )
                      }
                      onClick={(e) => editProductionOrder(e, order)}
                    >
                      İmalat Emrini Oluştur
                    </button>
                  </div>
                )}
              </div>
            );
          })
        ) : (
          <div className="no-orders-message">
            <p>Bu filtreye uygun ürün bulunamadı.</p>
          </div>
        )}
      </div>
    </div>
  );
}

export default ManufacturingModule;
