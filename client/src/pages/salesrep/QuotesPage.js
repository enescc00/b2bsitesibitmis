import React, { useEffect, useState, useContext } from 'react';
import '../profile/MyQuotesPage.css';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const QuotesPage = () => {
  const { authToken } = useContext(AuthContext);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/quotes/my', {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Teklifler alınamadı');
        setQuotes(data);
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuotes();
  }, [authToken]);

  if (loading) return <div className="loading-container">Yükleniyor...</div>;

  return (
    <div className="salesrep-quotes-page">
      <h3>Tekliflerim</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Müşteri</th>
            <th>Tarih</th>
            <th>Durum</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q._id}>
              <td>{q.customer?.companyTitle || q.customer?.name}</td>
              <td>{new Date(q.createdAt).toLocaleDateString('tr-TR')}</td>
              <td><span className={`status-chip ${q.status === 'requested' ? 'status-talep-edildi' : 'status-tamamlandi'}`}>{q.status === 'requested' ? 'Talep Edildi' : 'Tamamlandı'}</span></td>
              <td>
                {q.status === 'sent' ? (
                  <a className="btn btn-sm btn-secondary" href={q.pdfUrl} target="_blank" rel="noopener noreferrer">
                    İndir
                  </a>
                ) : (
                  '-'
                )}
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuotesPage;
