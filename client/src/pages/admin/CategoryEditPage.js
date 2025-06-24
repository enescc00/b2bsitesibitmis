import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config/api';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminForm.css';

function CategoryEditPage() {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [name, setName] = useState('');
  // === YENİ STATE'LER ===
  const [parent, setParent] = useState(null); // Seçilen üst kategoriyi tutar
  const [allCategories, setAllCategories] = useState([]); // Üst kategori dropdown'ı için

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const isNewCategory = !categoryId;

  useEffect(() => {
    setLoading(true);
    const fetchInitialData = async () => {
      try {
        // Dropdown için tüm kategorileri çek
        const resAll = await fetch(`${API_BASE_URL}/api/categories`, {
            headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const dataAll = await resAll.json();
        if(!resAll.ok) throw new Error("Kategoriler getirilemedi");
        setAllCategories(dataAll);

        // Eğer düzenleme modundaysak, mevcut kategorinin bilgilerini çek
        if (!isNewCategory) {
          const resCurrent = await fetch(`${API_BASE_URL}/api/categories/${categoryId}`, {
              headers: { 'Authorization': `Bearer ${authToken}` }
          });
          const dataCurrent = await resCurrent.json();
          if (!resCurrent.ok) throw new Error("Kategori bulunamadı");
          
          setName(dataCurrent.name);
          setParent(dataCurrent.parent || null); // Mevcut parent'ı ayarla
        }
      } catch(err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    
    if(authToken) {
        fetchInitialData();
    }
  }, [categoryId, isNewCategory, authToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 
    setSuccess('');

    const url = isNewCategory ? `${API_BASE_URL}/api/categories` : `${API_BASE_URL}/api/categories/${categoryId}`;
    const method = isNewCategory ? 'POST' : 'PUT';

    // === GÜNCELLEME: Gönderilen veriye "parent" alanı eklendi ===
    const bodyData = { name, parent: parent === "null" || parent === null ? null : parent };

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(bodyData)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.errors ? data.errors[0].msg : 'İşlem başarısız.');
        
        setSuccess(`Kategori başarıyla ${isNewCategory ? 'oluşturuldu' : 'güncellendi'}.`);
        
        if (isNewCategory) {
          setTimeout(() => navigate('/admin/categories'), 2000);
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };
  
  if (loading && !allCategories.length) return <div className="loading-container">Yükleniyor...</div>;

  return (
    <div className="admin-page-container">
      <button onClick={() => navigate('/admin/categories')} className="back-btn"> &larr; Kategori Listesine Dön</button>
      <h1>{isNewCategory ? 'Yeni Kategori Ekle' : 'Kategoriyi Düzenle'}</h1>
      <form onSubmit={handleSubmit} className="admin-form" style={{maxWidth: '600px', margin: '2rem auto'}}>
        {success && <p className="success-message">{success}</p>}
        {error && !success && <p className="error-message">{error}</p>}
        
        <div className="form-group">
            <label htmlFor="name">Kategori Adı</label>
            <input type="text" id="name" name="name" value={name} onChange={(e) => setName(e.target.value)} required />
        </div>

        {/* === YENİ ALAN: Üst Kategori Seçimi === */}
        <div className="form-group">
            <label htmlFor="parent">Üst Kategori (Boş bırakırsanız ana kategori olur)</label>
            <select id="parent" name="parent" value={parent || "null"} onChange={(e) => setParent(e.target.value)}>
                <option value="null">-- Ana Kategori --</option>
                {allCategories.map(cat => (
                    // Bir kategoriyi kendi kendisinin üst kategorisi yapmasını engelle
                    cat._id !== categoryId && <option key={cat._id} value={cat._id}>{cat.name}</option>
                ))}
            </select>
        </div>

        <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Kaydediliyor...' : (isNewCategory ? 'Kategoriyi Oluştur' : 'Değişiklikleri Kaydet')}
        </button>
      </form>
    </div>
  );
}

export default CategoryEditPage;