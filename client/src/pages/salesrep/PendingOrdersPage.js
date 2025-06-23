import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './PendingOrdersPage.css';

function PendingOrdersPage() {
    const [orders, setOrders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();

    // === YENİ STATE: Hangi satırın genişletildiğini tutar ===
    const [expandedId, setExpandedId] = useState(null);

    const fetchPendingOrders = async () => {
        if (!authToken) return;
        setLoading(true);
        try {
            const response = await fetch('/api/salesrep/pending-orders', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Siparişler getirilemedi.');
            setOrders(data);
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchPendingOrders();
    }, [authToken]);
    
    // Onay/Reddetme fonksiyonu
    const handleAction = async (orderId, action) => {
        const confirmMessage = action === 'approve' 
            ? 'Bu siparişi onaylamak istediğinizden emin misiniz? Stok ve cari hesap güncellenecektir.'
            : 'Bu siparişi reddetmek istediğinizden emin misiniz?';

        if (window.confirm(confirmMessage)) {
            try {
                const response = await fetch(`/api/salesrep/orders/${orderId}/${action}`, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.msg || 'İşlem başarısız.');
                
                toast.success(data.msg);
                setOrders(prevOrders => prevOrders.filter(order => order._id !== orderId));
            } catch (err) {
                toast.error(err.message);
            }
        }
    };

    // === YENİ FONKSİYON: Detayları açıp kapatır ===
    const toggleDetails = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) return <div className="loading-container">Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <h1>Onay Bekleyen Siparişler</h1>
            <p>Müşterileriniz tarafından oluşturulan ve sizin onayınızı bekleyen siparişler.</p>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Sipariş Tarihi</th>
                            <th>Müşteri</th>
                            <th>Ürün Sayısı</th>
                            <th style={{textAlign: 'right'}}>Tutar</th>
                            <th className="action-cell">İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {orders.length > 0 ? (
                            orders.map(order => (
                                <React.Fragment key={order._id}>
                                    <tr className="clickable-row" onClick={() => toggleDetails(order._id)}>
                                        <td>{new Date(order.createdAt).toLocaleDateString('tr-TR')}</td>
                                        <td>{order.user.companyTitle || order.user.name}</td>
                                        <td>{order.orderItems.length} kalem</td>
                                        <td style={{textAlign: 'right'}}>{order.totalPrice.toFixed(2)} ₺</td>
                                        <td className="action-cell" onClick={(e) => e.stopPropagation()}>
                                            {/* Butonlara tıklamanın satırın tamamını tetiklemesini önle */}
                                            <button className="approve-btn" onClick={() => handleAction(order._id, 'approve')}>Onayla</button>
                                            <button className="delete-btn" onClick={() => handleAction(order._id, 'reject')}>Reddet</button>
                                        </td>
                                    </tr>
                                    {/* === YENİ BÖLÜM: Genişletilebilir Detay Satırı === */}
                                    {expandedId === order._id && (
                                        <tr className="order-details-row">
                                            <td colSpan="5" className="order-details-cell">
                                                <h4>Sipariş Detayları</h4>
                                                <table className="order-details-table">
                                                    <thead>
                                                        <tr>
                                                            <th>Ürün Adı</th>
                                                            <th style={{textAlign: 'center'}}>Adet</th>
                                                            <th style={{textAlign: 'right'}}>Birim Fiyat</th>
                                                            <th style={{textAlign: 'right'}}>Toplam</th>
                                                        </tr>
                                                    </thead>
                                                    <tbody>
                                                        {order.orderItems.map(item => (
                                                            <tr key={item.product}>
                                                                <td>{item.name}</td>
                                                                <td style={{textAlign: 'center'}}>{item.qty}</td>
                                                                <td style={{textAlign: 'right'}}>{item.price.toFixed(2)} ₺</td>
                                                                <td style={{textAlign: 'right'}}>{(item.qty * item.price).toFixed(2)} ₺</td>
                                                            </tr>
                                                        ))}
                                                    </tbody>
                                                </table>
                                            </td>
                                        </tr>
                                    )}
                                </React.Fragment>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                    Onay bekleyen sipariş bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default PendingOrdersPage;