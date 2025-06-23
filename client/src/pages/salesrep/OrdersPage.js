import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import '../profile/MyQuotesPage.css';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const statusMap = {
  'Onay Bekliyor': { label: 'Onay Bekliyor', class: 'status-talep-edildi' },
  'Beklemede': { label: 'Beklemede', class: 'status-beklemede' },
  'Hazırlanıyor': { label: 'Hazırlanıyor', class: 'status-hazirlaniyor' },
  'Kargoya Verildi': { label: 'Kargoya Verildi', class: 'status-kargoda' },
  'Teslim Edildi': { label: 'Tamamlandı', class: 'status-tamamlandi' },
  'İptal Edildi': { label: 'İptal', class: 'status-iptal' },
  'Kısmi Tamamlandı': { label: 'Kısmi', class: 'status-partial' }
};

const OrdersPage = () => {
  const { authToken } = useContext(AuthContext);
  const [orders, setOrders] = useState([]);
  const [statusFilter, setStatusFilter] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const buildQuery = () => {
      const params = new URLSearchParams();
      if (statusFilter) params.append('status', statusFilter);
      if (startDate) params.append('start', startDate);
      if (endDate) params.append('end', endDate);
      return params.toString();
    };

    const fetchOrders = async () => {
      try {
        const query = buildQuery();
        const res = await fetch(`/api/salesrep/orders${query ? '?' + query : ''}`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Siparişler alınamadı');
        setOrders(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchOrders();
  }, [authToken, statusFilter, startDate, endDate]);

  if (loading) return <div className="loading-container">Yükleniyor...</div>;

  return (
    <div className="salesrep-orders-page">
      <h3>Siparişlerim</h3>
      <div className="orders-filters">
        <select value={statusFilter} onChange={e=>setStatusFilter(e.target.value)}>
          <option value="">Tüm Durumlar</option>
          {Object.keys(statusMap).map(k=> (<option key={k} value={k}>{statusMap[k].label}</option>))}
        </select>
        <input type="date" value={startDate} onChange={e=>setStartDate(e.target.value)} />
        <input type="date" value={endDate} onChange={e=>setEndDate(e.target.value)} />
      </div>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Müşteri</th>
            <th>Tarih</th>
            <th>Tutar</th>
            <th>Durum</th>
          </tr>
        </thead>
        <tbody>
          {orders.map((o) => {
            const status = statusMap[o.status] || { label: o.status, class: '' };
            return (
              <tr key={o._id}>
                <td>
                    <Link to={`/portal/orders/${o._id}`} className="table-link">
                      {o.user?.companyTitle || o.user?.name}
                    </Link>
                 </td>
                <td>{new Date(o.createdAt).toLocaleDateString('tr-TR')}</td>
                <td>{o.totalPrice.toFixed(2)} ₺</td>
                <td><span className={`status-chip ${status.class}`}>{status.label}</span></td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default OrdersPage;
