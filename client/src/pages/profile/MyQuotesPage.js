import React, { useEffect, useState, useContext } from 'react';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './MyQuotesPage.css';

const MyQuotesPage = () => {
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
    <div className="my-quotes-page">
      <h3>Tekliflerim</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Tarih</th>
            <th>Durum</th>
            <th>PDF</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => {
            const statusMap = {
              requested: { text: 'Talep Edildi', className: 'status-talep-edildi' },
              sent: { text: 'Tamamlandı', className: 'status-tamamlandi' },
              completed: { text: 'Tamamlandı', className: 'status-tamamlandi' }
            };
            const statusInfo = statusMap[q.status] || { text: q.status, className: '' };
            return (
              <tr key={q._id}>
                <td>{new Date(q.createdAt).toLocaleDateString('tr-TR')}</td>
                <td><span className={`status-chip ${statusInfo.className}`}>{statusInfo.text}</span></td>
                <td>
                {q.pdfUrl ? (
                  <a
                    className="btn btn-sm btn-secondary"
                    href={q.pdfUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                  >
                    İndir
                  </a>
                ) : (
                  '-'
                )}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
    </div>
  );
};

export default MyQuotesPage;
