import React, { useState, useEffect, useContext } from 'react';
import { API_BASE_URL } from '../../config/api';
import { AuthContext } from '../../context/AuthContext';
import './AdminForm.css';
import { toast } from 'react-toastify';

function SettingsPage() {
    const [settings, setSettings] = useState({
        shippingFreeThreshold: 0,
        monthlyInterestRate: 0,
        currencyRates: []
    });
    const [loading, setLoading] = useState(true);
    const { authToken } = useContext(AuthContext);

    useEffect(() => {
        const fetchSettings = async () => {
            try {
                const res = await fetch(`${API_BASE_URL}/api/settings`, {
                    headers: { 'Authorization': `Bearer ${authToken}` }
                });
                const data = await res.json();
                if (!res.ok) throw new Error(data.msg || 'Ayarlar alınamadı.');
                setSettings(data);
            } catch (error) {
                toast.error(error.message);
            } finally {
                setLoading(false);
            }
        };
        if (authToken) {
            fetchSettings();
        }
    }, [authToken]);

    const handleChange = (e) => {
        const { name, value } = e.target;
        setSettings(prev => ({ ...prev, [name]: value }));
    };

    const handleRateChange = (index, field, value) => {
        const updatedRates = [...settings.currencyRates];
        updatedRates[index][field] = value;
        setSettings(prev => ({...prev, currencyRates: updatedRates}));
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        try {
            const res = await fetch(`${API_BASE_URL}/api/settings`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${authToken}`
                },
                body: JSON.stringify(settings)
            });
            const data = await res.json();
            if (!res.ok) throw new Error(data.msg || 'Ayarlar güncellenemedi.');
            toast.success('Ayarlar başarıyla güncellendi.');
        } catch (error) {
            toast.error(error.message);
        }
    };

    if (loading) return <div>Yükleniyor...</div>;

    return (
        <div className="admin-page-container">
            <h1>Genel Site Ayarları</h1>
            <form onSubmit={handleSubmit} className="admin-form" style={{ maxWidth: '800px' }}>
                
                <div className="form-section">
                    <h3>Ticari Ayarlar</h3>
                    <div className="form-group">
                        <label htmlFor="shippingFreeThreshold">Ücretsiz Kargo Limiti (₺)</label>
                        <p>Bu tutar üzerindeki siparişlerde kargo ücreti alınmaz.</p>
                        <input 
                            type="number"
                            id="shippingFreeThreshold"
                            name="shippingFreeThreshold"
                            value={settings.shippingFreeThreshold}
                            onChange={handleChange}
                        />
                    </div>
                    <div className="form-group">
                        <label htmlFor="monthlyInterestRate">Aylık Vade Farkı Oranı (%)</label>
                        <input type="number" id="monthlyInterestRate" name="monthlyInterestRate" value={settings.monthlyInterestRate} onChange={handleChange} />
                    </div>
                </div>

                <div className="form-section">
                    <h3>Döviz Kurları (Manuel)</h3>
                    {settings.currencyRates && settings.currencyRates.map((rate, index) => (
                        <div key={rate.code} className="currency-rate-group">
                            <span className="currency-code">{rate.code}</span>
                            <div className="form-group">
                                <label>Alış</label>
                                <input type="number" step="0.01" value={rate.buy} onChange={(e) => handleRateChange(index, 'buy', e.target.value)} />
                            </div>
                            <div className="form-group">
                                <label>Satış</label>
                                <input type="number" step="0.01" value={rate.sell} onChange={(e) => handleRateChange(index, 'sell', e.target.value)} />
                            </div>
                        </div>
                    ))}
                </div>

                <button type="submit" className="submit-btn">Ayarları Kaydet</button>
            </form>
        </div>
    );
}

export default SettingsPage;