import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminForm.css';
import './ProductTreePage.css';

function ProductTreePage() {
    const [inventoryItems, setInventoryItems] = useState([]);
    const [categories, setCategories] = useState([]); // Kategoriler için yeni state
    const [productTree, setProductTree] = useState([]);
    const [treeName, setTreeName] = useState('');
    const [selectedCategory, setSelectedCategory] = useState(''); // Seçilen kategori için state
    
    const [targetTerm, setTargetTerm] = useState(0);
    const [calculatedCost, setCalculatedCost] = useState(null);
    
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();

    useEffect(() => {
        const fetchInitialData = async () => {
            try {
                // Stok ve kategori verilerini aynı anda çek
                const [invRes, catRes] = await Promise.all([
                    fetch(`${API_BASE_URL}/api/inventory`, { headers: { 'Authorization': `Bearer ${authToken}` } }),
                    fetch(`${API_BASE_URL}/api/categories`, { headers: { 'Authorization': `Bearer ${authToken}` } })
                ]);
                const invData = await invRes.json();
                const catData = await catRes.json();
                if (!invRes.ok) throw new Error('Stok kalemleri getirilemedi.');
                if (!catRes.ok) throw new Error('Kategoriler getirilemedi.');
                
                setInventoryItems(invData);
                setCategories(catData);
                // Varsayılan kategoriyi ata
                if (catData.length > 0) {
                    setSelectedCategory(catData[0]._id);
                }
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        if(authToken) fetchInitialData();
    }, [authToken]);

    const handleAddItem = (e) => {
        const selectedId = e.target.value;
        if (!selectedId) return;
        const itemToAdd = inventoryItems.find(i => i._id === selectedId);
        if (itemToAdd) {
            const existingItemIndex = productTree.findIndex(item => item._id === selectedId);
            if (existingItemIndex > -1) {
                const updatedTree = [...productTree];
                updatedTree[existingItemIndex].quantity += 1;
                setProductTree(updatedTree);
            } else {
                setProductTree([...productTree, { ...itemToAdd, quantity: 1 }]);
            }
        }
        e.target.value = "";
    };

    const handleRemoveItem = (index) => {
        const newTree = [...productTree];
        newTree.splice(index, 1);
        setProductTree(newTree);
    };

    const handleCalculateCost = async () => {
        if (productTree.length === 0) return toast.error('Önce ürün ağacına parça ekleyin.');
        const components = productTree.map(item => ({ inventoryItem: item._id, quantity: item.quantity }));
        try {
            const res = await fetch(`${API_BASE_URL}/api/costing/calculate`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify({ components, targetTerm, targetCurrency: 'TL' })
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Maliyet hesaplanamadı.');
            setCalculatedCost(data);
            toast.success('Maliyet hesaplandı!');
        } catch (error) {
            toast.error(error.message);
        }
    };
    
    const handleSaveTreeAsProduct = async () => {
        if (!treeName.trim()) return toast.error('Lütfen ürün ağacı için bir isim girin.');
        if (!selectedCategory) return toast.error('Lütfen bir kategori seçin.');
        if (productTree.length === 0) return toast.error('Ürün ağacı boş olamaz.');
        
        const productComponents = productTree.map(item => ({ inventoryItem: item._id, quantity: item.quantity }));
        const newProductData = {
            name: treeName,
            description: `${treeName} - Ürün Ağacından Oluşturuldu`,
            image: '/uploads/placeholder.jpg',
            price: calculatedCost ? parseFloat(calculatedCost.totalCostTL) : 0,
            stock: 0,
            category: selectedCategory, // SEÇİLEN KATEGORİYİ KULLAN
            components: productComponents
        };
        
        try {
            const response = await fetch(`${API_BASE_URL}/api/products`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
                body: JSON.stringify(newProductData)
            });
            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'Ürün ağacı kaydedilemedi.');
            
            toast.success(`"${treeName}" ürünü başarıyla oluşturuldu!`);
            navigate(`/admin/product/${data._id}`);
        } catch (err) {
            toast.error(err.message);
        }
    };

    if (loading) return <div className="loading-container">Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <h1>Ürün Ağacı ve Maliyet Hesaplama</h1>
            <div className="product-tree-grid">
                <div className="tree-builder-container">
                    <h3>Ürün Ağacı Oluştur</h3>
                    <div className="add-item-form">
                        <select onChange={handleAddItem} defaultValue="">
                            <option value="" disabled>Stoktan Parça Seç...</option>
                            {inventoryItems.map(item => (
                                <option key={item._id} value={item._id}>{item.name} ({item.itemCode})</option>
                            ))}
                        </select>
                    </div>
                    <div className="tree-list">
                        {productTree.map((item, index) => (
                            <div key={`${item._id}-${index}`} className="tree-list-item">
                                <span className="item-details">
                                    {item.quantity} x {item.name}
                                    <span className="item-purchase-type">
                                        ({item.purchaseType === 'vadeli' ? `${item.termMonths} Ay Vadeli` : 'Nakit'})
                                    </span>
                                </span>
                                <button onClick={() => handleRemoveItem(index)}>Kaldır</button>
                            </div>
                        ))}
                    </div>
                </div>
                <div className="cost-calculator-container">
                    <h3>Maliyet ve Kayıt</h3>
                    <div className="form-group">
                        <label>İstenen Vade (Ay)</label>
                        <input type="number" value={targetTerm} onChange={e => setTargetTerm(parseInt(e.target.value))} />
                    </div>
                    <button onClick={handleCalculateCost} className="submit-btn full-width">Maliyeti Hesapla</button>
                    {calculatedCost && (
                        <div className="cost-result">
                            <h4>Hesaplanan Toplam Maliyet</h4>
                            <p className="cost-tl">{calculatedCost.totalCostTL} TL</p>
                        </div>
                    )}
                    <hr className="divider" />
                    <div className="form-group">
                        <label>Kaydedilecek Ürün Adı</label>
                        <input type="text" value={treeName} onChange={(e) => setTreeName(e.target.value)} placeholder="Yeni Ürün İçin İsim Girin..." />
                    </div>
                    <div className="form-group">
                        <label>Kategori</label>
                        <select value={selectedCategory} onChange={(e) => setSelectedCategory(e.target.value)}>
                            <option value="">Kategori Seçiniz</option>
                            {categories.map(cat => (
                                <option key={cat._id} value={cat._id}>{cat.name}</option>
                            ))}
                        </select>
                    </div>
                    <button onClick={handleSaveTreeAsProduct} className="approve-btn full-width">Ürün Ağacını Kaydet</button>
                </div>
            </div>
        </div>
    );
}

export default ProductTreePage;