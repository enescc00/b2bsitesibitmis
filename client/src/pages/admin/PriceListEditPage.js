import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminForm.css';

function PriceListEditPage() {
    const { id } = useParams();
    const navigate = useNavigate();
    const { authToken } = useContext(AuthContext);

    const [name, setName] = useState('');
    const [globalDiscountPercentage, setGlobalDiscountPercentage] = useState(0);
    const [categoryDiscounts, setCategoryDiscounts] = useState([]);
    const [productPrices, setProductPrices] = useState([]);
    
    const [products, setProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchData = async () => {
            try {
                const [productsRes, categoriesRes] = await Promise.all([
                    fetch('/api/products/all', { headers: { 'Authorization': `Bearer ${authToken}` } }),
                    fetch('/api/categories', { headers: { 'Authorization': `Bearer ${authToken}` } })
                ]);

                const productsData = await productsRes.json();
                const categoriesData = await categoriesRes.json();

                setProducts(productsData.products || []);
                setCategories(categoriesData || []);

                if (id !== 'new') {
                    const priceListRes = await fetch(`/api/pricelists/${id}`, { 
                        headers: { 'Authorization': `Bearer ${authToken}` }
                    });
                    const priceListData = await priceListRes.json();
                    if (!priceListRes.ok) throw new Error(priceListData.msg || 'Fiyat listesi detayı alınamadı.');
                    
                    setName(priceListData.name);
                    setGlobalDiscountPercentage(priceListData.globalDiscountPercentage || 0);
                    setCategoryDiscounts(priceListData.categoryDiscounts || []);
                    setProductPrices(priceListData.productPrices || []);
                }
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };

        if (authToken) fetchData();
    }, [id, authToken]);

    const handleDynamicChange = (setter, index, field, value) => {
        setter(prev => {
            const updated = [...prev];
            updated[index][field] = value;
            return updated;
        });
    };

    const addRow = (setter, newRow) => setter(prev => [...prev, newRow]);
    const removeRow = (setter, index) => setter(prev => prev.filter((_, i) => i !== index));

    const handleSubmit = async (e) => {
        e.preventDefault();
        const url = id === 'new' ? '/api/pricelists' : `/api/pricelists/${id}`;
        const method = id === 'new' ? 'POST' : 'PUT';

        const payload = {
            name,
            globalDiscountPercentage,
            categoryDiscounts: categoryDiscounts
                .filter(cd => cd.category && cd.discount > 0)
                .map(cd => ({ category: cd.category, discountPercentage: cd.discount })),
            productPrices: productPrices.filter(pp => pp.product && pp.price > 0)
        };

        try {
            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(payload)
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'İşlem başarısız.');

            toast.success(`Fiyat listesi başarıyla ${id === 'new' ? 'oluşturuldu' : 'güncellendi'}.`);
            navigate('/admin/pricelists');
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div className="loading-container">Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <button onClick={() => navigate('/admin/pricelists')} className="back-btn">&larr; Fiyat Listelerine Dön</button>
            <h1>{id === 'new' ? 'Yeni Fiyat Listesi Oluştur' : 'Fiyat Listesini Düzenle'}</h1>
            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-group">
                    <label>Liste Adı</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} required />
                </div>
                <div className="form-group">
                    <label>Global İndirim (%)</label>
                    <input type="number" value={globalDiscountPercentage} onChange={(e) => setGlobalDiscountPercentage(Number(e.target.value))} />
                </div>

                <hr />

                <h2>Kategori İndirimleri</h2>
                {categoryDiscounts.map((cd, index) => (
                    <div key={index} className="dynamic-row">
                        <select value={cd.category} onChange={(e) => handleDynamicChange(setCategoryDiscounts, index, 'category', e.target.value)}>
                            <option value="">Kategori Seçin</option>
                            {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)}
                        </select>
                        <input type="number" placeholder="İndirim %" value={cd.discount} onChange={(e) => handleDynamicChange(setCategoryDiscounts, index, 'discount', Number(e.target.value))} />
                        <button type="button" onClick={() => removeRow(setCategoryDiscounts, index)} className="remove-btn">Sil</button>
                    </div>
                ))}
                <button type="button" onClick={() => addRow(setCategoryDiscounts, { category: '', discount: 0 })} className="add-btn">Kategori İndirimi Ekle</button>

                <hr />

                <h2>Ürüne Özel Fiyatlar</h2>
                {productPrices.map((pp, index) => (
                    <div key={index} className="dynamic-row">
                        <select value={pp.product} onChange={(e) => handleDynamicChange(setProductPrices, index, 'product', e.target.value)}>
                            <option value="">Ürün Seçin</option>
                            {products.map(prod => <option key={prod._id} value={prod._id}>{prod.name}</option>)}
                        </select>
                        <input type="number" placeholder="Özel Fiyat" value={pp.price} onChange={(e) => handleDynamicChange(setProductPrices, index, 'price', Number(e.target.value))} />
                        <button type="button" onClick={() => removeRow(setProductPrices, index)} className="remove-btn">Sil</button>
                    </div>
                ))}
                <button type="button" onClick={() => addRow(setProductPrices, { product: '', price: 0 })} className="add-btn">Ürüne Özel Fiyat Ekle</button>

                <hr />

                <button type="submit" className="submit-btn">Kaydet</button>
            </form>
        </div>
    );
}

export default PriceListEditPage;
