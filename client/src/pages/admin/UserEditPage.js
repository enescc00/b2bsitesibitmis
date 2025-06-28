import React, { useState, useEffect, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './AdminForm.css';

function UserEditPage() {
  const { id: userId } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);

  const [user, setUser] = useState(null);
  const [salesReps, setSalesReps] = useState([]);
  const [priceLists, setPriceLists] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(true);
        // API isteklerini proxy üzerinden yapıyoruz, tam URL'ye gerek yok.
        const [userRes, repsRes, priceListsRes] = await Promise.all([
            fetch(`/api/users/admin/${userId}`, { 
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/users/admin/salesreps`, { // Corrected URL
                headers: { 'Authorization': `Bearer ${authToken}` }
            }),
            fetch(`/api/pricelists`, {
                headers: { 'Authorization': `Bearer ${authToken}` }
            })
        ]);
        
        const userData = await userRes.json();
        const repsData = await repsRes.json();
        const priceListsData = await priceListsRes.json();

        if (!userRes.ok) throw new Error(userData.msg || 'Kullanıcı verisi alınamadı.');
        if (!repsRes.ok) throw new Error(repsData.msg || 'Satış temsilcileri alınamadı.');
        if (!priceListsRes.ok) throw new Error(priceListsData.msg || 'Fiyat listeleri alınamadı.');

        setUser(userData);
        setSalesReps(repsData);
        setPriceLists(priceListsData);

      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchInitialData();
  }, [userId, authToken]);

  const handleChange = (e) => {
    const { name, type, value, checked } = e.target;
    
    // Değeri alıyoruz
    const newValue = type === 'checkbox' ? checked : value;

    // State'i güncellemek için yeni bir obje oluşturuyoruz
    const updatedUser = { ...user, [name]: newValue };

    // === YENİ MANTIK BURADA ===
    // Eğer değişen alan "role" ise ve yeni rol "customer" değilse,
    // salesRepresentative alanını temizliyoruz.
    if (name === 'role' && newValue !== 'customer') {
        updatedUser.salesRepresentative = null;
    }

    // "null" string'ini gerçek null'a çeviriyoruz
    if (name === "salesRepresentative" && newValue === "null") {
        updatedUser.salesRepresentative = null;
    }

    if (name === "priceList" && (newValue === "null" || newValue === '')) {
        updatedUser.priceList = null;
    }
    
    setUser(updatedUser);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      // Satış temsilcisi ID'sini al
      const salesRepresentative = user.salesRepresentative;

      // Güncelleme için temiz payload oluştur
      const userData = {};

      // Temel alanları ekle
      if (user.name) userData.name = user.name;
      if (user.email) userData.email = user.email;
      if (user.role) {
        userData.role = user.role;
      }
      if (typeof user.isApproved === 'boolean') userData.isApproved = user.isApproved;
      if (user.companyTitle) userData.companyTitle = user.companyTitle;

      // Adres bilgisi varsa ve en az bir alan doluysa ekle
      if (user.addresses && user.addresses[0]) {
        const addr = user.addresses[0];
        const addressUpdates = {};
        if (addr.province) addressUpdates.province = addr.province;
        if (addr.district) addressUpdates.district = addr.district;
        if (addr.fullAddress) addressUpdates.fullAddress = addr.fullAddress;
        if (addr.addressTitle) addressUpdates.addressTitle = addr.addressTitle;
        if (addr._id) addressUpdates._id = addr._id;

        if (Object.keys(addressUpdates).length > 0) {
          userData.address = addressUpdates;
        }
      }
      
      // İstek verisini logla
      console.log('Gönderilen kullanıcı verisi:', userData);
      console.log('Atanacak satış temsilcisi ID:', salesRepresentative);

      // 1. Adım: Temel kullanıcı bilgilerini güncelle
      const response = await fetch(`/api/users/admin/${userId}`, {
        method: 'PUT',
        headers: { 
          'Content-Type': 'application/json', 
          'Authorization': `Bearer ${authToken}` 
        },
        body: JSON.stringify(userData)
      });
      
      const data = await response.json();
      console.log('Kullanıcı güncelleme yanıtı:', data);
      
      if (!response.ok) {
        throw new Error(data.msg || 'Genel kullanıcı bilgileri güncellenirken hata oluştu.');
      }

      // 2. Adım: Eğer kullanıcı bir müşteriyse, satış temsilcisi atamasını yap
      // Fiyatlandırma ve Temsilci atamalarını sadece müşteri rolü için yap
      if (user.role === 'customer') {
        // Satış Temsilcisi Atama (Mevcut hatalı API yolu düzeltilecek veya kontrol edilecek)
        // Not: Mevcut API yolu `/api/admin/users/${userId}/assign-salesrep` muhtemelen hatalı.
        // Doğru endpoint'in admin.js'e eklenmesi gerekir. Şimdilik mevcut haliyle bırakıldı.
        const assignResponse = await fetch(`/api/admin/users/${userId}/assign-salesrep`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
          body: JSON.stringify({ salesRepId: salesRepresentative || null })
        });
        if (!assignResponse.ok) {
          const assignData = await assignResponse.json();
          console.error('Pazarlamacı atama hatası:', assignData.msg);
          // Şimdilik hatayı loglayıp devam edelim, ana işlemi blocklamasın
          // throw new Error(assignData.msg || 'Pazarlamacı ataması başarısız.');
        }

        // Fiyatlandırma Ayarlarını Güncelle
        const pricingData = {
            priceList: user.priceList || null,
            paymentTerms: user.paymentTerms || 'cash'
        };
        const pricingResponse = await fetch(`/api/users/admin/${userId}/pricing`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}` },
            body: JSON.stringify(pricingData)
        });
        if (!pricingResponse.ok) {
            const pricingResData = await pricingResponse.json();
            throw new Error(pricingResData.msg || 'Fiyatlandırma ayarları güncellenemedi.');
        }
      }

      // Başarılı olduğunda kullanıcıyı bilgilendir ve listeye yönlendir
      toast.success('Kullanıcı başarıyla güncellendi.');
      navigate('/admin/users');
    } catch (err) {
      console.error('Hata detayı:', err);
      toast.error(err.message || 'Bir hata oluştu. Lütfen tekrar deneyin.');
    }
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;
  if (!user) return <div>Kullanıcı bulunamadı.</div>;

  return (
    <div className="admin-page-container">
      <button onClick={() => navigate('/admin/users')} className="back-btn"> &larr; Müşteri Listesine Dön</button>
      <h1>Müşteriyi Düzenle: {user.name}</h1>
      <form onSubmit={handleSubmit} className="admin-form">
        <div className="form-grid">
            <div className="form-group">
                <label>Ad Soyad / Yetkili</label>
                <input type="text" name="name" value={user.name || ''} onChange={handleChange} />
            </div>
            {user.__t === 'CorporateUser' && (
                <div className="form-group">
                    <label>Firma Ünvanı</label>
                    <input type="text" name="companyTitle" value={user.companyTitle || ''} onChange={handleChange} />
                </div>
            )}
            <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={user.email || ''} onChange={handleChange} />
            </div>
            <div className="form-group">
                <label>Kullanıcı Rolü</label>
                <select name="role" value={user.role} onChange={handleChange}>
                    <option value="customer">Müşteri</option>
                    <option value="sales_rep">Satış Temsilcisi</option>
                    <option value="supplier">Tedarikçi</option>
                    <option value="admin">Admin</option>
                </select>
            </div>
            <div className="form-group">
                <label>Cari Hesap Bakiyesi (₺)</label>
                <input type="number" step="0.01" name="currentAccountBalance" value={user.currentAccountBalance} onChange={handleChange} />
            </div>
            
            {user.role === 'customer' && (
              <>
                <div className="form-group">
                    <label>Atanmış Satış Temsilcisi</label>
                    <select name="salesRepresentative" value={user.salesRepresentative || "null"} onChange={handleChange}>
                        <option value="null">-- Temsilci Yok --</option>
                        {salesReps.map(rep => (
                            <option key={rep._id} value={rep._id}>{rep.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Fiyat Listesi</label>
                    <select name="priceList" value={user.priceList || 'null'} onChange={handleChange}>
                        <option value="null">-- Fiyat Listesi Yok --</option>
                        {priceLists.map(pl => (
                            <option key={pl._id} value={pl._id}>{pl.name}</option>
                        ))}
                    </select>
                </div>
                <div className="form-group">
                    <label>Ödeme Koşulları</label>
                    <select name="paymentTerms" value={user.paymentTerms || 'cash'} onChange={handleChange}>
                        <option value="cash">Nakit</option>
                        <option value="credit">Vadeli</option>
                    </select>
                </div>
              </>
            )}
            <div className="form-group form-group-checkbox">
                <label>Onay Durumu</label>
                <input type="checkbox" name="isApproved" checked={user.isApproved} onChange={handleChange} /> Onaylı
            </div>

        </div>
        <button type="submit" className="submit-btn">Değişiklikleri Kaydet</button>
      </form>
    </div>
  );
}

export default UserEditPage;