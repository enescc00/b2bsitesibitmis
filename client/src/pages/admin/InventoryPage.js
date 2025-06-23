import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminTable.css';
import './AdminForm.css';

function InventoryPage() {
    const [items, setItems] = useState([]);
    const [formData, setFormData] = useState({
        name: '', itemCode: '', quantity: 0, unitPrice: 0, currency: 'TRY', purchaseType: 'nakit', termMonths: 0
    });
    const [editingId, setEditingId] = useState(null);
    const [loading, setLoading] = useState(true);
    const [expandedId, setExpandedId] = useState(null);
    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();

    const fetchItems = async () => {
        try {
            setLoading(true);
            const res = await fetch('/api/inventory', {
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Stok kalemleri getirilemedi.');
            setItems(data);
        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        if (authToken) {
            fetchItems();
        }
    }, [authToken]);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const clearForm = () => {
        setFormData({ name: '', itemCode: '', quantity: 0, unitPrice: 0, currency: 'TRY', purchaseType: 'nakit', termMonths: 0 });
        setEditingId(null);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = editingId ? `/api/inventory/${editingId}` : '/api/inventory';
        const method = editingId ? 'PUT' : 'POST';
        try {
            const res = await fetch(url, {
                method,
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(formData)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'İşlem başarısız oldu.');
            toast.success(`Stok kalemi başarıyla ${editingId ? 'güncellendi' : 'oluşturuldu'}.`);
            clearForm();
            fetchItems();
        } catch (error) {
            toast.error(error.message);
        }
    };

    const handleEdit = (e, item) => {
        e.stopPropagation();
        setFormData({
            name: item.name,
            itemCode: item.itemCode || '',
            quantity: item.quantity,
            unitPrice: item.unitPrice,
            currency: item.currency,
            purchaseType: item.purchaseType,
            termMonths: item.termMonths || 0
        });
        setEditingId(item._id);
    };

    const handleDelete = async (e, id) => {
        e.stopPropagation();
        if (window.confirm('Bu stok kalemini silmek istediğinizden emin misiniz?')) {
            try {
                const res = await fetch(`/api/inventory/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Silme işlemi başarısız oldu.');
                toast.success('Stok kalemi silindi.');
                fetchItems();
            } catch (error) {
                toast.error(error.message);
            }
        }
    };

    const handleListForSale = (e, item) => {
        e.stopPropagation();
        navigate('/admin/product/new', { state: { inventoryItem: item } });
    };

    const toggleDetails = (id) => {
        setExpandedId(expandedId === id ? null : id);
    };

    if (loading) return <div className="loading-container">Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <h1>Stok Yönetimi</h1>
            
            <div className="admin-form-container">
                <h3>{editingId ? 'Stok Kalemini Düzenle' : 'Yeni Stok Kalemi Ekle'}</h3>
                <form onSubmit={handleSubmit} className="admin-form inventory-form">
                    <div className="form-grid">
                        <div className="form-group">
                            <label>Stok Adı</label>
                            <input type="text" name="name" value={formData.name} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Stok Kodu/SKU</label>
                            <input type="text" name="itemCode" value={formData.itemCode} onChange={handleChange} />
                        </div>
                        <div className="form-group">
                            <label>Stok Adedi</label>
                            <input type="number" name="quantity" value={formData.quantity} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Alış Fiyatı (Birim Fiyat)</label>
                            <input type="number" step="0.01" name="unitPrice" value={formData.unitPrice} onChange={handleChange} required />
                        </div>
                        <div className="form-group">
                            <label>Para Birimi</label>
                            <select name="currency" value={formData.currency} onChange={handleChange}>
                                <option value="TRY">TL</option>
                                <option value="USD">USD</option>
                                <option value="EUR">EUR</option>
                            </select>
                        </div>
                        <div className="form-group">
                            <label>Alım Türü</label>
                            <select name="purchaseType" value={formData.purchaseType} onChange={handleChange}>
                                <option value="nakit">Nakit</option>
                                <option value="vadeli">Vadeli</option>
                            </select>
                        </div>
                        {formData.purchaseType === 'vadeli' && (
                            <div className="form-group">
                                <label>Vade (Ay)</label>
                                <input type="number" name="termMonths" value={formData.termMonths} onChange={handleChange} />
                            </div>
                        )}
                    </div>
                    <div className="form-actions">
                        <button type="submit" className="submit-btn">{editingId ? 'Güncelle' : 'Kaydet'}</button>
                        {editingId && <button type="button" onClick={clearForm} className="cancel-btn">İptal</button>}
                    </div>
                </form>
            </div>

            <div className="admin-table-container" style={{marginTop: '3rem'}}>
                <h3>Stok Listesi (Detaylar için satıra tıklayın)</h3>
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Stok Adı</th>
                            <th>Kodu</th>
                            <th>Alış Fiyatı</th>
                            <th>Stok Adedi</th>
                            {/* === YENİ SÜTUN === */}
                            <th>Durum</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {items.map(item => (
                            <React.Fragment key={item._id}>
                                <tr className="clickable-row" onClick={() => toggleDetails(item._id)}>
                                    <td>{item.name}</td>
                                    <td>{item.itemCode}</td>
                                    <td>{item.unitPrice.toFixed(2)} {item.currency}</td>
                                    <td>{item.quantity}</td>
                                    {/* === YENİ SÜTUN İÇERİĞİ === */}
                                    <td>
                                        {item.isStale && (
                                            <span className="status-badge stale">Bayat Fiyat!</span>
                                        )}
                                    </td>
                                    <td className="action-cell">
                                        <button onClick={(e) => handleListForSale(e, item)} className="approve-btn">Satışa Çıkar</button>
                                        <button onClick={(e) => handleEdit(e, item)} className="edit-btn">Düzenle</button>
                                        <button onClick={(e) => handleDelete(e, item._id)} className="delete-btn">Sil</button>
                                    </td>
                                </tr>
                                {expandedId === item._id && (
                                    <tr className="history-details-row">
                                        {/* === colSpan 5 -> 6 olarak güncellendi === */}
                                        <td colSpan="6" className="history-details-cell">
                                            <div className="history-log">
                                                <h4>Değişiklik Geçmişi</h4>
                                                {item.history && item.history.length > 0 ? (
                                                    item.history.slice(0).reverse().map((log, index) => (
                                                        <div key={index} className="history-entry">
                                                            <div className="history-meta">
                                                                <span className="history-user">{log.user ? log.user.name : 'Bilinmeyen'}</span>
                                                                <span className="history-date">{new Date(log.timestamp).toLocaleString('tr-TR')}</span>
                                                            </div>
                                                            <div className="history-action">{log.action}</div>
                                                            {log.details && <div className="history-details">{log.details}</div>}
                                                        </div>
                                                    ))
                                                ) : (
                                                    <p>Bu kalem için geçmiş kaydı bulunamadı.</p>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                )}
                            </React.Fragment>
                        ))}
                    </tbody>
                </table>
            </div>
        </div>
    );
}

export default InventoryPage;