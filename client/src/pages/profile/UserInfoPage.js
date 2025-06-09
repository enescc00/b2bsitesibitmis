import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import AddressForm from '../../components/AddressForm';
import Modal from '../../components/Modal';
import './UserInfoPage.css';

function UserInfoPage() {
  const { user, authToken } = useContext(AuthContext);

  const [activeTab, setActiveTab] = useState('profile');
  const [profileData, setProfileData] = useState(null);
  const [passwordData, setPasswordData] = useState({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
  
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [newAddress, setNewAddress] = useState({ addressTitle: 'Yeni Adres', province: '', district: '', fullAddress: '' });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  useEffect(() => {
    const fetchUserProfile = async () => {
      setLoading(true);
      try {
        const response = await fetch('http://localhost:5001/api/users/profile', {
          headers: { 'Authorization': `Bearer ${authToken}` }
        });
        const data = await response.json();
        if (!response.ok) throw new Error(data.msg || 'Profil bilgileri alınamadı.');
        setProfileData(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    if (authToken) fetchUserProfile();
  }, [authToken]);

  const handleProfileChange = (e) => setProfileData({ ...profileData, [e.target.name]: e.target.value });
  const handlePasswordChange = (e) => setPasswordData({ ...passwordData, [e.target.name]: e.target.value });
  const handleNewAddressChange = (e) => setNewAddress({ ...newAddress, [e.target.name]: e.target.value });

  const handleProfileUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
        const response = await fetch('http://localhost:5001/api/users/profile', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(profileData)
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.msg || 'Profil güncellenemedi.');
        setSuccess('Profil bilgileri başarıyla güncellendi.');
    } catch (err) {
        setError(err.message);
    }
  };
  
  const handlePasswordUpdate = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    if (passwordData.newPassword !== passwordData.confirmNewPassword) {
        return setError('Yeni şifreler eşleşmiyor.');
    }
    try {
        const response = await fetch('http://localhost:5001/api/users/profile/password', {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(passwordData)
        });
        const data = await response.json();
        if(!response.ok) throw new Error(data.msg || 'Şifre güncellenemedi.');
        setSuccess('Şifre başarıyla güncellendi.');
        setPasswordData({ currentPassword: '', newPassword: '', confirmNewPassword: '' });
    } catch (err) {
        setError(err.message);
    }
  };

  const handleAddNewAddress = async (e) => {
    e.preventDefault();
    setError(''); setSuccess('');
    try {
        const response = await fetch('http://localhost:5001/api/users/add-address', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${authToken}`},
            body: JSON.stringify(newAddress)
        });
        const updatedAddresses = await response.json();
        if(!response.ok) throw new Error(updatedAddresses.msg || 'Adres eklenemedi.');
        
        setProfileData({...profileData, addresses: updatedAddresses});
        setSuccess('Yeni adres başarıyla eklendi.');
        setIsModalOpen(false);
        setNewAddress({ addressTitle: 'Yeni Adres', province: '', district: '', fullAddress: '' });
    } catch (err) {
        setError(err.message);
    }
  };

  if (loading) return <div className="loading-container">Bilgiler Yükleniyor...</div>;
  if (error && !profileData) return <div className="error-container">Hata: {error}</div>;
  if (!profileData) return null;

  return (
    <>
    <Modal show={isModalOpen} onClose={() => setIsModalOpen(false)} title="Yeni Adres Ekle">
        <AddressForm 
            addressData={newAddress}
            onAddressChange={handleNewAddressChange}
            onSubmit={handleAddNewAddress}
        />
    </Modal>
    <div className="user-info-page">
      <h1>Hesabım</h1>
      
      <div className="profile-tabs">
          <button className={activeTab === 'profile' ? 'active' : ''} onClick={() => setActiveTab('profile')}>Üyelik Bilgileri</button>
          <button className={activeTab === 'addresses' ? 'active' : ''} onClick={() => setActiveTab('addresses')}>Adreslerim</button>
          <button className={activeTab === 'password' ? 'active' : ''} onClick={() => setActiveTab('password')}>Şifre Güncelleme</button>
      </div>

      <div className="profile-content">
        {success && <p className="success-message">{success}</p>}
        {error && !success && <p className="error-message">{error}</p>}

        {activeTab === 'profile' && (
            <form onSubmit={handleProfileUpdate} className="info-form single-form">
                <h3>Profil Bilgileri</h3>
                <div className="form-group">
                    <label>Ad Soyad / Yetkili</label>
                    <input type="text" name="name" value={profileData.name} onChange={handleProfileChange} />
                </div>
                <div className="form-group">
                    <label>Email Adresi</label>
                    <input type="email" name="email" value={profileData.email} onChange={handleProfileChange} />
                </div>
                {profileData.__t === 'CorporateUser' && (
                    <div className="form-group">
                        <label>Firma Ünvanı</label>
                        <input type="text" name="companyTitle" value={profileData.companyTitle} onChange={handleProfileChange} />
                    </div>
                )}
                 <button type="submit" className="submit-btn">Bilgileri Güncelle</button>
            </form>
        )}

        {activeTab === 'addresses' && (
            <div className="address-tab">
                <h3>Adreslerim</h3>
                <div className="address-list">
                    {profileData.addresses.map((addr, index) => (
                        <div key={index} className="address-card">
                            <strong>{addr.addressTitle}</strong>
                            <p>{addr.fullAddress}</p>
                            <p>{addr.district}, {addr.province}</p>
                        </div>
                    ))}
                </div>
                <button className="add-address-btn" onClick={() => setIsModalOpen(true)}>Yeni Adres Ekle</button>
            </div>
        )}

        {activeTab === 'password' && (
            <form onSubmit={handlePasswordUpdate} className="info-form single-form">
                <h3>Şifre Değiştir</h3>
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
        )}
      </div>
    </div>
    </>
  );
}

export default UserInfoPage;