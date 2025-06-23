import React, { useState, useEffect } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { toast } from 'react-toastify';
import './Form.css';
import cityData from '../data/turkey-provinces-districts.json';

// === DEĞİŞİKLİK BURADA: Bileşenleri ana fonksiyonun DIŞINA taşıdık ===

// Bireysel kullanıcı için form alanları bileşeni
const BireyselFields = ({ formData, onChange }) => (
  <div className="form-grid">
    <div className="form-group grid-span-2">
      <label htmlFor="name">Ad Soyad</label>
      <input type="text" id="name" name="name" value={formData.name} onChange={onChange} required />
    </div>
    <div className="form-group">
      <label htmlFor="tcKimlik">TC Kimlik Numarası</label>
      <input type="text" id="tcKimlik" name="tcKimlik" value={formData.tcKimlik} onChange={onChange} required />
    </div>
    <div className="form-group">
      <label htmlFor="taxOffice">Vergi Dairesi</label>
      <input type="text" id="taxOffice" name="taxOffice" value={formData.taxOffice} onChange={onChange} required />
    </div>
  </div>
);

// Kurumsal kullanıcı için form alanları bileşeni
const KurumsalFields = ({ formData, onChange }) => (
  <div className="form-grid">
    <div className="form-group grid-span-2">
      <label htmlFor="companyTitle">Firma Ünvanı</label>
      <input type="text" id="companyTitle" name="companyTitle" value={formData.companyTitle} onChange={onChange} required />
    </div>
    <div className="form-group grid-span-2">
      <label htmlFor="name">Yetkili Adı Soyadı</label>
      <input type="text" id="name" name="name" value={formData.name} onChange={onChange} required />
    </div>
    <div className="form-group">
      <label htmlFor="taxNumber">Vergi Numarası</label>
      <input type="text" id="taxNumber" name="taxNumber" value={formData.taxNumber} onChange={onChange} required />
    </div>
    <div className="form-group">
      <label htmlFor="taxOffice">Vergi Dairesi</label>
      <input type="text" id="taxOffice" name="taxOffice" value={formData.taxOffice} onChange={onChange} required />
    </div>
  </div>
);


// Ana Kayıt Sayfası Bileşeni
function RegisterPage() {
  const [userType, setUserType] = useState('bireysel');
  const [formData, setFormData] = useState({
    name: '', email: '', password: '', tcKimlik: '', companyTitle: '',
    taxNumber: '', taxOffice: '', province: '', district: '', fullAddress: ''
  });
  const [districts, setDistricts] = useState([]);
  const navigate = useNavigate();

  const handleProvinceChange = (e) => {
    const selectedProvince = e.target.value;
    setFormData({ ...formData, province: selectedProvince, district: '' });
    const provinceData = cityData.find(p => p.il === selectedProvince);
    setDistricts(provinceData ? provinceData.ilceleri : []);
  };

  const onChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    const submissionData = {
      userType,
      name: formData.name,
      email: formData.email,
      password: formData.password,
      address: {
        province: formData.province,
        district: formData.district,
        fullAddress: formData.fullAddress
      },
      taxOffice: formData.taxOffice,
      tcKimlik: formData.tcKimlik,
      companyTitle: formData.companyTitle,
      taxNumber: formData.taxNumber
    };

    try {
      const response = await fetch('/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) {
        // Gelen hata bir dizi ise, tüm mesajları göster
        if (data.errors) {
            const errorMsg = data.errors.map(err => err.msg).join('\n');
            throw new Error(errorMsg);
        }
        throw new Error(data.msg || 'Kayıt işlemi başarısız.');
      }
      
      toast.success('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      toast.error(err.message);
    }
  };

  return (
    <div className="form-container">
      <form onSubmit={handleSubmit} className="auth-form">
        <h2>Yeni Müşteri Kaydı</h2>
        <div className="user-type-selector">
          <label>
            <input type="radio" value="bireysel" checked={userType === 'bireysel'} onChange={(e) => setUserType(e.target.value)} />
            Bireysel
          </label>
          <label>
            <input type="radio" value="kurumsal" checked={userType === 'kurumsal'} onChange={(e) => setUserType(e.target.value)} />
            Kurumsal
          </label>
        </div>

        {userType === 'bireysel' ? <BireyselFields formData={formData} onChange={onChange} /> : <KurumsalFields formData={formData} onChange={onChange} />}
        
        <hr/>
        <h4>İletişim ve Adres Bilgileri</h4>
        <div className="form-grid">
            <div className="form-group">
                <label htmlFor="email">Email</label>
                <input type="email" id="email" name="email" value={formData.email} onChange={onChange} required />
            </div>
            <div className="form-group">
                <label htmlFor="password">Parola</label>
                <input type="password" id="password" name="password" value={formData.password} onChange={onChange} required minLength="6" />
            </div>
            <div className="form-group">
                <label htmlFor="province">İl</label>
                <select id="province" name="province" value={formData.province} onChange={handleProvinceChange} required>
                    <option value="">İl Seçiniz</option>
                    {cityData.map(p => <option key={p.plaka} value={p.il}>{p.il}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label htmlFor="district">İlçe</label>
                <select id="district" name="district" value={formData.district} onChange={onChange} required disabled={!formData.province}>
                    <option value="">İlçe Seçiniz</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="form-group grid-span-2">
                <label htmlFor="fullAddress">Açık Adres</label>
                <textarea id="fullAddress" name="fullAddress" value={formData.fullAddress} onChange={onChange} required rows="3"></textarea>
            </div>
        </div>

        <button type="submit" className="submit-btn">Kayıt Ol</button>
        <p className="form-footer">
          Zaten bir hesabınız var mı? <Link to="/login">Giriş Yapın</Link>
        </p>
      </form>
    </div>
  );
}

export default RegisterPage;