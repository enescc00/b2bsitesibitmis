import React, { useState, useEffect, useContext } from "react";
import { AuthContext } from "../../context/AuthContext";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import "./DashboardPage.css";

// Chart.js bileşenlerini kaydet
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  Title,
  Tooltip,
  Legend
);

function StatCard({ title, value, iconClass }) {
  return (
    <div className="stat-card">
      <div className="stat-card-icon">
        <i className={iconClass}></i>{" "}
        {/* FontAwesome gibi bir kütüphane eklenirse ikonlar görünür */}
      </div>
      <div className="stat-card-info">
        <h4>{title}</h4>
        <p>{value}</p>
      </div>
    </div>
  );
}

function DashboardPage() {
  const [stats, setStats] = useState(null);
  const [recentOrders, setRecentOrders] = useState([]);
  const [salesData, setSalesData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const { authToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        const [statsRes, ordersRes, salesRes] = await Promise.all([
          fetch("/api/admin/stats", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/admin/recent-orders", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
          fetch("/api/admin/sales-summary", {
            headers: { Authorization: `Bearer ${authToken}` },
          }),
        ]);

        const statsData = await statsRes.json();
        const ordersData = await ordersRes.json();
        const salesSummaryData = await salesRes.json();

        if (!statsRes.ok)
          throw new Error(statsData.msg || "İstatistikler alınamadı.");
        if (!ordersRes.ok)
          throw new Error(ordersData.msg || "Son siparişler alınamadı.");
        if (!salesRes.ok)
          throw new Error(salesSummaryData.msg || "Satış verileri alınamadı.");

        setStats(statsData);
        setRecentOrders(ordersData);

        if (salesSummaryData && salesSummaryData.length > 0) {
          const labels = salesSummaryData.map(
            (d) => `${d._id.month}/${d._id.year}`
          );
          const data = salesSummaryData.map((d) => d.totalSales);
          setSalesData({
            labels,
            datasets: [
              {
                label: "Aylık Satış (₺)",
                data: data,
                borderColor: "rgb(75, 192, 192)",
                backgroundColor: "rgba(75, 192, 192, 0.5)",
                tension: 0.1,
              },
            ],
          });
        }
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (authToken) {
      fetchDashboardData();
    }
  }, [authToken]);

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  const chartOptions = {
    responsive: true,
    plugins: {
      legend: { position: "top" },
      title: {
        display: true,
        text: "Aylık Satış Performansı (Teslim Edilenler)",
      },
    },
  };

  return (
    <div className="dashboard-page">
      <h1>Gösterge Paneli</h1>

      {stats && (
        <div className="stats-grid">
          <StatCard
            title="Toplam Satış"
            value={`${stats.totalSales.toFixed(2)} ₺`}
            iconClass="fas fa-dollar-sign"
          />
          <StatCard
            title="Toplam Sipariş"
            value={stats.totalOrders}
            iconClass="fas fa-shopping-cart"
          />
          <StatCard
            title="Toplam Müşteri"
            value={stats.totalUsers}
            iconClass="fas fa-users"
          />
          <StatCard
            title="Toplam Ürün"
            value={stats.totalProducts}
            iconClass="fas fa-box"
          />
        </div>
      )}

      <div className="chart-container">
        <h2>Satış Grafiği</h2>
        {salesData ? (
          <Line options={chartOptions} data={salesData} />
        ) : (
          <p>
            Grafik için yeterli satış verisi (Teslim Edildi durumunda)
            bulunamadı.
          </p>
        )}
      </div>

      <div className="recent-orders-container">
        <h2>Son Siparişler</h2>
        <div className="admin-table-container">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Sipariş ID</th>
                <th>Müşteri</th>
                <th>Tarih</th>
                <th>Tutar</th>
                <th>Durum</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => (
                <tr key={order._id}>
                  <td>#{String(order.orderNumber).padStart(4, "0")}</td>
                  <td>{order.user ? order.user.name : "N/A"}</td>
                  <td>
                    {new Date(order.createdAt).toLocaleDateString("tr-TR")}
                  </td>
                  <td>{order.totalPrice.toFixed(2)} ₺</td>
                  <td>
                    <span
                      className={`status-badge status-${order.status
                        .toLowerCase()
                        .replace(/ /g, "-")}`}
                    >
                      {order.status}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DashboardPage;
