import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import './Form.css';
import cityData from '../data/turkey-provinces-districts.json';

function RegisterPage() {
  const [userType, setUserType] = useState('bireysel');
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    tcKimlik: '',
    companyTitle: '',
    taxNumber: '',
    taxOffice: '',
    province: '',
    district: '',
    fullAddress: ''
  });
  const [districts, setDistricts] = useState([]);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
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
    setError('');
    setSuccess('');

    // Backend'e gönderilecek veriyi hazırla
    const submissionData = {
      userType,
      name: userType === 'kurumsal' ? formData.name : formData.name, // Kurumsalda yetkili adı, bireyselde ad soyad
      companyTitle: userType === 'kurumsal' ? formData.companyTitle : undefined,
      email: formData.email,
      password: formData.password,
      address: {
        province: formData.province,
        district: formData.district,
        fullAddress: formData.fullAddress
      },
      taxOffice: formData.taxOffice,
      tcKimlik: userType === 'bireysel' ? formData.tcKimlik : undefined,
      taxNumber: userType === 'kurumsal' ? formData.taxNumber : undefined
    };

    try {
      const response = await fetch('http://localhost:5001/api/users/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(submissionData),
      });
      const data = await response.json();
      if (!response.ok) throw new Error(data.msg || 'Kayıt işlemi başarısız.');
      
      setSuccess('Kayıt başarılı! Giriş sayfasına yönlendiriliyorsunuz...');
      setTimeout(() => navigate('/login'), 2000);
    } catch (err) {
      setError(err.message);
    }
  };
  
  // Bireysel ve Kurumsal form alanlarını ayrı bileşenler olarak düşünmek kodu temizler
  const BireyselFields = () => (
    <div className="form-grid">
      <div className="form-group grid-span-2">
        <label>Ad Soyad</label>
        <input type="text" name="name" value={formData.name} onChange={onChange} required />
      </div>
      <div className="form-group">
        <label>TC Kimlik Numarası</label>
        <input type="text" name="tcKimlik" value={formData.tcKimlik} onChange={onChange} required />
      </div>
      <div className="form-group">
        <label>Vergi Dairesi</label>
        <input type="text" name="taxOffice" value={formData.taxOffice} onChange={onChange} required />
      </div>
    </div>
  );

  const KurumsalFields = () => (
     <div className="form-grid">
        <div className="form-group grid-span-2">
          <label>Firma Ünvanı</label>
          <input type="text" name="companyTitle" value={formData.companyTitle} onChange={onChange} required />
        </div>
        <div className="form-group grid-span-2">
          <label>Yetkili Adı Soyadı</label>
          <input type="text" name="name" value={formData.name} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Vergi Numarası</label>
          <input type="text" name="taxNumber" value={formData.taxNumber} onChange={onChange} required />
        </div>
        <div className="form-group">
          <label>Vergi Dairesi</label>
          <input type="text" name="taxOffice" value={formData.taxOffice} onChange={onChange} required />
        </div>
      </div>
  );


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

        {error && <p className="error-message">{error}</p>}
        {success && <p className="success-message">{success}</p>}

        {userType === 'bireysel' ? <BireyselFields /> : <KurumsalFields />}
        
        <hr/>
        <h4>İletişim ve Adres Bilgileri</h4>
        <div className="form-grid">
            <div className="form-group">
                <label>Email</label>
                <input type="email" name="email" value={formData.email} onChange={onChange} required />
            </div>
            <div className="form-group">
                <label>Parola</label>
                <input type="password" name="password" value={formData.password} onChange={onChange} required minLength="6" />
            </div>
            <div className="form-group">
                <label>İl</label>
                <select name="province" value={formData.province} onChange={handleProvinceChange} required>
                    <option value="">İl Seçiniz</option>
                    {cityData.map(p => <option key={p.plaka} value={p.il}>{p.il}</option>)}
                </select>
            </div>
            <div className="form-group">
                <label>İlçe</label>
                <select name="district" value={formData.district} onChange={onChange} required disabled={!formData.province}>
                    <option value="">İlçe Seçiniz</option>
                    {districts.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
            </div>
            <div className="form-group grid-span-2">
                <label>Açık Adres</label>
                <textarea name="fullAddress" value={formData.fullAddress} onChange={onChange} required rows="3"></textarea>
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