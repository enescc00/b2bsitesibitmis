import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './MyOrdersPage.css';

function MyOrdersPage() {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [activeFilter, setActiveFilter] = useState('Tümü');
  const { authToken } = useContext(AuthContext);

  useEffect(() => {
    const fetchOrders = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/orders/myorders', {
          headers: {
            'Authorization': `Bearer ${authToken}`
          }
        });
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Siparişler getirilemedi.');
        }
        setOrders(data);
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
      case 'Devam Edenler':
        return orders.filter(order => order.status === 'Beklemede' || order.status === 'Hazırlanıyor' || order.status === 'Kargoya Verildi');
      case 'Teslim Edilenler':
        return orders.filter(order => order.status === 'Teslim Edildi');
      case 'İptaller':
        return orders.filter(order => order.status === 'İptal Edildi');
      case 'Tümü':
      default:
        return orders;
    }
  };

  const filteredOrders = filterOrders();

  const filterButtons = ['Tümü', 'Devam Edenler', 'Teslim Edilenler', 'İptaller'];

  if (loading) return <div className="loading-container">Siparişler Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="my-orders-page">
      <h1>Siparişlerim</h1>
      
      <div className="order-filters">
        {filterButtons.map(filter => (
          <button 
            key={filter}
            className={`filter-btn ${activeFilter === filter ? 'active' : ''}`}
            onClick={() => setActiveFilter(filter)}
          >
            {filter}
          </button>
        ))}
      </div>

      <div className="order-list">
        {filteredOrders.length > 0 ? (
          filteredOrders.map(order => (
            <div key={order._id} className="order-card">
              <div className="order-header">
                <div className="order-info">
                  <span>Sipariş Tarihi: {new Date(order.createdAt).toLocaleDateString('tr-TR')}</span>
                  <span>Sipariş No: {order._id}</span>
                </div>
                <div className={`order-status status-${order.status.toLowerCase().replace(' ', '-')}`}>
                  {order.status}
                </div>
              </div>
              <div className="order-body">
                {order.orderItems.map(item => (
                  <div key={item.product} className="order-item">
                     {item.qty} x {item.name}
                  </div>
                ))}
              </div>
              <div className="order-footer">
                <span>Toplam Tutar: <strong>{order.totalPrice.toFixed(2)} ₺</strong></span>
              </div>
            </div>
          ))
        ) : (
          <p>Bu filtreye uygun sipariş bulunamadı.</p>
        )}
      </div>
    </div>
  );
}

export default MyOrdersPage;