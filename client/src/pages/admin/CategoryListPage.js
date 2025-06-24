import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminTable.css';

function CategoryListPage() {
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const { authToken } = useContext(AuthContext);
  const navigate = useNavigate();

  useEffect(() => {
    const fetchCategories = async () => {
      try {
        setLoading(true);
        // DOĞRU API İSTEĞİ: /api/categories
        const response = await fetch(`${API_BASE_URL}/api/categories`);
        const data = await response.json();
        if (!response.ok) {
          throw new Error(data.msg || 'Kategoriler getirilemedi.');
        }
        setCategories(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchCategories();
  }, []);

  const handleDelete = async (id) => {
    if (window.confirm('Bu kategoriyi silmek istediğinizden emin misiniz? Bu kategoriye bağlı ürünler varsa sorun yaşanabilir.')) {
        try {
            const response = await fetch(`${API_BASE_URL}/api/categories/${id}`, {
                method: 'DELETE',
                headers: { 'Authorization': `Bearer ${authToken}` }
            });
            const data = await response.json();
            if(!response.ok) {
              throw new Error(data.msg || 'Kategori silinemedi.');
            }
            setCategories(categories.filter(c => c._id !== id));
        } catch (err) {
            alert(`Hata: ${err.message}`);
        }
    }
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="admin-page-container">
      <div className="admin-page-header">
        <h1>Kategori Yönetimi</h1>
        <button onClick={() => navigate('/admin/category/new')} className="add-new-btn">Yeni Kategori Ekle</button>
      </div>
      
      {categories.length > 0 ? (
        <div className="admin-table-container">
            <table className="admin-table">
            <thead>
                <tr>
                <th>ID</th>
                <th>Kategori Adı</th>
                <th>Oluşturulma Tarihi</th>
                <th></th>
                </tr>
            </thead>
            <tbody>
                {categories.map(category => (
                <tr key={category._id}>
                    <td>{category._id}</td>
                    <td>{category.name}</td>
                    <td>{new Date(category.createdAt).toLocaleDateString('tr-TR')}</td>
                    <td className="action-cell">
                    <button onClick={() => navigate(`/admin/category/${category._id}`)} className="edit-btn">Düzenle</button>
                    <button onClick={() => handleDelete(category._id)} className="delete-btn">Sil</button>
                    </td>
                </tr>
                ))}
            </tbody>
            </table>
        </div>
      ) : (
        // DOĞRU MESAJ
        <div className="empty-orders">
            <p>Sistemde kayıtlı kategori bulunamadı. Yeni bir tane ekleyebilirsiniz.</p>
        </div>
      )}
    </div>
  );
}

export default CategoryListPage;