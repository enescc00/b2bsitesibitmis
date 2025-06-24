import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useParams, useNavigate, useLocation } from 'react-router-dom';
import { toast } from 'react-toastify';
import { AuthContext } from '../../context/AuthContext';
import './AdminForm.css';

function ProductEditPage() {
    const { id: productId } = useParams();
    const navigate = useNavigate();
    const location = useLocation();
    const { authToken } = useContext(AuthContext);

    const isNewProduct = !productId;

    const [formData, setFormData] = useState({
        name: '', images: [], description: '', category: '',
        components: [], sku: '', warrantyPeriod: '2 Yıl',
        specifications: [], boxContents: [],
        costPrice: 0, profitMargin: 20, salePrice: 0,
        stock: 0, isActive: true,
    });
    const [categories, setCategories] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [newImageFiles, setNewImageFiles] = useState([]); // For new file uploads

    useEffect(() => {
        const fetchInitialData = async () => {
            setLoading(true);
            try {
                const catRes = await fetch(`${API_BASE_URL}/api/categories`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                if (!catRes.ok) throw new Error('Kategoriler alınamadı.');
                const catData = await catRes.json();
                setCategories(catData);

                if (isNewProduct) {
                    const { newProductFromTree, inventoryItem } = location.state || {};
                    if (newProductFromTree) {
                        setFormData(prev => ({ ...prev, name: newProductFromTree.name, costPrice: newProductFromTree.costPrice, components: newProductFromTree.components }));
                    } else if (inventoryItem) {
                        setFormData(prev => ({ ...prev, name: inventoryItem.name, costPrice: inventoryItem.unitPrice, components: [{ inventoryItem: inventoryItem._id, quantity: 1 }] }));
                    }
                } else {
                    const productRes = await fetch(`${API_BASE_URL}/api/products/${productId}`, { headers: { 'Authorization': `Bearer ${authToken}` } });
                    if (!productRes.ok) throw new Error('Ürün verileri alınamadı.');
                    const productToEdit = await productRes.json();
                    productToEdit.images = productToEdit.images || [];
                    productToEdit.specifications = productToEdit.specifications || [];
                    productToEdit.boxContents = productToEdit.boxContents || [];
                    setFormData({ ...formData, ...productToEdit, category: productToEdit.category?._id });
                }
            } catch (error) {
                toast.error(error.message);
                setError(error.message);
            } finally {
                setLoading(false);
            }
        };
        if (authToken) fetchInitialData();
    }, [productId, isNewProduct, authToken, location.state]);

    useEffect(() => {
        const cost = parseFloat(formData.costPrice) || 0;
        const margin = parseFloat(formData.profitMargin) || 0;
        setFormData(prev => ({ ...prev, salePrice: cost * (1 + margin / 100) }));
    }, [formData.costPrice, formData.profitMargin]);

    const handleChange = (e) => {
        const { name, value, type, checked } = e.target;
        setFormData(prev => ({ ...prev, [name]: type === 'checkbox' ? checked : value }));
    };

    const handleFileChange = (e) => {
        if (e.target.files) {
            // Filter out files that might already be selected to avoid duplicates
            const newFiles = Array.from(e.target.files);
            setNewImageFiles(prevFiles => [...prevFiles, ...newFiles]);
        }
    };

    const handleRemoveImage = (image) => {
        // If it's a string, it's an existing image URL from the server
        if (typeof image === 'string') {
            setFormData(prev => ({ ...prev, images: prev.images.filter(img => img !== image) }));
        } else {
            // If it's an object, it's a new File object to be uploaded
            setNewImageFiles(prevFiles => prevFiles.filter(file => file !== image));
        }
    };

    const handleDynamicChange = (e, index, field, listName) => {
        const updatedList = [...formData[listName]];
        updatedList[index][field] = e.target.value;
        setFormData(prev => ({ ...prev, [listName]: updatedList }));
    };

    const handleAddRow = (listName, newRowObject) => {
        setFormData(prev => ({ ...prev, [listName]: [...prev[listName], newRowObject] }));
    };

    const handleRemoveRow = (index, listName) => {
        const updatedList = [...formData[listName]];
        updatedList.splice(index, 1);
        setFormData(prev => ({ ...prev, [listName]: updatedList }));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (loading) return;
        
        setLoading(true);
        
        try {
            const formDataToSend = new FormData();
            Object.keys(formData).forEach(key => {
                if (key === 'images') return;
                if (Array.isArray(formData[key]) && key !== 'components') {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key === 'components' && formData[key].length > 0) {
                    formDataToSend.append(key, JSON.stringify(formData[key]));
                } else if (key === 'isActive') {
                    formDataToSend.append(key, formData[key]);
                } else {
                    formDataToSend.append(key, formData[key]);
                }
            });
            
            // Add existing images if any
            if (Array.isArray(formData.images)) {
                formData.images.forEach(image => {
                    if (typeof image === 'string') {
                        formDataToSend.append('existingImages', image);
                    }
                });
            }
            
            // Add new files to upload
            newImageFiles.forEach(file => {
                formDataToSend.append('images', file);
            });
            
            let response;
            let url;
            
            // URL sorunlarını önlemek için direk URL tanımlayalım
            // Burada API_BASE_URL'i kullanmak yerine, URL'i manuel oluşturuyoruz
            const baseServerUrl = 'https://b2bsitesibitmis.onrender.com';
            
            if (productId) {
                url = `${baseServerUrl}/api/products/${productId}`;
                console.log('Product update URL:', url);
                response = await fetch(url, {
                    method: 'PUT',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: formDataToSend
                });
            } else {
                url = `${baseServerUrl}/api/products`;
                console.log('Product create URL:', url);
                response = await fetch(url, {
                    method: 'POST',
                    headers: { 'Authorization': `Bearer ${authToken}` },
                    body: formDataToSend
                });
            }

            const data = await response.json();
            if (!response.ok) throw new Error(data.msg || 'İşlem başarısız.');
            toast.success(`Ürün başarıyla ${isNewProduct ? 'oluşturuldu' : 'güncellendi'}.`);
            navigate('/admin/products');
        } catch (err) {
            toast.error(err.message);
        } finally {
            setLoading(false);
        }
    };

    if (loading) return <div>Yükleniyor...</div>;
    if (error) return <div className="error-container">Hata: {error}.</div>;

    return (
        <div className="admin-page-container">
            <button onClick={() => navigate('/admin/products')} className="back-btn"> &larr; Satış Ürünleri Listesine Dön</button>
            <h1>{isNewProduct ? 'Yeni Satış Ürünü Ekle' : 'Ürünü Düzenle'}</h1>
            <form onSubmit={handleSubmit} className="admin-form">
                <div className="form-section">
                    <h3>Temel Bilgiler</h3>
                    <div className="form-group">
                        <label>Ürün Resimleri</label>
                        <div className="image-previews">
                            {/* Display existing images */}
                            {formData.images.map((img, index) => (
                                <div key={`existing-${index}`} className="image-preview-item">
                                    <img src={img} alt={`Mevcut Resim ${index + 1}`} />
                                    <button type="button" onClick={() => handleRemoveImage(img)} className="delete-img-btn">X</button>
                                </div>
                            ))}
                            {/* Display new images selected for upload */}
                            {newImageFiles.map((file, index) => (
                                <div key={`new-${index}`} className="image-preview-item">
                                    <img src={URL.createObjectURL(file)} alt={`Yeni Resim ${index + 1}`} />
                                    <button type="button" onClick={() => handleRemoveImage(file)} className="delete-img-btn">X</button>
                                </div>
                            ))}
                        </div>
                        <input type="file" multiple onChange={handleFileChange} className="file-input" accept="image/*" />
                    </div>
                    <div className="form-grid">
                        <div className="form-group"> <label>Ürün Adı</label> <input type="text" name="name" value={formData.name} onChange={handleChange} required /> </div>
                        <div className="form-group"> <label>Kategori</label> <select name="category" value={formData.category} onChange={handleChange} required> <option value="">Kategori Seçiniz</option> {categories.map(cat => <option key={cat._id} value={cat._id}>{cat.name}</option>)} </select> </div>
                        <div className="form-group"> <label>Stok Kodu (SKU)</label> <input type="text" name="sku" value={formData.sku} onChange={handleChange} /> </div>
                        <div className="form-group"> <label>Garanti Süresi</label> <input type="text" name="warrantyPeriod" value={formData.warrantyPeriod} onChange={handleChange} /> </div>
                        <div className="form-group grid-span-2"> <label>Açıklama</label> <textarea name="description" value={formData.description} onChange={handleChange} rows="5" required></textarea> </div>
                    </div>
                </div>
                <div className="form-section">
                    <h3>Teknik Özellikler</h3>
                    {formData.specifications.map((spec, index) => (
                        <div key={index} className="dynamic-form-row">
                            {/* === DÜZELTME: required özelliği eklendi === */}
                            <input type="text" placeholder="Özellik Adı (örn: Renk)" value={spec.key} onChange={(e) => handleDynamicChange(e, index, 'key', 'specifications')} required />
                            <input type="text" placeholder="Özellik Değeri (örn: Siyah)" value={spec.value} onChange={(e) => handleDynamicChange(e, index, 'value', 'specifications')} required />
                            <button type="button" onClick={() => handleRemoveRow(index, 'specifications')} className="remove-row-btn">Sil</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => handleAddRow('specifications', { key: '', value: '' })} className="add-row-btn">Özellik Ekle</button>
                </div>
                <div className="form-section">
                    <h3>Kutu İçeriği</h3>
                    {formData.boxContents.map((content, index) => (
                         <div key={index} className="dynamic-form-row">
                             {/* === DÜZELTME: required özelliği eklendi === */}
                            <input type="text" placeholder="Ürün (örn: Tepe Duşu)" value={content.item} onChange={(e) => handleDynamicChange(e, index, 'item', 'boxContents')} required />
                            <input type="number" placeholder="Adet" value={content.quantity} onChange={(e) => handleDynamicChange(e, index, 'quantity', 'boxContents')} style={{maxWidth: '100px'}} required />
                            <button type="button" onClick={() => handleRemoveRow(index, 'boxContents')} className="remove-row-btn">Sil</button>
                        </div>
                    ))}
                    <button type="button" onClick={() => handleAddRow('boxContents', { item: '', quantity: 1 })} className="add-row-btn">Kutu İçeriği Ekle</button>
                </div>
                <div className="form-section">
                    <h3>Fiyatlandırma ve Stok</h3>
                    <div className="form-grid">
                        <div className="form-group"> <label>Maliyet Fiyatı (TL)</label> <input type="number" name="costPrice" value={formData.costPrice} onChange={handleChange} required /> </div>
                        <div className="form-group"> <label>Kâr Marjı (%)</label> <input type="number" name="profitMargin" value={formData.profitMargin} onChange={handleChange} /> </div>
                        <div className="form-group"> <label>Hesaplanan Satış Fiyatı (TL)</label> <input type="text" value={formData.salePrice.toFixed(2)} readOnly /> </div>
                        <div className="form-group"> <label>Stok Adedi</label> <input type="number" name="stock" value={formData.stock} onChange={handleChange} required /> </div>
                    </div>
                </div>
                <div className="form-group form-group-checkbox">
                    <label htmlFor="isActive">Satışta Aktif mi?</label>
                    <input type="checkbox" id="isActive" name="isActive" checked={formData.isActive} onChange={handleChange} />
                </div>
                <button type="submit" className="submit-btn" disabled={loading}>
                    {isNewProduct ? 'Ürünü Oluştur' : 'Değişiklikleri Kaydet'}
                </button>
            </form>
        </div>
    );
}

export default ProductEditPage;