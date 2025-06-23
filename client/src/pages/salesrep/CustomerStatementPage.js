import React, { useEffect, useState, useContext } from 'react';
import { useParams } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './CustomerStatementPage.css';

function CustomerStatementPage() {
  const { customerId } = useParams();
  const { authToken } = useContext(AuthContext);
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchStatement = async () => {
      if (!authToken) return;
      setLoading(true);
      try {
        const res = await fetch(`/api/salesrep/customers/${customerId}/statement`, {
          headers: { Authorization: `Bearer ${authToken}` }
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Ekstre getirilemedi.');
        setTransactions(data);
      } catch (err) {
        setError(err.message);
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchStatement();
  }, [authToken, customerId]);

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">{error}</div>;

  return (
    <div className="customer-statement-page">
      <h1>Cari Ekstre</h1>
      <table className="statement-table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Açıklama</th>
            <th>Tutar (₺)</th>
            <th>Bakiye (₺)</th>
          </tr>
        </thead>
        <tbody>
          {transactions.length === 0 ? (
            <tr><td colSpan="4" style={{textAlign:'center'}}>Hareket bulunamadı.</td></tr>
          ) : (
            transactions.map((t, idx) => (
              <tr key={idx}>
                <td>{new Date(t.date).toLocaleDateString('tr-TR')}</td>
                <td>{t.description}</td>
                <td className={t.amount < 0 ? 'negative' : 'positive'}>{t.amount.toFixed(2)}</td>
                <td>{t.balance.toFixed(2)}</td>
              </tr>
            ))
          )}
        </tbody>
      </table>
    </div>
  );
}

export default CustomerStatementPage;
