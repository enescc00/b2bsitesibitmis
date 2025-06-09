import React, { useState, useEffect, useContext } from 'react';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminTable.css';

function ProductListPage() {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchProducts = async () => {
      try {
        setLoading(true);
        const response = await fetch('http://localhost:5001/api/products');
        const data = await response.json();
        if (!response.ok) throw new Error('Ürünler getirilemedi.');
        setProducts(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchProducts();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Bu ürünü silmek istediğinizden emin misiniz?')) {
        try {
            const response = await fetch(`http://localhost:5001/api/products/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if(!response.ok) throw new Error(data.msg || 'Ürün silinemedi.');
            setProducts(products.filter(p => p._id !== id));
        } catch (err) {
            setError(err.message);
        }
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Ürün Yönetimi</h1>
        <button onClick={() => navigate('/admin/product/new')} className="add-new-btn">Yeni Ürün Ekle</button>
      </div>
      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th>ID</th>
              <th>AD</th>
              <th>FİYAT</th>
              <th>STOK</th>
              <th>KATEGORİ</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {products.map(product => (
              <tr key={product._id}>
                <td>{product._id}</td>
                <td>{product.name}</td>
                <td>{product.price.toFixed(2)} ₺</td>
                <td>{product.stock}</td>
                <td>{product.category ? product.category.name : 'N/A'}</td>
                <td className="action-cell">
                  <button onClick={() => navigate(`/admin/product/${product._id}`)} className="edit-btn">Düzenle</button>
                  <button onClick={() => handleDelete(product._id)} className="delete-btn">Sil</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ProductListPage;