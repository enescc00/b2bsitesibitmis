import React, { useEffect, useState, useContext } from 'react';
import { Link } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';

const QuoteListPage = () => {
  const { authToken } = useContext(AuthContext);
  const [quotes, setQuotes] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchQuotes = async () => {
      try {
        const res = await fetch('/api/quotes?status=requested', {
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
    <div className="quote-list-page">
      <h3>Bekleyen Teklif İstekleri</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>ID</th>
            <th>Müşteri</th>
            <th>İstek Tarihi</th>
            <th>Aksiyon</th>
          </tr>
        </thead>
        <tbody>
          {quotes.map((q) => (
            <tr key={q._id}>
                            <td>{q.quoteNumber ? `#${String(q.quoteNumber).padStart(4, '0')}` : q._id.substring(0, 8)}</td>
              <td>{q.customer?.name}</td>
              <td>{new Date(q.createdAt).toLocaleDateString('tr-TR')}</td>
              <td>
                <Link className="btn btn-primary btn-sm" to={`/admin/quote/${q._id}`}>
                  Düzenle
                </Link>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
};

export default QuoteListPage;
