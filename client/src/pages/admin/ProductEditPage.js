import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminForm.css';

function ProductEditPage() {
  const { id: productId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [productData, setProductData] = useState({
    name: '', price: 0, image: '', description: '', category: '', stock: 0
  });
  
  const [categories, setCategories] = useState([]);
  const [uploading, setUploading] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isNewProduct = !productId;

  // 1. useEffect: Sadece kategorileri çekmek için
  useEffect(() => {
    const fetchCategories = async () => {
      try {
        const res = await fetch('http://localhost:5001/api/categories');
        const data = await res.json();
        if (!res.ok) throw new Error('Kategoriler yüklenemedi.');
        setCategories(data);
      } catch (err) {
        setError(err.message);
        console.error(err);
      }
    };
    fetchCategories();
  }, []);

  // 2. useEffect: Ürün bilgilerini çekmek veya yeni ürün formunu hazırlamak için
  useEffect(() => {
    const fetchProduct = async () => {
      try {
        setLoading(true);
        const res = await fetch(`http://localhost:5001/api/products/${productId}`);
        const fetchedProductData = await res.json();
        if (!res.ok) throw new Error(fetchedProductData.msg || 'Ürün bilgileri bulunamadı.');
        
        setProductData({
          name: fetchedProductData.name || '',
          price: fetchedProductData.price || 0,
          image: fetchedProductData.image || '',
          description: fetchedProductData.description || '',
          category: fetchedProductData.category?._id || '', // Kategori ID'sini al
          stock: fetchedProductData.stock || 0
        });
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };

    if (isNewProduct) {
      // Yeni ürün ise, formu boşalt ve kategoriler yüklendiyse ilkini seç
      setProductData({
        name: '', price: 0, image: '', description: '', 
        category: categories.length > 0 ? categories[0]._id : '', 
        stock: 0
      });
      setLoading(false);
    } else {
      // Mevcut ürün ise, bilgilerini çek
      fetchProduct();
    }
  }, [productId, isNewProduct, categories]); // Artık 'categories' yüklendiğinde de tetiklenir


  const handleChange = (e) => {
    setProductData({ ...productData, [e.target.name]: e.target.value });
  };
  
  const uploadFileHandler = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const formData = new FormData();
    formData.append('image', file);
    setUploading(true);
    setError('');
    try {
        const config = { method: 'POST', headers: { 'Authorization': `Bearer ${authToken}` }, body: formData };
        const response = await fetch('http://localhost:5001/api/upload', config);
        const data = await response.json();
        if (!response.ok) throw new Error(data.message || 'Resim yüklenemedi.');
        setProductData({ ...productData, image: data.image });
    } catch (err) {
        setError(err.message);
    } finally {
        setUploading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 
    setSuccess('');

    const url = isNewProduct ? 'http://localhost:5001/api/products' : `http://localhost:5001/api/products/${productId}`;
    const method = isNewProduct ? 'POST' : 'PUT';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(productData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'İşlem başarısız.');
        setSuccess(`Ürün başarıyla ${isNewProduct ? 'oluşturuldu' : 'güncellendi'}.`);
        if (isNewProduct) {
          navigate(`/admin/product/${data._id}`);
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="admin-page-container"><div className="error-message">Hata: {error}</div></div>;

  return (
    <div className="admin-page-container">
      <button onClick={() => navigate('/admin/products')} className="back-btn"> &larr; Ürün Listesine Dön</button>
      <h1>{isNewProduct ? 'Yeni Ürün Ekle' : 'Ürünü Düzenle'}</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        {success && <p className="success-message">{success}</p>}
        {error && !success && <p className="error-message">{error}</p>}
        <div className="form-grid">
            <div className="form-group grid-span-2">
                <label htmlFor="name">Ürün Adı</label>
                <input type="text" id="name" name="name" value={productData.name} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="price">Fiyat (₺)</label>
                <input type="number" id="price" name="price" step="0.01" value={productData.price} onChange={handleChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="stock">Stok Adedi</label>
                <input type="number" id="stock" name="stock" value={productData.stock} onChange={handleChange} required />
            </div>
            <div className="form-group grid-span-2">
                <label htmlFor="image-file-input">Ürün Görseli</label>
                {productData.image && <img src={`http://localhost:5001${productData.image}`} alt={productData.name} className="image-preview" />}
                <input type="text" id="image" name="image" placeholder="Görsel yolu" value={productData.image} onChange={handleChange} required />
                <input type="file" id="image-file-input" onChange={uploadFileHandler} className="file-input"/>
                {uploading && <p>Yükleniyor...</p>}
            </div>
            <div className="form-group grid-span-2">
                <label htmlFor="category">Kategori</label>
                <select id="category" name="category" value={productData.category} onChange={handleChange} required>
                    <option value="">Kategori Seçiniz</option>
                    {categories.map(cat => (
                        <option key={cat._id} value={cat._id}>{cat.name}</option>
                    ))}
                </select>
            </div>
             <div className="form-group grid-span-2">
                <label htmlFor="description">Açıklama</label>
                <textarea id="description" name="description" rows="5" value={productData.description} onChange={handleChange} required></textarea>
            </div>
        </div>
        <button type="submit" className="submit-btn" disabled={loading || uploading}>
            {loading || uploading ? 'Kaydediliyor...' : (isNewProduct ? 'Ürünü Oluştur' : 'Değişiklikleri Kaydet')}
        </button>
      </form>
    </div>
  );
}

export default ProductEditPage;