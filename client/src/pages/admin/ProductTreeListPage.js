import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminTable.css'; 

function ProductTreeListPage() {
    const [productTrees, setProductTrees] = useState([]);
    const [loading, setLoading] = useState(true);
    // === YENİ STATE'LER: Arama ve genişletme için ===
    const [searchTerm, setSearchTerm] = useState('');
    const [filteredTrees, setFilteredTrees] = useState([]);
    const [expandedId, setExpandedId] = useState(null);

    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchTrees = async () => {
            try {
                setLoading(true);
                const res = await fetch('http://localhost:5001/api/product-trees', {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error('Ürün ağaçları getirilemedi.');
                setProductTrees(data);
                setFilteredTrees(data); // Başlangıçta tüm ağaçları göster
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        if (authToken) {
            fetchTrees();
        }
    }, [authToken]);

    // === YENİ FONKSİYON: Arama terimi değiştikçe listeyi filtreler ===
    useEffect(() => {
        const results = productTrees.filter(tree =>
            tree.name.toLowerCase().includes(searchTerm.toLowerCase())
        );
        setFilteredTrees(results);
    }, [searchTerm, productTrees]);

    const handleDelete = async (id) => {
        if (window.confirm('Bu ürün ağacını silmek istediğinizden emin misiniz?')) {
            try {
                await fetch(`http://localhost:5001/api/product-trees/${id}`, {
                    method: 'DELETE',
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                toast.success('Ürün ağacı silindi.');
                const updatedTrees = productTrees.filter(tree => tree._id !== id);
                setProductTrees(updatedTrees);
            } catch (error) {
                toast.error('Silme işlemi başarısız oldu.');
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
            <div className="admin-page-header">
                <h1>Ürün Ağaçları (Reçeteler)</h1>
                <button onClick={() => navigate('/admin/product-tree/new')} className="add-new-btn">Yeni Ürün Ağacı Oluştur</button>
            </div>

            {/* === YENİ BÖLÜM: Arama Çubuğu === */}
            <div className="search-form">
                <input
                    type="text"
                    placeholder="Reçete adı ile ara..."
                    className="search-input"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                />
            </div>

            <div className="admin-table-container">
                <table className="admin-table">
                    <thead>
                        <tr>
                            <th>Reçete Adı</th>
                            <th>Parça Sayısı</th>
                            <th>İşlemler</th>
                        </tr>
                    </thead>
                    <tbody>
                        {filteredTrees.map(tree => (
                            <React.Fragment key={tree._id}>
                                <tr className="clickable-row" onClick={() => toggleDetails(tree._id)}>
                                    <td>{tree.name}</td>
                                    <td>{tree.components.length} parça</td>
                                    <td className="action-cell">
                                        <button onClick={(e) => { e.stopPropagation(); navigate(`/admin/product-tree/${tree._id}`); }} className="edit-btn">Düzenle</button>
                                        <button onClick={(e) => { e.stopPropagation(); handleDelete(tree._id); }} className="delete-btn">Sil</button>
                                    </td>
                                </tr>
                                {/* === YENİ BÖLÜM: Genişletilebilir Detaylar === */}
                                {expandedId === tree._id && (
                                    <tr className="history-details-row">
                                        <td colSpan="3" className="history-details-cell">
                                            <div className="history-log">
                                                <h4>Reçete İçeriği</h4>
                                                {tree.components && tree.components.length > 0 ? (
                                                    <ul className="component-list">
                                                        {tree.components.map((comp, index) => (
                                                            <li key={index}>
                                                                <span className="component-name">{comp.inventoryItem.name}</span>
                                                                <span className="component-qty">{comp.quantity} adet</span>
                                                            </li>
                                                        ))}
                                                    </ul>
                                                ) : (
                                                    <p>Bu reçeteye henüz parça eklenmemiş.</p>
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

export default ProductTreeListPage;