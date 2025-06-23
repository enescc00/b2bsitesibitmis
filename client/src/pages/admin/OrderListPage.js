import React, { useState, useEffect, useContext } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import Paginate from '../../components/Paginate';
import './AdminTable.css';

function OrderListPage() {
  const [orders, setOrders] = useState([]);
  const [page, setPage] = useState(1);
  const [pages, setPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');

  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();
  const { pageNumber } = useParams();
  
  const currentPage = pageNumber || 1;

  useEffect(() => {
    const fetchOrders = async () => {
        try {
          setLoading(true);
          let url = `http://localhost:5001/api/orders?pageNumber=${currentPage}`;
          if (startDate && endDate) {
              url += `&startDate=${startDate}&endDate=${endDate}`;
          }
          const response = await fetch(url, {
            headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const data = await response.json();
          if (!response.ok) throw new Error(data.msg || 'Siparişler getirilemedi.');
          setOrders(data.orders);
          setPage(data.page);
          setPages(data.pages);
        } catch (err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
    if (authToken) {
      fetchOrders();
    }
  }, [authToken, currentPage, startDate, endDate]);

  const handleStatusChange = async (orderId, newStatus) => {
    try {
        let body = { status: newStatus };
        if (newStatus === 'Kargoya Verildi') {
            const pkgs = prompt('Kaç koli gönderildi?');
            if (!pkgs) return; // iptal
            body.packagesCount = Number(pkgs);
        }
        const response = await fetch(`http://localhost:5001/api/orders/${orderId}/status`, {
            method: 'PATCH',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(body)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Durum güncellenemedi.');
        setOrders(orders.map(order => order._id === orderId ? { ...order, status: newStatus } : order));
    } catch (err) {
        alert(`Hata: ${err.message}`);
    }
  };

  const handleRowClick = (id) => {
    navigate(`/admin/order/${id}`);
  };
  
  const clearFilters = () => {
      setStartDate('');
      setEndDate('');
  }

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;
  
  const orderStatuses = ['Beklemede', 'Hazırlanıyor', 'Kargoya Verildi', 'Teslim Edildi', 'İptal Edildi'];

  return (
    <div className="admin-page-container">
      <h1>Sipariş Yönetimi</h1>
      
      <div className="filter-container">
        <div className="form-group">
            <label>Başlangıç Tarihi</label>
            <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} />
        </div>
        <div className="form-group">
            <label>Bitiş Tarihi</label>
            <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} />
        </div>
        <button onClick={clearFilters} className="clear-filter-btn">Filtreyi Temizle</button>
      </div>
      
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
            {orders.map(order => (
              <tr key={order._id} onClick={() => handleRowClick(order._id)} className="clickable-row">
                <td>#{order._id.substring(0,8)}...</td>
                <td>{order.user ? order.user.name : 'Silinmiş Kullanıcı'}</td>
                <td>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                <td>{order.totalPrice.toFixed(2)} ₺</td>
                <td onClick={(e) => e.stopPropagation()}>
                  <select 
                    value={order.status} 
                    onChange={(e) => handleStatusChange(order._id, e.target.value)}
                    className="status-select"
                  >
                    {orderStatuses.map(status => (
                      <option key={status} value={status}>{status}</option>
                    ))}
                  </select>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <Paginate pages={pages} page={page} isAdmin={true} baseUrl='/admin/orders' />
    </div>
  );
}

export default OrderListPage;