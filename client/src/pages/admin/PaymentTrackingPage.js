import React, { useContext, useEffect, useState } from 'react';
import { AuthContext } from '../../context/AuthContext';
import './AdminTable.css';
import { saveAs } from 'file-saver';

function PaymentTrackingPage() {
  const { authToken } = useContext(AuthContext);
  const [customers, setCustomers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [sortKey, setSortKey] = useState('');
  const [sortDir, setSortDir] = useState('asc');
  const [error, setError] = useState('');

  // filters
  const [noPaymentDays, setNoPaymentDays] = useState('');
  const [avgDueDaysGreater, setAvgDueDaysGreater] = useState('');
  const [paymentMethod, setPaymentMethod] = useState('');
  const [minTotalPaid, setMinTotalPaid] = useState('');
  const [maxTotalPaid, setMaxTotalPaid] = useState('');
  const [minAvgDueDays, setMinAvgDueDays] = useState('');
  const [maxAvgDueDays, setMaxAvgDueDays] = useState('');
  const [lastPaymentBefore, setLastPaymentBefore] = useState('');

  const fetchData = async () => {
    const sortFunc = (a, b, key) => {
      const av = a[key] ?? 0;
      const bv = b[key] ?? 0;
      return av > bv ? 1 : av < bv ? -1 : 0;
    };

    try {
      setLoading(true);
      const params = new URLSearchParams();
      if (noPaymentDays) params.append('noPaymentDays', noPaymentDays);
      if (avgDueDaysGreater) params.append('avgDueDaysGreater', avgDueDaysGreater);
      if (paymentMethod) params.append('paymentMethod', paymentMethod);
      if (minTotalPaid) params.append('minTotalPaid', minTotalPaid);
      if (maxTotalPaid) params.append('maxTotalPaid', maxTotalPaid);
      if (minAvgDueDays) params.append('minAvgDueDays', minAvgDueDays);
      if (maxAvgDueDays) params.append('maxAvgDueDays', maxAvgDueDays);
      if (lastPaymentBefore) params.append('lastPaymentBefore', lastPaymentBefore);

      const res = await fetch(`/api/payments/customers?${params.toString()}`, {
        headers: { 'Authorization': `Bearer ${authToken}` }
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.msg || 'Veriler alınamadı');
      if (sortKey) {
          data.sort((a,b)=> sortFunc(a,b,sortKey) * (sortDir==='asc'?1:-1));
        }
        setCustomers(data);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (authToken) fetchData();
    // eslint-disable-next-line
  }, [authToken]);

  const applyFilters = () => fetchData();
  const toggleSort = (key) => {
    if (sortKey === key) {
      setSortDir(prev=> prev==='asc'?'desc':'asc');
    } else {
      setSortKey(key);
      setSortDir('asc');
    }
  };

  const exportCSV = () => {
    const headers = ['Müşteri','Son Ödeme','Toplam','Avg Vade'];
    const rows = customers.map(c=>[
      c.customer.name,
      c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('tr-TR') : '',
      c.totalPaid.toFixed(2),
      c.avgDueDays?c.avgDueDays.toFixed(0):''
    ]);
    const csvContent = [headers, ...rows].map(r=>r.join(';')).join('\n');
    const blob = new Blob([csvContent], {type:'text/csv;charset=utf-8'});
    saveAs(blob, 'odeme_takip.csv');
  };

  const clearFilters = () => {
    setNoPaymentDays('');
    setAvgDueDaysGreater('');
    setPaymentMethod('');
    setMinTotalPaid('');
    setMaxTotalPaid('');
    setMinAvgDueDays('');
    setMaxAvgDueDays('');
    setLastPaymentBefore('');
  };

  if (loading) return <div className="loading-container">Yükleniyor...</div>;
  if (error) return <div className="error-container">Hata: {error}</div>;

  return (
    <div className="admin-page-container">
      <h1>Ödeme Takip</h1>

      <div className="filter-container">
        <div className="form-group">
          <label>Son Ödeme Yapmayan (gün)</label>
          <input type="number" value={noPaymentDays} onChange={e => setNoPaymentDays(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Ortalama Vade &gt; (gün)</label>
          <input type="number" value={avgDueDaysGreater} onChange={e => setAvgDueDaysGreater(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Ödeme Yöntemi</label>
          <select value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>
            <option value="">Hepsi</option>
            <option value="Nakit">Nakit</option>
            <option value="Kredi Kartı">Kredi Kartı</option>
            <option value="Banka">Banka</option>
            <option value="Çek">Çek</option>
            <option value="Senet">Senet</option>
          </select>
        </div>
        <div className="form-group">
          <label>Min Toplam Ödeme (₺)</label>
          <input type="number" value={minTotalPaid} onChange={e => setMinTotalPaid(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Max Toplam Ödeme (₺)</label>
          <input type="number" value={maxTotalPaid} onChange={e => setMaxTotalPaid(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Min Avg Vade (gün)</label>
          <input type="number" value={minAvgDueDays} onChange={e => setMinAvgDueDays(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Max Avg Vade (gün)</label>
          <input type="number" value={maxAvgDueDays} onChange={e => setMaxAvgDueDays(e.target.value)} />
        </div>
        <div className="form-group">
          <label>Son Ödeme Tarihi Öncesi</label>
          <input type="date" value={lastPaymentBefore} onChange={e => setLastPaymentBefore(e.target.value)} />
        </div>
        <button onClick={applyFilters} className="apply-filter-btn">Uygula</button>
        <button onClick={clearFilters} className="clear-filter-btn">Temizle</button>
        <button onClick={exportCSV} className="export-btn">CSV İndir</button>
      </div>

      <div className="admin-table-container">
        <table className="admin-table">
          <thead>
            <tr>
              <th onClick={()=>toggleSort('customer.name')}>Müşteri</th>
              <th onClick={()=>toggleSort('lastPaymentDate')}>Son Ödeme Tarihi</th>
              <th onClick={()=>toggleSort('totalPaid')}>Toplam Ödeme {sortKey==='totalPaid'&&(sortDir==='asc'?'▲':'▼')}</th>
              <th onClick={()=>toggleSort('avgDueDays')}>Ortalama Vade (gün) {sortKey==='avgDueDays'&&(sortDir==='asc'?'▲':'▼')}</th>
            </tr>
          </thead>
          <tbody>
            {customers.map(c => (
              <tr key={c._id}>
                <td>{c.customer.name}</td>
                <td>{c.lastPaymentDate ? new Date(c.lastPaymentDate).toLocaleDateString('tr-TR') : '—'}</td>
                <td>{c.totalPaid.toFixed(2)} ₺</td>
                <td>{c.avgDueDays ? c.avgDueDays.toFixed(0) : '—'}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default PaymentTrackingPage;
