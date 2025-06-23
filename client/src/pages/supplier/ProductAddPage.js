import React, { useState, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './ProductAddPage.css';

function ProductAddPage() {
    const { authToken } = useContext(AuthContext);
    const navigate = useNavigate();
    
    const [formData, setFormData] = useState({
        name: '',
        salePrice: '',
        stock: '',
        description: '',
    });
    const [images, setImages] = useState([]);
    const [loading, setLoading] = useState(false);

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleImageChange = (e) => {
        setImages([...e.target.files]);
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setLoading(true);

        const postData = new FormData();
        Object.keys(formData).forEach(key => {
            postData.append(key, formData[key]);
        });
        images.forEach(image => {
            postData.append('images', image);
        });

        try {
            const res = await fetch('/api/supplier/products', {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${authToken}`
                },
                body: postData,
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.msg || 'Ürün oluşturulamadı.');
            }

            toast.success('Ürün başarıyla oluşturuldu!');
            navigate('/supplier/products');

        } catch (error) {
            toast.error(error.message);
        } finally {
            setLoading(false);
        }
    };

    return (
        <div className="product-add-page">
            <h1>Yeni Ürün Ekle</h1>
            <form onSubmit={handleSubmit} className="product-form">
                <div className="form-group">
                    <label htmlFor="name">Ürün Adı *</label>
                    <input type="text" id="name" name="name" value={formData.name} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="salePrice">Satış Fiyatı *</label>
                    <input type="number" id="salePrice" name="salePrice" value={formData.salePrice} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="stock">Stok Adedi *</label>
                    <input type="number" id="stock" name="stock" value={formData.stock} onChange={handleChange} required />
                </div>
                <div className="form-group">
                    <label htmlFor="description">Açıklama</label>
                    <textarea id="description" name="description" value={formData.description} onChange={handleChange}></textarea>
                </div>
                <div className="form-group">
                    <label htmlFor="images">Ürün Resimleri</label>
                    <input type="file" id="images" name="images" onChange={handleImageChange} multiple />
                </div>
                <button type="submit" className="btn btn-primary" disabled={loading}>
                    {loading ? 'Kaydediliyor...' : 'Ürünü Kaydet'}
                </button>
            </form>
        </div>
    );
}

export default ProductAddPage;
