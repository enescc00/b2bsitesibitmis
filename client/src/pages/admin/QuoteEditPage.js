import React, { useEffect, useState, useContext } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { AuthContext } from '../../context/AuthContext';
import { toast } from 'react-toastify';
import './QuoteEditPage.css';

const QuoteEditPage = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const { authToken } = useContext(AuthContext);
  const [quote, setQuote] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    const fetchQuote = async () => {
      try {
        const res = await fetch(`/api/quotes/${id}`, {
          headers: { Authorization: `Bearer ${authToken}` },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.msg || 'Teklif alınamadı');
        // Map to editable rows
        const mapped = data.items.map((it) => ({
          productId: it.product._id,
          name: it.product.name,
          qty: it.qty,
          costPrice: it.costPrice,
          profitPercent: it.profitPercent ?? 0,
          salePrice: it.salePrice ?? it.costPrice,
        }));
        setQuote({ ...data, items: mapped });
      } catch (err) {
        toast.error(err.message);
      } finally {
        setLoading(false);
      }
    };
    fetchQuote();
  }, [id, authToken]);

  const handleChange = (index, field, value) => {
    setQuote((prev) => {
      const newItems = [...prev.items];
      newItems[index] = { ...newItems[index], [field]: value };
      // auto calculate salePrice if profitPercent changed
      if (field === 'profitPercent') {
        const profit = parseFloat(value) || 0;
        const base = newItems[index].costPrice;
        newItems[index].salePrice = parseFloat((base * (1 + profit / 100)).toFixed(2));
      }
      return { ...prev, items: newItems };
    });
  };

  const handlePrepare = async () => {
    setSaving(true);
    try {
      const payload = {
        items: quote.items.map((it) => ({
          productId: it.productId,
          profitPercent: parseFloat(it.profitPercent),
          salePrice: parseFloat(it.salePrice),
        })),
      };
      const res = await fetch(`/api/quotes/${id}/prepare`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${authToken}`,
        },
        body: JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Kaydedilemedi');
      toast.success('Teklif hazırlandı');
      setQuote((q) => ({ ...q, status: 'prepared' }));
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  const handleSend = async () => {
    setSaving(true);
    try {
      const res = await fetch(`/api/quotes/${id}/send`, {
        method: 'PUT',
        headers: { Authorization: `Bearer ${authToken}` },
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Gönderilemedi');
      toast.success('Teklif gönderildi');
      navigate(-1);
    } catch (err) {
      toast.error(err.message);
    } finally {
      setSaving(false);
    }
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;

  return (
    <div className="quote-edit-page">
      <h3>Teklif Düzenle</h3>
      <table className="admin-table">
        <thead>
          <tr>
            <th>Ürün</th>
            <th>Adet</th>
            <th>Maliyet ₺</th>
            <th>Kâr %</th>
            <th>Satış Fiyatı ₺</th>
          </tr>
        </thead>
        <tbody>
          {quote.items.map((item, idx) => (
            <tr key={item.productId}>
              <td>{item.name}</td>
              <td>{item.qty}</td>
              <td>{item.costPrice.toFixed(2)}</td>
              <td>
                <input
                  type="number"
                  value={item.profitPercent}
                  onChange={(e) => handleChange(idx, 'profitPercent', e.target.value)}
                  style={{ width: '70px' }}
                />
              </td>
              <td>
                <input
                  type="number"
                  value={item.salePrice}
                  onChange={(e) => handleChange(idx, 'salePrice', e.target.value)}
                  style={{ width: '90px' }}
                />
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      <div className="action-buttons">
        <button className="btn btn-primary" disabled={saving} onClick={handlePrepare}>
          Kaydet
        </button>
        {quote.status === 'prepared' && (
          <button className="btn btn-success" disabled={saving} onClick={handleSend}>
            Gönder & PDF Oluştur
          </button>
        )}
      </div>
    </div>
  );
};

export default QuoteEditPage;
