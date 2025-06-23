import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './OrdersPage.css'; // Stil dosyasını ekleyelim

function OrdersPage() {
  const { authToken } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchOrders = async () => {
      if (!authToken) return;
      try {
        setLoading(true);
        const res = await fetch('/api/supplier/orders', { 
          headers: { Authorization: `Bearer ${authToken}` } 
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.msg || 'Siparişler alınamadı.');
        }
        setOrders(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [authToken]);

  if (loading) return <div className="loading-container">Siparişler yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="supplier-orders-page">
      <h1>Siparişleriniz</h1>
      <div className="table-container">
        <table className="orders-table">
          <thead>
            <tr>
              <th>Ana Sipariş ID</th>
              <th>Ürünler</th>
              <th>Toplam Tutar</th>
              <th>Durum</th>
              <th>Tarih</th>
            </tr>
          </thead>
          <tbody>
            {orders.length > 0 ? (
              orders.map((order) => (
                <tr key={order._id}>
                  <td>{order.mainOrder?.orderId || 'N/A'}</td>
                  <td>
                    <ul className="product-items-list">
                      {order.orderItems.map(item => (
                        <li key={item.product}>{item.name} ({item.qty} adet)</li>
                      ))}
                    </ul>
                  </td>
                  <td>₺{order.totalPrice.toFixed(2)}</td>
                  <td>
                    <span className={`status status-${order.status.replace(/\s+/g, '-').toLowerCase()}`}>
                      {order.status}
                    </span>
                  </td>
                  <td>{new Date(order.createdAt).toLocaleDateString()}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">Gösterilecek sipariş bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default OrdersPage;
