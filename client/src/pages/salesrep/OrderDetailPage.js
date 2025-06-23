import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import '../profile/MyQuotesPage.css';

const statusOptions = ['Onay Bekliyor','Beklemede','Hazırlanıyor','Kargoya Verildi','Teslim Edildi','İptal Edildi','Kısmi Tamamlandı'];

const OrderDetailPage = () => {
  const { orderId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);
  const [order, setOrder] = useState(null);
  const { user } = useContext(AuthContext);
  const [newStatus, setNewStatus] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(()=>{
    const fetchDetail = async ()=>{
      try {
        const res = await fetch(`/api/salesrep/orders/${orderId}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if(!res.ok) throw new Error(data.msg || 'Sipariş getirilemedi');
        setOrder(data);
        setNewStatus(data.status);
      } catch(err){ toast.error(err.message);} finally{ setLoading(false);}    
    };
    fetchDetail();
  },[orderId, authToken]);

  const handleUpdate = async ()=>{
    try {
      const res = await fetch(`/api/salesrep/orders/${orderId}/status`, {
        method: 'PATCH',
        headers:{ 'Content-Type':'application/json', Authorization:`Bearer ${authToken}` },
        body: JSON.stringify({ status: newStatus })
      });
      const data = await res.json();
      if(!res.ok) throw new Error(data.msg || 'Güncellenemedi');
      toast.success('Durum güncellendi');
      navigate(-1);
    } catch(err){ toast.error(err.message);}  
  };

  if(loading) return <div className="loading-container">Yükleniyor...</div>;
  if(!order) return null;

  return (
    <div className="order-detail-page">
      <h3>Sipariş Detayı</h3>
      <div className="order-summary">
        <p><strong>Müşteri :</strong> {order.user?.companyTitle || order.user?.name}</p>
        <p><strong>Tarih :</strong> {new Date(order.createdAt).toLocaleString('tr-TR')}</p>
        <p><strong>Toplam :</strong> {order.totalPrice.toFixed(2)} ₺</p>
        <p><strong>Adres :</strong> {order.shippingAddress?.fullAddress}</p>
        <p><strong>Durum :</strong> {order.status}</p>
      </div>

      <h4>Ürünler</h4>
      <table className="admin-table">
        <thead><tr><th>Ürün</th><th>Miktar</th><th>Birim Fiyat</th><th>Toplam</th></tr></thead>
        <tbody>
          {order.orderItems.map(item=> (
            <tr key={item._id || item.product?._id}>
              <td>{item.product?.name || item.name}</td>
              <td>{item.qty}</td>
              <td>{item.price.toFixed(2)} ₺</td>
              <td>{(item.price*item.qty).toFixed(2)} ₺</td>
            </tr>
          ))}
        </tbody>
      </table>

      {String(order.createdBy) === String(user?._id) && (
        <div className="status-update-box">
          <select value={newStatus} onChange={e => setNewStatus(e.target.value)}>
            {statusOptions.map(s => (
              <option key={s} value={s}>{s}</option>
            ))}
          </select>
          <button className="btn btn-primary" onClick={handleUpdate}>Güncelle</button>
        </div>
      )}
    </div>
  );
};
export default OrderDetailPage;
