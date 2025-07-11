import React, { useState, useEffect, useContext } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminTable.css';

function PriceListPage() {
    const [priceLists, setPriceLists] = useState([]);
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchPriceLists = async () => {
            try {
                const response = await fetch('/api/pricelists', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.msg || 'Fiyat listeleri alınamadı.');
                setPriceLists(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (authToken) {
            fetchPriceLists();
        }
    }, [authToken]);

    const handleDelete = async (id) => {
        if (window.confirm('Bu fiyat listesini silmek istediğinizden emin misiniz?')) {
            try {
                const response = await fetch(`/api/pricelists/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await response.json();
                if (!response.ok) throw new Error(data.msg || 'Fiyat listesi silinemedi.');
                setPriceLists(priceLists.filter(pl => pl._id !== id));
                toast.success('Fiyat listesi başarıyla silindi.');
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    if (loading) return <div className="loading-container">Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <div className="admin-header">
                <h1>Fiyat Listeleri</h1>
                <Link to="/admin/pricelists/new" className="add-new-btn">Yeni Fiyat Listesi Ekle</Link>
            </div>
            <table className="admin-table">
                <thead>
                    <tr>
                        <th>Liste Adı</th>
                        <th>Global İndirim (%)</th>
                        <th>İşlemler</th>
                    </tr>
                </thead>
                <tbody>
                    {priceLists.length > 0 ? priceLists.map(pl => (
                        <tr key={pl._id}>
                            <td>{pl.name}</td>
                            <td>{pl.globalDiscountPercentage || 0}</td>
                            <td>
                                <button onClick={() => navigate(`/admin/pricelists/${pl._id}`)} className="edit-btn">Düzenle</button>
                                <button onClick={() => handleDelete(pl._id)} className="delete-btn">Sil</button>
                            </td>
                        </tr>
                    )) : (
                        <tr>
                            <td colSpan="3">Henüz fiyat listesi oluşturulmamış.</td>
                        </tr>
                    )}
                </tbody>
            </table>
        </div>
    );
}

export default PriceListPage;
