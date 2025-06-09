import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import './AdminForm.css';

function UserEditPage() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUser = async () => {
      try {
        // === DEĞİŞİKLİK BURADA: Adresin başına sunucu adresini ekledik ===
        const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Kullanıcı verisi alınamadı.');
        setUser(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchUser();
  }, [userId, authToken]);

  const handleChange = (e) => {
    setUser({ ...user, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
        // === DEĞİŞİKLİK BURADA: Adresin başına sunucu adresini ekledik ===
        const response = await fetch(`http://localhost:5001/api/users/${userId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(user)
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Güncelleme başarısız.');
        setSuccess('Kullanıcı başarıyla güncellendi.');
    } catch (err) {
        setError(err.message);
    }
  };

  if (loading) return <div>Yükleniyor...</div>;
  if (error) return <div>Hata: {error}</div>;
  if (!user) return <div>Kullanıcı bulunamadı.</div>;

  return (
    <div className="admin-page-container">
      <button onClick={() => navigate('/admin/users')} className="back-btn"> &larr; Müşteri Listesine Dön</button>
      <h1>Müşteriyi Düzenle</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        {success && <p className="success-message">{success}</p>}
        {error && !success && <p className="error-message">{error}</p>}
        
        <div className="form-grid">
            <div className="form-group">
                <label>Ad Soyad / Yetkili</label>
                <input type="text" name="name" value={user.name} onChange={handleChange} />
            </div>
            {user.__t === 'CorporateUser' && (
                <div className="form-group">
                    <label>Firma Ünvanı</label>
                    <input type="text" name="companyTitle" value={user.companyTitle} onChange={handleChange} />
                </div>
            )}
            <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={user.email} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Kullanıcı Rolü</label>
                <select name="role" value={user.role} onChange={handleChange}>
                    <option value="customer">Customer</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="form-group">
                <label>Cari Hesap Bakiyesi (₺)</label>
                <input type="number" step="0.01" name="currentAccountBalance" value={user.currentAccountBalance} onChange={handleChange} />
            </div>
        </div>
        <button type="submit" className="submit-btn">Değişiklikleri Kaydet</button>
      </form>
    </div>
  );
}

export default UserEditPage;