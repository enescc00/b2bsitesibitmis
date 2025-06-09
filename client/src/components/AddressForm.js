import React, { useState, useEffect } from 'react';
import cityData from '../data/turkey-provinces-districts.json';

// Bu bileşen, adres verisini ve ilgili fonksiyonları dışarıdan prop olarak alır.
function AddressForm({ addressData, onAddressChange, onSubmit }) {
  const [districts, setDistricts] = useState([]);

  // Eğer mevcut bir il varsa, ilçe listesini doldur
  useEffect(() => {
    if (addressData.province) {
      const provinceData = cityData.find(p => p.il === addressData.province);
      setDistricts(provinceData ? provinceData.ilceleri : []);
    }
  }, [addressData.province]);

  const handleProvinceChange = (e) => {
    const province = e.target.value;
    onAddressChange({
      target: { name: 'province', value: province }
    });
    // İlçe'yi de sıfırla
    onAddressChange({
      target: { name: 'district', value: '' }
    });

    const provinceData = cityData.find(p => p.il === province);
    setDistricts(provinceData ? provinceData.ilceleri : []);
  };

  return (
    <form onSubmit={onSubmit} className="address-form">
      <div className="form-group">
        <label>Adres Başlığı (Örn: İş Adresim)</label>
        <input type="text" name="addressTitle" value={addressData.addressTitle} onChange={onAddressChange} required />
      </div>
      <div className="form-grid">
        <div className="form-group">
            <label>İl</label>
            <select name="province" value={addressData.province} onChange={handleProvinceChange} required>
                <option value="">İl Seçiniz</option>
                {cityData.map(p => <option key={p.plaka} value={p.il}>{p.il}</option>)}
            </select>
        </div>
        <div className="form-group">
            <label>İlçe</label>
            <select name="district" value={addressData.district} onChange={onAddressChange} required disabled={!addressData.province}>
                <option value="">İlçe Seçiniz</option>
                {districts.map(d => <option key={d} value={d}>{d}</option>)}
            </select>
        </div>
      </div>
      <div className="form-group">
            <label>Açık Adres</label>
            <textarea name="fullAddress" value={addressData.fullAddress} onChange={onAddressChange} required rows="3"></textarea>
      </div>
      <button type="submit" className="submit-btn">Adresi Kaydet</button>
    </form>
  );
}

export default AddressForm;