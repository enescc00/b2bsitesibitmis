import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminTable.css';

function BackordersPage() {
    const [backorders, setBackorders] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchBackorders = async () => {
            if (!authToken) return;
            setLoading(true);
            try {
                const response = await fetch('/api/admin/backorders', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.msg || 'Eksik ürünler listesi alınamadı.');
                setBackorders(data);
            } catch (err) {
                toast.error(err.message);
            } finally {
                setLoading(false);
            }
        };
        fetchBackorders();
    }, [authToken]);

    if (loading) return <div className="loading-container">Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <h1>Eksik Ürün Takibi</h1>
            <p>Bu liste, siparişlerden düzenleme yoluyla çıkarılıp daha sonra gönderilmesi gereken ürünleri gösterir.</p>
            
            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Sipariş Tarihi</th>
                            <th>Müşteri</th>
                            <th>Eksik Ürün</th>
                            <th>Adet</th>
                            <th className="action-cell">İşlem</th>
                        </tr>
                    </thead>
                    <tbody>
                        {backorders.length > 0 ? (
                            backorders.map((item, index) => (
                                <tr key={`${item.orderId}-${item.productId}-${index}`}>
                                    <td>{new Date(item.orderDate).toLocaleDateString('tr-TR')}</td>
                                    <td>{item.customerName}</td>
                                    <td>{item.productName}</td>
                                    <td>{item.quantity}</td>
                                    <td className="action-cell">
                                        <button 
                                            className="edit-btn"
                                            onClick={() => navigate(`/admin/order/${item.orderId}`)}
                                        >
                                            Siparişe Git
                                        </button>
                                    </td>
                                </tr>
                            ))
                        ) : (
                            <tr>
                                <td colSpan="5" style={{ textAlign: 'center', padding: '2rem' }}>
                                    Takip edilecek eksik ürün bulunmuyor.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default BackordersPage;