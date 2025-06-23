import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { Link } from 'react-router-dom';
import './ProductListPage.css'; // Add styles

function ProductListPage() {
  const { authToken } = useContext(AuthContext);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchProducts = async () => {
      if (!authToken) return;
      try {
        setLoading(true);
        const res = await fetch('/api/supplier/products', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.msg || 'Ürünler alınamadı.');
        }
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, [authToken]);

  if (loading) return <div className="loading-container">Ürünler yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="supplier-product-list">
      <div className="page-header">
        <h1>Ürünler</h1>
        <Link to="/supplier/product/new" className="btn btn-primary">
          <i className="fas fa-plus"></i> Yeni Ürün Ekle
        </Link>
      </div>
      <div className="table-container">
        <table className="product-table">
          <thead>
            <tr>
              <th>Ürün Adı</th>
              <th>Tedarikçi</th>
              <th>Fiyat</th>
              <th>Stok</th>
              <th>Durum</th>
            </tr>
          </thead>
          <tbody>
            {products.length > 0 ? (
              products.map((product) => (
                <tr key={product._id}>
                  <td>{product.name}</td>
                  <td>{product.supplier ? product.supplier.name : 'N/A'}</td>
                  <td>₺{product.salePrice?.toFixed(2) ?? '0.00'}</td>
                  <td>{product.stock}</td>
                  <td>
                    <span className={`status ${product.isActive ? 'status-active' : 'status-inactive'}`}>
                      {product.isActive ? 'Aktif' : 'Pasif'}
                    </span>
                  </td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="no-data">Gösterilecek ürün bulunamadı.</td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductListPage;
