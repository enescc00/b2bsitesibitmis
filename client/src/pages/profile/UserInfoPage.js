import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AddressForm from '../../components/AddressForm';
import Modal from '../../components/Modal';
import { toast } from 'react-toastify';
import './UserInfoPage.css';

function UserInfoPage() {
  const { authToken } = useContext(AuthContext);

  const [profileData, setProfileData] = useState(null);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressTitle: 'Yeni Adres', province: '', district: '', fullAddress: '' });
  
  const [loading, setLoading] = useState(true);
  
  const fetchUserProfile = async () => {
      if (!authToken) return;
      setLoading(true);
      try {
        const response = await fetch('/api/users/profile', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Profil bilgileri alınamadı.');
        setProfileData(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };

  useEffect(() => {
    fetchUserProfile();
  }, [authToken]);

  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  
  const handleNewAddressChange = (e) => {
    const { name, value } = e.target;
    setNewAddress(prevState => ({
        ...prevState,
        [name]: value
    }));
  };

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.msg || 'Profil güncellenemedi.');
        toast.success('Profil bilgileri başarıyla güncellendi.');
        fetchUserProfile(); 
    } catch (err) {
        toast.error(err.message);
    }
  };
  
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        return toast.error('Yeni şifreler eşleşmiyor.');
    }
    try {
        const response = await fetch('/api/users/profile/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(passwordData)
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.msg || 'Şifre güncellenemedi.');
        toast.success('Şifre başarıyla güncellendi.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
        toast.error(err.message);
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    try {
        const response = await fetch('/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify({ address: newAddress })
        });
        const updatedUser = await response.json();
        if(!response.ok) throw new Error(updatedUser.msg || 'Adres eklenemedi.');
        
        setProfileData(updatedUser);
        toast.success('Yeni adres başarıyla eklendi.');
        setIsModalOpen(false);
        setNewAddress({ addressTitle: 'Yeni Adres', province: '', district: '', fullAddress: '' });
    } catch (err) {
        toast.error(err.message);
    }
  };

  if (loading) return <div className="loading-container">Bilgiler Yükleniyor...</div>;
  if (!profileData) return <div className="error-container">Profil bilgileri yüklenemedi.</div>;

  return (
    <>
      <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Adres Ekle">
          <AddressForm 
              addressData={newAddress}
              onAddressChange={handleNewAddressChange}
              onSubmit={handleAddNewAddress}
          />
      </Modal>

      <div className="user-info-page-content">
          <div className="info-section">
              <h3>Profil Bilgileri</h3>
              <form onSubmit={handleProfileUpdate} className="info-form">
                  <div className="form-group">
                      <label>Ad Soyad / Yetkili</label>
                      <input type="text" name="name" value={profileData.name || ''} onChange={handleProfileChange} />
                  </div>
                  <div className="form-group">
                      <label>Email Adresi</label>
                      <input type="email" name="email" value={profileData.email || ''} onChange={handleProfileChange} />
                  </div>
                  {profileData.__t === 'CorporateUser' && (
                      <div className="form-group">
                          <label>Firma Ünvanı</label>
                          <input type="text" name="companyTitle" value={profileData.companyTitle || ''} onChange={handleProfileChange} />
                      </div>
                  )}
                  <button type="submit" className="submit-btn">Bilgileri Güncelle</button>
              </form>
          </div>

          <div className="info-section">
              <h3>Adreslerim</h3>
              <div className="address-list">
                  {profileData.addresses && profileData.addresses.map((addr, index) => (
                      <div key={index} className="address-card">
                          <strong>{addr.addressTitle}</strong>
                          <p>{addr.fullAddress}</p>
                          <p>{addr.district}, {addr.province}</p>
                      </div>
                  ))}
              </div>
              <button className="add-address-btn" onClick={() => setIsModalOpen(true)}>Yeni Adres Ekle</button>
          </div>

          <div className="info-section">
              <h3>Şifre Değiştir</h3>
              <form onSubmit={handlePasswordUpdate} className="info-form">
                  <div className="form-group">
                      <label>Mevcut Şifre</label>
                      <input type="password" name="currentPassword" value={passwordData.currentPassword} onChange={handlePasswordChange} required />
                  </div>
                  <div className="form-group">
                      <label>Yeni Şifre</label>
                      <input type="password" name="newPassword" value={passwordData.newPassword} onChange={handlePasswordChange} required />
                  </div>
                  <div className="form-group">
                      <label>Yeni Şifre (Tekrar)</label>
                      <input type="password" name="confirmNewPassword" value={passwordData.confirmNewPassword} onChange={handlePasswordChange} required />
                  </div>
                  <button type="submit" className="submit-btn">Şifreyi Değiştir</button>
              </form>
          </div>
      </div>
    </>
  );
}

export default UserInfoPage;