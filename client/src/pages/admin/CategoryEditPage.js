import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminForm.css';

function CategoryEditPage() {
  const { id: categoryId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  // 'new' kelimesiyle değil, categoryId'nin var olup olmamasıyla kontrol ediyoruz.
  const isNewCategory = !categoryId;

  useEffect(() => {
    // Sadece mevcut bir kategoriyi düzenliyorsak (yani yeni değilse) veri çek
    if (!isNewCategory) {
      setLoading(true);
      const fetchCategory = async () => {
        try {
          const res = await fetch(`http://localhost:5001/api/categories/${categoryId}`, {
              headers: { 'Authorization': `Bearer ${authToken}` }
          });
          
          if (!res.ok) {
            const errorData = await res.json();
            throw new Error(errorData.msg || "Kategori bulunamadı");
          }

          const data = await res.json();
          setName(data.name);

        } catch(err) {
          setError(err.message);
        } finally {
          setLoading(false);
        }
      };
      fetchCategory();
    }
  }, [categoryId, isNewCategory, authToken]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError(''); 
    setSuccess('');

    // "new" durumunu URL'den değil, `isNewCategory` değişkeninden kontrol et
    const url = isNewCategory ? 'http://localhost:5001/api/categories' : `http://localhost:5001/api/categories/${categoryId}`;
    const method = isNewCategory ? 'POST' : 'PUT';

    try {
        const response = await fetch(url, {
            method: method,
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify({ name })
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'İşlem başarısız.');
        
        setSuccess(`Kategori başarıyla ${isNewCategory ? 'oluşturuldu' : 'güncellendi'}.`);
        
        // Yeni kategori oluşturulduysa 2 saniye sonra listeye geri dön
        if (isNewCategory) {
          setTimeout(() => navigate('/admin/categories'), 2000);
        }
    } catch (err) {
        setError(err.message);
    } finally {
        setLoading(false);
    }
  };
  
  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error && !isNewCategory) return <div className="error-container">Hata: {error}</div>;

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
        <button type="submit" className="submit-btn" disabled={loading}>
            {loading ? 'Kaydediliyor...' : (isNewCategory ? 'Kategoriyi Oluştur' : 'Değişiklikleri Kaydet')}
        </button>
      </form>
    </div>
  );
}

export default CategoryEditPage;