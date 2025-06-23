import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './AccountPage.css'; // Stil dosyasını ekleyelim

function AccountPage() {
  const { authToken } = useContext(AuthContext);
  const [account, setAccount] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAccountDetails = async () => {
      if (!authToken) return;
      try {
        setLoading(true);
        const res = await fetch('/api/supplier/account', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) {
          throw new Error(data.msg || 'Cari bilgileri alınamadı.');
        }
        setAccount(data);
      } catch (err) {
        setError(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchAccountDetails();
  }, [authToken]);

  if (loading) return <div className="loading-container">Cari bilgileri yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="supplier-account-page">
      <h1>Cari Hesap Ekstresi</h1>
      {account && (
        <div className="account-details-card">
          <div className="card-header">
            <h2>{account.companyTitle}</h2>
            <p>{account.name}</p>
          </div>
          <div className="card-body">
            <div className="detail-item">
              <span className="detail-label">Email:</span>
              <span className="detail-value">{account.email}</span>
            </div>
            <div className="balance-item">
              <span className="balance-label">Güncel Bakiye:</span>
              <span className={`balance-value ${account.currentAccountBalance >= 0 ? 'positive' : 'negative'}`}>
                ₺{account.currentAccountBalance.toFixed(2)}
              </span>
            </div>
          </div>
          <div className="card-footer">
            <p>Bu ekstre, platformumuzla olan güncel finansal durumunuzu özetlemektedir.</p>
          </div>
        </div>
      )}
    </div>
  );
}

export default AccountPage;
