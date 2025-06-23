import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './DashboardPage.css'; // Stil dosyasını ekleyelim

function DashboardPage() {
  const { authToken } = useContext(AuthContext);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchDashboardData = async () => {
      if (!authToken) return;
      try {
        setLoading(true);
        const res = await fetch('/api/supplier/dashboard', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.msg || 'İstatistikler alınamadı.');
        }
        setStats(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    fetchDashboardData();
  }, [authToken]);

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="supplier-dashboard">
      <h1>Gösterge Paneli</h1>
      <div className="stats-container">
        <div className="stat-card">
          <i className="fas fa-box-open"></i>
          <div className="stat-info">
            <p>Toplam Ürün Sayınız</p>
            <span>{stats?.totalProducts ?? 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-truck-loading"></i>
          <div className="stat-info">
            <p>Aktif Siparişler</p>
            <span>{stats?.activeOrders ?? 0}</span>
          </div>
        </div>
        <div className="stat-card">
          <i className="fas fa-lira-sign"></i>
          <div className="stat-info">
            <p>Toplam Kazanç</p>
            <span>₺{stats?.totalRevenue?.toFixed(2) ?? '0.00'}</span>
          </div>
        </div>
      </div>
      <div className="quick-actions">
          <Link to="/supplier/products" className="action-button">
            <i className="fas fa-list-ul"></i>
            Ürünleri Yönet
          </Link>
          <Link to="/supplier/product/new" className="action-button">
            <i className="fas fa-plus-circle"></i>
            Yeni Ürün Ekle
          </Link>
          <Link to="/supplier/orders" className="action-button">
            <i className="fas fa-receipt"></i>
            Siparişleri Görüntüle
          </Link>
      </div>
    </div>
  );
}

export default DashboardPage;
